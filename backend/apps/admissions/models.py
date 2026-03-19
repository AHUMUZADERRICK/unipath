from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class University(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Course(models.Model):
    name = models.CharField(max_length=255)
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="courses")
    cutoff_weight = models.DecimalField(max_digits=6, decimal_places=2)
    duration = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )

    class Meta:
        ordering = ["name"]
        unique_together = ("name", "university")

    def __str__(self) -> str:
        return f"{self.name} - {self.university.name}"


class CourseCutoffHistory(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="cutoff_history")
    year = models.PositiveSmallIntegerField()
    cutoff_weight = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        ordering = ["-year"]
        unique_together = ("course", "year")

    def __str__(self) -> str:
        return f"{self.course.name} ({self.year})"


class CourseSubjectRequirement(models.Model):
    CATEGORY_ESSENTIAL = "essential"
    CATEGORY_RELEVANT = "relevant"
    CATEGORY_DESIRABLE = "desirable"

    CATEGORY_CHOICES = [
        (CATEGORY_ESSENTIAL, "Essential"),
        (CATEGORY_RELEVANT, "Relevant"),
        (CATEGORY_DESIRABLE, "Desirable"),
    ]

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="subject_requirements"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="course_requirements")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    class Meta:
        ordering = ["course", "subject"]
        unique_together = ("course", "subject")

    def __str__(self) -> str:
        return f"{self.course.name} - {self.subject.name} ({self.category})"


class StudentSubmission(models.Model):
    GENDER_MALE = "male"
    GENDER_FEMALE = "female"

    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
    ]

    candidate = models.ForeignKey(
        "Candidate",
        on_delete=models.SET_NULL,
        related_name="submissions",
        null=True,
        blank=True,
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Submission {self.id}"


class StudentResult(models.Model):
    submission = models.ForeignKey(
        StudentSubmission, on_delete=models.CASCADE, related_name="uace_results"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    grade = models.CharField(max_length=2)

    class Meta:
        ordering = ["subject__name"]
        unique_together = ("submission", "subject")

    def __str__(self) -> str:
        return f"{self.subject.name}: {self.grade}"


class UCEGrade(models.Model):
    submission = models.ForeignKey(
        StudentSubmission, on_delete=models.CASCADE, related_name="uce_grades"
    )
    subject = models.CharField(max_length=120, blank=True)
    grade = models.CharField(max_length=2)

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"UCE {self.grade}"


class Candidate(models.Model):
    GENDER_MALE = "male"
    GENDER_FEMALE = "female"

    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
    ]

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=128, blank=True)
    whatsapp_number = models.CharField(max_length=20)
    index_number = models.CharField(max_length=40)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("whatsapp_number", "index_number")

    def __str__(self) -> str:
        return f"{self.whatsapp_number} / {self.index_number}"


class AdminSessionToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_sessions")
    token = models.CharField(max_length=120, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Admin session for {self.user.username}"


class PlannerCourse(models.Model):
    """Stores a candidate's ranked course preferences for their application plan."""
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="planned_courses"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="planned_by_candidates"
    )
    rank = models.PositiveSmallIntegerField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["rank"]
        unique_together = ("candidate", "course")

    def __str__(self) -> str:
        return f"{self.candidate.whatsapp_number} - {self.course.name} (#{self.rank})"


class StudentStrengthProfile(models.Model):
    """Stores the analyzed strength profile for a student submission."""
    submission = models.OneToOneField(
        StudentSubmission,
        on_delete=models.CASCADE,
        related_name="strength_profile"
    )
    strong_subjects = models.JSONField(default=list)  # List of {subject_name, grade, strength_level}
    recommended_course_ids = models.JSONField(default=list)
    insights = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Strength profile for submission {self.submission.id}"
