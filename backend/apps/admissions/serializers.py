from rest_framework import serializers

from .constants import UACE_SUBJECTS
from .models import Candidate, Subject


class CandidateSignupSerializer(serializers.Serializer):
    GENDER_CHOICES = ("male", "female")

    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    whatsapp_number = serializers.CharField(max_length=20)
    index_number = serializers.CharField(max_length=40)
    gender = serializers.ChoiceField(choices=GENDER_CHOICES)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class CandidateLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class AdminLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


class AdminCandidateUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=False)
    last_name = serializers.CharField(max_length=100, required=False)
    email = serializers.EmailField(required=False)
    whatsapp_number = serializers.CharField(max_length=20, required=False)
    index_number = serializers.CharField(max_length=40, required=False)
    gender = serializers.ChoiceField(choices=("male", "female"), required=False)


class AdminCourseCutoffUpdateSerializer(serializers.Serializer):
    cutoff_weight = serializers.DecimalField(max_digits=6, decimal_places=2)
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)


class AdminCutoffExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class CalculateWeightInputSerializer(serializers.Serializer):
    GENDER_CHOICES = ("male", "female")
    UACE_GRADE_CHOICES = ("A", "B", "C", "D", "E", "O", "F")
    UCE_GRADE_CHOICES = ("D1", "D2", "C3", "C4", "C5", "C6", "P7", "P8", "F9")

    candidate_id = serializers.IntegerField(required=False)
    gender = serializers.ChoiceField(choices=GENDER_CHOICES, required=False)
    uace_results = serializers.DictField(
        child=serializers.ChoiceField(choices=UACE_GRADE_CHOICES),
        allow_empty=False,
    )
    uce_grades = serializers.ListField(
        child=serializers.ChoiceField(choices=UCE_GRADE_CHOICES),
        allow_empty=True,
    )

    def validate_uace_results(self, value):
        if len(value.keys()) < 3:
            raise serializers.ValidationError("Please provide at least 3 UACE subjects.")

        supported_subjects = set(
            Subject.objects.values_list("name", flat=True)
        ) or set(UACE_SUBJECTS)
        supported_lookup = {subject.strip().lower(): subject for subject in supported_subjects}

        unsupported = []
        for subject in value.keys():
            if subject.strip().lower() not in supported_lookup:
                unsupported.append(subject)

        if unsupported:
            raise serializers.ValidationError(
                "Unsupported UACE subjects: "
                + ", ".join(sorted(unsupported))
                + ". Please select subjects offered in the Uganda A-Level catalog."
            )

        return value

    def validate(self, attrs):
        candidate_id = attrs.get("candidate_id")
        gender = attrs.get("gender")

        if not candidate_id and not gender:
            raise serializers.ValidationError("Provide either candidate_id or gender.")

        if candidate_id:
            if not Candidate.objects.filter(id=candidate_id).exists():
                raise serializers.ValidationError({"candidate_id": "Candidate account not found."})

        return attrs


class EligibleCourseSerializer(serializers.Serializer):
    course = serializers.CharField()
    university = serializers.CharField()
    cutoff = serializers.DecimalField(max_digits=6, decimal_places=2)
    calculated_weight = serializers.DecimalField(max_digits=6, decimal_places=2)
    is_borderline = serializers.BooleanField(required=False)
    recommendation_band = serializers.CharField(required=False)
    explanation = serializers.CharField(required=False)


class CourseEvaluationSerializer(serializers.Serializer):
    course = serializers.CharField()
    university = serializers.CharField()
    cutoff = serializers.DecimalField(max_digits=6, decimal_places=2)
    calculated_weight = serializers.DecimalField(max_digits=6, decimal_places=2)
    is_eligible = serializers.BooleanField()
    is_borderline = serializers.BooleanField(required=False)
    recommendation_band = serializers.CharField(required=False)
    missing_essential_subjects = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=True,
    )
    explanation = serializers.CharField()


class RecommendationGroupsSerializer(serializers.Serializer):
    top_chances = CourseEvaluationSerializer(many=True)
    safe_options = CourseEvaluationSerializer(many=True)
    ambitious_choices = CourseEvaluationSerializer(many=True)


class CalculateWeightResponseSerializer(serializers.Serializer):
    final_weight = serializers.DecimalField(max_digits=7, decimal_places=2)
    eligible_courses = EligibleCourseSerializer(many=True)
    borderline_courses = EligibleCourseSerializer(many=True, required=False)
    course_evaluations = CourseEvaluationSerializer(many=True)
    recommendation_groups = RecommendationGroupsSerializer(required=False)
    strength_profile = serializers.SerializerMethodField(required=False)

    def get_strength_profile(self, obj):
        if "strength_profile" in obj:
            profile = obj["strength_profile"]
            return {
                "strong_subjects": [
                    {
                        "subject_name": s.subject_name,
                        "grade": s.grade,
                        "strength_level": s.strength_level,
                    }
                    for s in profile.strong_subjects
                ],
                "recommended_course_ids": profile.recommended_course_ids,
                "insights": profile.insights,
            }
        return None


class SubjectStrengthSerializer(serializers.Serializer):
    subject_name = serializers.CharField()
    grade = serializers.CharField()
    strength_level = serializers.CharField()


class StrengthProfileSerializer(serializers.Serializer):
    strong_subjects = SubjectStrengthSerializer(many=True)
    recommended_course_ids = serializers.ListField(child=serializers.IntegerField())
    insights = serializers.CharField()


class PlannerCourseCreateUpdateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    rank = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class PlannerCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    course_id = serializers.IntegerField()
    course_name = serializers.CharField()
    university = serializers.CharField()
    rank = serializers.IntegerField()
    notes = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class CourseSubjectRequirementSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    subject_name = serializers.CharField()
    category = serializers.CharField()


class CourseSubjectRequirementUpdateSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    category = serializers.ChoiceField(choices=["essential", "relevant", "desirable"])


class AnalyticsSerializer(serializers.Serializer):
    top_courses = serializers.ListField(
        child=serializers.DictField()
    )
    common_profiles = serializers.ListField(
        child=serializers.DictField()
    )
    total_submissions = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    average_weight = serializers.DecimalField(max_digits=7, decimal_places=2)
