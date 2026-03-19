from decimal import Decimal
from io import BytesIO

from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from openpyxl import Workbook
from rest_framework.test import APIClient

from .models import (
    AdminSessionToken,
    Candidate,
    Course,
    CourseCutoffHistory,
    CourseSubjectRequirement,
    StudentSubmission,
    Subject,
    University,
)
from .services import calculate_weight, evaluate_courses


class WeightEngineTests(TestCase):
    def setUp(self):
        self.university, _ = University.objects.get_or_create(
            name="Test University", defaults={"location": "Kampala"}
        )
        self.course, _ = Course.objects.get_or_create(
            name="Computer Science",
            university=self.university,
            defaults={"cutoff_weight": "43.00", "duration": 3},
        )

        self.math, _ = Subject.objects.get_or_create(name="Mathematics")
        self.physics, _ = Subject.objects.get_or_create(name="Physics")
        self.chemistry, _ = Subject.objects.get_or_create(name="Chemistry")

        CourseSubjectRequirement.objects.get_or_create(
            course=self.course,
            subject=self.math,
            defaults={"category": CourseSubjectRequirement.CATEGORY_ESSENTIAL},
        )
        CourseSubjectRequirement.objects.get_or_create(
            course=self.course,
            subject=self.physics,
            defaults={"category": CourseSubjectRequirement.CATEGORY_RELEVANT},
        )
        CourseSubjectRequirement.objects.get_or_create(
            course=self.course,
            subject=self.chemistry,
            defaults={"category": CourseSubjectRequirement.CATEGORY_DESIRABLE},
        )

    def test_calculate_weight_with_female_bonus(self):
        weight = calculate_weight(
            student_results={"Mathematics": "B", "Physics": "C", "Chemistry": "B"},
            course_requirements=self.course.subject_requirements.all(),
            uce_grades=["D1", "C3", "P7"],
            gender="female",
        )
        self.assertEqual(weight, Decimal("30.10"))

    def test_calculate_weight_uses_best_three_uace_subjects(self):
        weight = calculate_weight(
            student_results={
                "Mathematics": "A",
                "Physics": "B",
                "Chemistry": "A",
                "ICT": "A",
            },
            course_requirements=self.course.subject_requirements.all(),
            uce_grades=[],
            gender="male",
        )
        self.assertEqual(weight, Decimal("34.00"))

    def test_course_not_eligible_if_essential_subject_missing(self):
        evaluations = evaluate_courses(
            student_results={"Physics": "A", "Chemistry": "A", "ICT": "A"},
            uce_grades=["D1", "C3", "C4"],
            gender="male",
        )
        computer_science = next((item for item in evaluations if item.course_name == "Computer Science"), None)
        self.assertIsNotNone(computer_science)
        self.assertFalse(computer_science.is_eligible)


class CalculateWeightApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        makerere, _ = University.objects.get_or_create(
            name="Makerere University", defaults={"location": "Kampala"}
        )
        cs, _ = Course.objects.get_or_create(
            name="Computer Science",
            university=makerere,
            defaults={"cutoff_weight": "30.00", "duration": 3},
        )

        subjects = {
            name: Subject.objects.get_or_create(name=name)[0]
            for name in ["Mathematics", "Physics", "Chemistry", "ICT"]
        }
        for subject_name, category in {
            "Mathematics": "essential",
            "Physics": "relevant",
            "Chemistry": "desirable",
            "ICT": "relevant",
        }.items():
            CourseSubjectRequirement.objects.get_or_create(
                course=cs,
                subject=subjects[subject_name],
                defaults={"category": category},
            )

    def test_calculate_weight_endpoint(self):
        response = self.client.post(
            "/api/calculate-weight",
            {
                "gender": "male",
                "uace_results": {
                    "Mathematics": "B",
                    "Physics": "C",
                    "Chemistry": "B",
                    "ICT": "C",
                },
                "uce_grades": ["D1", "C3", "C4", "C5", "D2"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("final_weight", response.data)
        self.assertIn("eligible_courses", response.data)
        self.assertIn("borderline_courses", response.data)
        self.assertIn("course_evaluations", response.data)
        self.assertIn("recommendation_groups", response.data)
        self.assertTrue(len(response.data["course_evaluations"]) > 0)
        first_evaluation = response.data["course_evaluations"][0]
        self.assertIn("explanation", first_evaluation)
        self.assertIn("is_eligible", first_evaluation)
        self.assertIn("recommendation_band", first_evaluation)

    def test_calculate_weight_endpoint_uses_candidate_gender(self):
        candidate = Candidate.objects.create(
            whatsapp_number="+256700000001",
            index_number="U001/0001",
            gender="female",
        )

        response = self.client.post(
            "/api/calculate-weight",
            {
                "candidate_id": candidate.id,
                "uace_results": {
                    "Mathematics": "B",
                    "Physics": "C",
                    "Chemistry": "B",
                },
                "uce_grades": ["D1", "C3", "C4"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        submission = StudentSubmission.objects.latest("id")
        self.assertEqual(submission.candidate_id, candidate.id)
        self.assertEqual(submission.gender, "female")


class CandidateAuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_creates_candidate(self):
        response = self.client.post(
            "/api/auth/signup",
            {
                "first_name": "Amina",
                "last_name": "Nabukeera",
                "email": "amina@example.com",
                "password": "StrongPass123",
                "confirm_password": "StrongPass123",
                "whatsapp_number": "+256700123456",
                "index_number": "U1234/001",
                "gender": "male",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("candidate", response.data)
        self.assertEqual(response.data["candidate"]["gender"], "male")
        self.assertEqual(response.data["candidate"]["email"], "amina@example.com")

    def test_login_returns_candidate(self):
        Candidate.objects.create(
            first_name="Amina",
            last_name="Nabukeera",
            email="amina@example.com",
            password_hash=make_password("StrongPass123"),
            whatsapp_number="+256700123456",
            index_number="U1234/001",
            gender="female",
        )

        response = self.client.post(
            "/api/auth/login",
            {
                "email": "amina@example.com",
                "password": "StrongPass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("candidate", response.data)
        self.assertEqual(response.data["candidate"]["gender"], "female")


class AdminCutoffTemplateTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
        )
        self.client = Client()
        self.client.force_login(self.admin_user)

    def test_download_cutoff_template_returns_csv(self):
        response = self.client.get("/admin/admissions/course/download-cutoffs-template/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("attachment; filename=course_cutoff_template.csv", response["Content-Disposition"])

        csv_content = response.content.decode("utf-8")
        self.assertIn("university,course,cutoff_weight,year,duration", csv_content)

    def test_download_cutoff_history_template_returns_csv(self):
        response = self.client.get("/admin/admissions/course/download-cutoff-history-template/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn(
            "attachment; filename=course_cutoff_history_template.csv",
            response["Content-Disposition"],
        )

        csv_content = response.content.decode("utf-8")
        self.assertIn("university,course,year,cutoff_weight", csv_content)


class AdminPortalApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username="portaladmin",
            email="portaladmin@example.com",
            password="AdminStrong123",
        )
        self.university = University.objects.create(name="Portal University", location="Kampala")
        self.course = Course.objects.create(
            name="Portal Course",
            university=self.university,
            cutoff_weight="40.00",
            duration=3,
        )
        Candidate.objects.create(
            first_name="Portal",
            last_name="Student",
            email="portal.student@example.com",
            password_hash=make_password("StudentPass123"),
            whatsapp_number="+256711000111",
            index_number="U2000/001",
            gender="male",
        )

    def _login_admin(self):
        response = self.client.post(
            "/api/admin/login",
            {"username": "portaladmin", "password": "AdminStrong123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        return response.data["token"]

    def test_admin_login_and_dashboard(self):
        token = self._login_admin()
        response = self.client.get(
            "/api/admin/dashboard",
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("total_candidates", response.data)
        self.assertIn("total_courses", response.data)

    def test_admin_updates_course_cutoff(self):
        token = self._login_admin()
        response = self.client.patch(
            f"/api/admin/courses/{self.course.id}/cutoff",
            {"cutoff_weight": "42.50", "year": 2026},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)

        self.course.refresh_from_db()
        self.assertEqual(str(self.course.cutoff_weight), "42.50")
        self.assertTrue(
            CourseCutoffHistory.objects.filter(course=self.course, year=2026, cutoff_weight="42.50").exists()
        )

    def test_admin_logout_invalidates_session(self):
        token = self._login_admin()
        logout_response = self.client.post(
            "/api/admin/logout",
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(logout_response.status_code, 200)
        self.assertFalse(AdminSessionToken.objects.filter(token=token).exists())

    def test_admin_downloads_cutoff_template_csv(self):
        token = self._login_admin()
        response = self.client.get(
            "/api/admin/templates/cutoff-csv",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("course_cutoff_template.csv", response["Content-Disposition"])
        self.assertIn("university,course,cutoff_weight,year,duration", response.content.decode("utf-8"))

    def test_admin_downloads_cutoff_history_template_csv(self):
        token = self._login_admin()
        response = self.client.get(
            "/api/admin/templates/cutoff-history-csv",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("course_cutoff_history_template.csv", response["Content-Disposition"])
        self.assertIn("university,course,year,cutoff_weight", response.content.decode("utf-8"))

    def test_admin_uploads_cutoff_excel(self):
        token = self._login_admin()

        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["university", "course", "cutoff_weight", "year", "duration"])
        sheet.append(["Portal University", "Portal Course", "43.30", 2027, 4])
        sheet.append(["New University", "New Course", "35.50", 2027, 3])

        stream = BytesIO()
        workbook.save(stream)
        stream.seek(0)

        upload = SimpleUploadedFile(
            "cutoffs.xlsx",
            stream.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        response = self.client.post(
            "/api/admin/cutoffs/upload",
            {"file": upload},
            format="multipart",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated_courses"], 1)
        self.assertEqual(response.data["created_courses"], 1)

        self.course.refresh_from_db()
        self.assertEqual(str(self.course.cutoff_weight), "43.30")
        self.assertTrue(Course.objects.filter(name="New Course", university__name="New University").exists())
