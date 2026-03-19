from django.db import migrations


def seed_uganda_subjects_and_courses(apps, schema_editor):
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
        "Muni University": "Arua",
        "Kabale University": "Kabale",
        "Lira University": "Lira",
        "Soroti University": "Soroti",
    }

    uace_subjects = [
        "Agriculture",
        "Arabic",
        "Art and Design",
        "Biology",
        "Building Construction",
        "Chemistry",
        "Christian Religious Education",
        "Commerce",
        "Computer Studies",
        "Divinity",
        "Economics",
        "Entrepreneurship Education",
        "Fine Art",
        "Food and Nutrition",
        "French",
        "General Paper",
        "Geography",
        "German",
        "History",
        "ICT",
        "Islamic Religious Education",
        "Kiswahili",
        "Literature in English",
        "Luganda",
        "Mathematics",
        "Music",
        "Nutrition and Food Science",
        "Performing Arts",
        "Physics",
        "Runyankole",
        "Lusoga",
        "Luo",
        "Clothing and Textiles",
        "Sub-Mathematics",
        "Technical Drawing",
    ]

    course_definitions = [
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
            "name": "Bachelor of Dental Surgery",
            "university": "Makerere University",
            "cutoff_weight": "48.20",
            "duration": 5,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "essential",
                "Physics": "relevant",
                "Mathematics": "desirable",
            },
        },
        {
            "name": "Pharmacy",
            "university": "Makerere University",
            "cutoff_weight": "47.40",
            "duration": 4,
            "requirements": {
                "Chemistry": "essential",
                "Biology": "essential",
                "Mathematics": "relevant",
                "Physics": "relevant",
            },
        },
        {
            "name": "Computer Science",
            "university": "Makerere University",
            "cutoff_weight": "43.00",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "relevant",
                "ICT": "relevant",
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
            "name": "Data Science",
            "university": "Muni University",
            "cutoff_weight": "39.50",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "ICT": "relevant",
                "Economics": "relevant",
                "Physics": "desirable",
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
                "Technical Drawing": "desirable",
            },
        },
        {
            "name": "Electrical Engineering",
            "university": "Kyambogo University",
            "cutoff_weight": "44.30",
            "duration": 4,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "essential",
                "Chemistry": "relevant",
                "ICT": "desirable",
            },
        },
        {
            "name": "Mechanical Engineering",
            "university": "Makerere University",
            "cutoff_weight": "44.80",
            "duration": 4,
            "requirements": {
                "Mathematics": "essential",
                "Physics": "essential",
                "Chemistry": "relevant",
                "Technical Drawing": "desirable",
            },
        },
        {
            "name": "Architecture",
            "university": "Makerere University",
            "cutoff_weight": "43.20",
            "duration": 5,
            "requirements": {
                "Mathematics": "essential",
                "Fine Art": "relevant",
                "Technical Drawing": "relevant",
                "Physics": "desirable",
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
                "Food and Nutrition": "desirable",
            },
        },
        {
            "name": "Public Health",
            "university": "Lira University",
            "cutoff_weight": "38.70",
            "duration": 4,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "relevant",
                "Geography": "relevant",
                "Mathematics": "desirable",
            },
        },
        {
            "name": "Agriculture",
            "university": "Busitema University",
            "cutoff_weight": "36.80",
            "duration": 4,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "relevant",
                "Agriculture": "relevant",
                "Geography": "desirable",
            },
        },
        {
            "name": "Veterinary Medicine",
            "university": "Makerere University",
            "cutoff_weight": "43.80",
            "duration": 5,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "essential",
                "Agriculture": "relevant",
                "Physics": "desirable",
            },
        },
        {
            "name": "Education Science",
            "university": "Kyambogo University",
            "cutoff_weight": "34.60",
            "duration": 3,
            "requirements": {
                "Biology": "relevant",
                "Chemistry": "relevant",
                "Physics": "relevant",
                "Mathematics": "desirable",
            },
        },
        {
            "name": "Education Arts",
            "university": "Gulu University",
            "cutoff_weight": "32.40",
            "duration": 3,
            "requirements": {
                "History": "relevant",
                "Geography": "relevant",
                "Literature in English": "relevant",
                "Economics": "desirable",
            },
        },
        {
            "name": "Law",
            "university": "Makerere University",
            "cutoff_weight": "45.60",
            "duration": 4,
            "requirements": {
                "History": "relevant",
                "Literature in English": "relevant",
                "Economics": "relevant",
                "Divinity": "desirable",
            },
        },
        {
            "name": "Bachelor of Commerce",
            "university": "Makerere University",
            "cutoff_weight": "39.20",
            "duration": 3,
            "requirements": {
                "Economics": "essential",
                "Mathematics": "relevant",
                "Commerce": "relevant",
                "Entrepreneurship Education": "desirable",
            },
        },
        {
            "name": "Business Administration",
            "university": "Mbarara University of Science and Technology",
            "cutoff_weight": "37.60",
            "duration": 3,
            "requirements": {
                "Economics": "essential",
                "Mathematics": "relevant",
                "Commerce": "relevant",
                "Geography": "desirable",
            },
        },
        {
            "name": "Statistics",
            "university": "Makerere University",
            "cutoff_weight": "41.20",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "Economics": "relevant",
                "ICT": "relevant",
                "Physics": "desirable",
            },
        },
        {
            "name": "Actuarial Science",
            "university": "Makerere University",
            "cutoff_weight": "43.50",
            "duration": 3,
            "requirements": {
                "Mathematics": "essential",
                "Economics": "essential",
                "ICT": "relevant",
                "Physics": "desirable",
            },
        },
        {
            "name": "Environmental Science",
            "university": "Kabale University",
            "cutoff_weight": "36.50",
            "duration": 3,
            "requirements": {
                "Geography": "essential",
                "Biology": "relevant",
                "Chemistry": "relevant",
                "Physics": "desirable",
            },
        },
        {
            "name": "Mass Communication",
            "university": "Muni University",
            "cutoff_weight": "34.90",
            "duration": 3,
            "requirements": {
                "Literature in English": "essential",
                "History": "relevant",
                "Geography": "relevant",
                "Economics": "desirable",
            },
        },
        {
            "name": "Social Work and Social Administration",
            "university": "Kabale University",
            "cutoff_weight": "31.80",
            "duration": 3,
            "requirements": {
                "History": "relevant",
                "Geography": "relevant",
                "Literature in English": "relevant",
                "Divinity": "desirable",
            },
        },
        {
            "name": "Tourism and Hospitality Management",
            "university": "Busitema University",
            "cutoff_weight": "30.70",
            "duration": 3,
            "requirements": {
                "Geography": "relevant",
                "History": "relevant",
                "Economics": "relevant",
                "Food and Nutrition": "desirable",
            },
        },
        {
            "name": "Fisheries and Aquaculture",
            "university": "Soroti University",
            "cutoff_weight": "35.40",
            "duration": 4,
            "requirements": {
                "Biology": "essential",
                "Chemistry": "relevant",
                "Agriculture": "relevant",
                "Geography": "desirable",
            },
        },
    ]

    university_objects = {}
    for name, location in universities.items():
        university_objects[name], _ = University.objects.get_or_create(name=name, defaults={"location": location})

    subject_objects = {}
    for subject_name in uace_subjects:
        subject_objects[subject_name], _ = Subject.objects.get_or_create(name=subject_name)

    for definition in course_definitions:
        course, _ = Course.objects.update_or_create(
            name=definition["name"],
            university=university_objects[definition["university"]],
            defaults={
                "cutoff_weight": definition["cutoff_weight"],
                "duration": definition["duration"],
            },
        )

        CourseSubjectRequirement.objects.filter(course=course).delete()
        for subject_name, category in definition["requirements"].items():
            CourseSubjectRequirement.objects.get_or_create(
                course=course,
                subject=subject_objects[subject_name],
                defaults={"category": category},
            )


def unseed_uganda_subjects_and_courses(apps, schema_editor):
    Course = apps.get_model("admissions", "Course")

    seeded_courses = [
        "Medicine and Surgery",
        "Bachelor of Dental Surgery",
        "Pharmacy",
        "Computer Science",
        "Software Engineering",
        "Information Technology",
        "Data Science",
        "Civil Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Architecture",
        "Nursing Science",
        "Public Health",
        "Agriculture",
        "Veterinary Medicine",
        "Education Science",
        "Education Arts",
        "Law",
        "Bachelor of Commerce",
        "Business Administration",
        "Statistics",
        "Actuarial Science",
        "Environmental Science",
        "Mass Communication",
        "Social Work and Social Administration",
        "Tourism and Hospitality Management",
        "Fisheries and Aquaculture",
    ]

    Course.objects.filter(name__in=seeded_courses).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0002_seed_public_courses"),
    ]

    operations = [
        migrations.RunPython(seed_uganda_subjects_and_courses, reverse_code=unseed_uganda_subjects_and_courses),
    ]
