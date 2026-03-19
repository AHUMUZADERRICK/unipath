from django.db import migrations


def seed_data(apps, schema_editor):
    University = apps.get_model("admissions", "University")
    Subject = apps.get_model("admissions", "Subject")
    Course = apps.get_model("admissions", "Course")
    CourseSubjectRequirement = apps.get_model("admissions", "CourseSubjectRequirement")

    universities = {
        "Makerere University": "Kampala",
        "Kyambogo University": "Kampala",
        "Mbarara University of Science and Technology": "Mbarara",
        "Gulu University": "Gulu",
        "Busitema University": "Busia",
    }

    university_objects = {}
    for name, location in universities.items():
        university_objects[name], _ = University.objects.get_or_create(name=name, defaults={"location": location})

    subjects = [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "ICT",
        "Economics",
        "Geography",
        "Fine Art",
        "Entrepreneurship",
    ]

    subject_objects = {}
    for subject_name in subjects:
        subject_objects[subject_name], _ = Subject.objects.get_or_create(name=subject_name)

    course_definitions = [
        {
            "name": "Computer Science",
            "university": "Makerere University",
            "cutoff_weight": "43.00",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "relevant",
                "ICT": "relevant",
                "Chemistry": "desirable",
            },
        },
        {
            "name": "Information Technology",
            "university": "Kyambogo University",
            "cutoff_weight": "41.00",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "ICT": "relevant",
                "Physics": "desirable",
                "Economics": "desirable",
            },
        },
        {
            "name": "Software Engineering",
            "university": "Mbarara University of Science and Technology",
            "cutoff_weight": "42.50",
            "duration": 4,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "relevant",
                "ICT": "relevant",
                "Chemistry": "desirable",
            },
        },
        {
            "name": "Civil Engineering",
            "university": "Busitema University",
            "cutoff_weight": "45.00",
            "duration": 4,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "essential",
                "Chemistry": "relevant",
                "Geography": "desirable",
            },
        },
        {
            "name": "Medicine and Surgery",
            "university": "Makerere University",
            "cutoff_weight": "49.50",
            "duration": 5,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "essential",
                "Physics": "relevant",
                "Mathematics": "desirable",
            },
        },
        {
            "name": "Nursing Science",
            "university": "Gulu University",
            "cutoff_weight": "40.00",
            "duration": 4,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "relevant",
                "Physics": "desirable",
                "Geography": "desirable",
            },
        },
    ]

    for definition in course_definitions:
        course, _ = Course.objects.get_or_create(
            name=definition["name"],
            university=university_objects[definition["university"]],
            defaults={
                "cutoff_weight": definition["cutoff_weight"],
                "duration": definition["duration"],
            },
        )

        for subject_name, category in definition["requirements"].items():
            CourseSubjectRequirement.objects.get_or_create(
                course=course,
                subject=subject_objects[subject_name],
                defaults={"category": category},
            )


def unseed_data(apps, schema_editor):
    University = apps.get_model("admissions", "University")
    University.objects.filter(
        name__in=[
            "Makerere University",
            "Kyambogo University",
            "Mbarara University of Science and Technology",
            "Gulu University",
            "Busitema University",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_code=unseed_data),
    ]
