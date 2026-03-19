from dataclasses import dataclass, field
from decimal import Decimal
from typing import Dict, Iterable, List

from django.db.models import Prefetch

from .models import Course, CourseSubjectRequirement

A_LEVEL_GRADE_POINTS: Dict[str, Decimal] = {
    "A": Decimal("6"),
    "B": Decimal("5"),
    "C": Decimal("4"),
    "D": Decimal("3"),
    "E": Decimal("2"),
    "O": Decimal("1"),
    "F": Decimal("0"),
}

UCE_GRADE_POINTS: Dict[str, Decimal] = {
    "D1": Decimal("0.3"),
    "D2": Decimal("0.3"),
    "C3": Decimal("0.2"),
    "C4": Decimal("0.2"),
    "C5": Decimal("0.2"),
    "C6": Decimal("0.2"),
    "P7": Decimal("0.1"),
    "P8": Decimal("0.1"),
    "F9": Decimal("0.0"),
}

CATEGORY_MULTIPLIERS: Dict[str, Decimal] = {
    CourseSubjectRequirement.CATEGORY_ESSENTIAL: Decimal("3"),
    CourseSubjectRequirement.CATEGORY_RELEVANT: Decimal("2"),
    CourseSubjectRequirement.CATEGORY_DESIRABLE: Decimal("1"),
}

DEFAULT_SUBJECT_MULTIPLIER = Decimal("0.5")
FEMALE_BONUS = Decimal("1.5")
BORDERLINE_MARGIN = Decimal("1.50")
TOP_CHANCE_MARGIN = Decimal("4.00")
SAFE_MARGIN = Decimal("1.50")


@dataclass
class CourseEvaluation:
    course_id: int
    course_name: str
    university_name: str
    cutoff_weight: Decimal
    calculated_weight: Decimal
    is_eligible: bool
    is_borderline: bool
    recommendation_band: str
    explanation: str
    missing_essential_subjects: List[str] = field(default_factory=list)


def _normalise_uace_results(uace_results: Dict[str, str]) -> Dict[str, str]:
    return {subject.strip().lower(): grade.strip().upper() for subject, grade in uace_results.items()}


def _build_requirement_multiplier_map(
    requirements: Iterable[CourseSubjectRequirement],
) -> Dict[str, Decimal]:
    requirement_map: Dict[str, Decimal] = {}
    for requirement in requirements:
        requirement_map[requirement.subject.name.strip().lower()] = CATEGORY_MULTIPLIERS[requirement.category]
    return requirement_map


def _calculate_uace_weight(
    normalised_uace_results: Dict[str, str], requirement_multiplier_map: Dict[str, Decimal]
) -> Decimal:
    contributions: List[Decimal] = []
    for subject_name, grade in normalised_uace_results.items():
        points = A_LEVEL_GRADE_POINTS.get(grade, Decimal("0"))
        multiplier = requirement_multiplier_map.get(subject_name, DEFAULT_SUBJECT_MULTIPLIER)
        contributions.append(points * multiplier)

    contributions.sort(reverse=True)
    return sum(contributions[:3], Decimal("0"))


def _meets_essential_subjects(
    normalised_uace_results: Dict[str, str], course_requirements: Iterable[CourseSubjectRequirement]
) -> bool:
    for requirement in course_requirements:
        if requirement.category != CourseSubjectRequirement.CATEGORY_ESSENTIAL:
            continue

        student_grade = normalised_uace_results.get(requirement.subject.name.strip().lower())
        if not student_grade:
            return False

        if A_LEVEL_GRADE_POINTS.get(student_grade, Decimal("0")) <= Decimal("0"):
            return False

    return True


def _missing_essential_subjects(
    normalised_uace_results: Dict[str, str], course_requirements: Iterable[CourseSubjectRequirement]
) -> List[str]:
    missing: List[str] = []
    for requirement in course_requirements:
        if requirement.category != CourseSubjectRequirement.CATEGORY_ESSENTIAL:
            continue

        student_grade = normalised_uace_results.get(requirement.subject.name.strip().lower())
        if not student_grade:
            missing.append(requirement.subject.name)
            continue

        if A_LEVEL_GRADE_POINTS.get(student_grade, Decimal("0")) <= Decimal("0"):
            missing.append(requirement.subject.name)

    return sorted(missing)


def _build_explanation(is_eligible: bool, missing_essentials: List[str], weight: Decimal, cutoff: Decimal) -> str:
    if is_eligible:
        return "Eligible: essential subjects satisfied and weight meets or exceeds cutoff."

    if missing_essentials:
        return (
            "Not eligible: missing or failed essential subjects: "
            + ", ".join(missing_essentials)
            + "."
        )

    shortfall = (cutoff - weight).quantize(Decimal("0.01"))
    return f"Not eligible: weight is below cutoff by {shortfall}."


def _is_borderline(is_eligible: bool, weight: Decimal, cutoff: Decimal, missing_essentials: List[str]) -> bool:
    if missing_essentials:
        return False
    difference = abs(weight - cutoff)
    return difference <= BORDERLINE_MARGIN


def _recommendation_band(is_eligible: bool, is_borderline: bool, weight: Decimal, cutoff: Decimal) -> str:
    if is_eligible:
        margin = weight - cutoff
        if margin >= TOP_CHANCE_MARGIN:
            return "top_chance"
        if margin >= SAFE_MARGIN:
            return "safe_option"
        return "safe_option"

    if is_borderline:
        return "ambitious_choice"

    return "not_recommended"


def _calculate_uce_weight(uce_grades: List[str]) -> Decimal:
    total = Decimal("0")
    for grade in uce_grades:
        total += UCE_GRADE_POINTS.get(grade.strip().upper(), Decimal("0"))
    return total


def calculate_weight(
    student_results: Dict[str, str],
    course_requirements: Iterable[CourseSubjectRequirement],
    uce_grades: List[str],
    gender: str,
) -> Decimal:
    normalised_results = _normalise_uace_results(student_results)
    requirement_multiplier_map = _build_requirement_multiplier_map(course_requirements)

    uace_weight = _calculate_uace_weight(normalised_results, requirement_multiplier_map)
    uce_weight = _calculate_uce_weight(uce_grades)

    total_weight = uace_weight + uce_weight
    if gender.strip().lower() == "female":
        total_weight += FEMALE_BONUS

    return total_weight.quantize(Decimal("0.01"))


def evaluate_courses(
    student_results: Dict[str, str], uce_grades: List[str], gender: str
) -> List[CourseEvaluation]:
    courses = Course.objects.select_related("university").prefetch_related(
        Prefetch("subject_requirements", queryset=CourseSubjectRequirement.objects.select_related("subject"))
    )

    evaluations: List[CourseEvaluation] = []
    normalised_results = _normalise_uace_results(student_results)
    for course in courses:
        requirements = list(course.subject_requirements.all())
        essential_ok = _meets_essential_subjects(normalised_results, requirements)
        missing_essentials = _missing_essential_subjects(normalised_results, requirements)
        weight = calculate_weight(
            student_results=student_results,
            course_requirements=requirements,
            uce_grades=uce_grades,
            gender=gender,
        )
        cutoff = Decimal(course.cutoff_weight)
        is_eligible = essential_ok and (weight >= cutoff)
        is_borderline = _is_borderline(
            is_eligible=is_eligible,
            weight=weight,
            cutoff=cutoff,
            missing_essentials=missing_essentials,
        )
        recommendation_band = _recommendation_band(
            is_eligible=is_eligible,
            is_borderline=is_borderline,
            weight=weight,
            cutoff=cutoff,
        )
        evaluations.append(
            CourseEvaluation(
                course_id=course.id,
                course_name=course.name,
                university_name=course.university.name,
                cutoff_weight=cutoff,
                calculated_weight=weight,
                is_eligible=is_eligible,
                is_borderline=is_borderline,
                recommendation_band=recommendation_band,
                explanation=_build_explanation(is_eligible, missing_essentials, weight, cutoff),
                missing_essential_subjects=missing_essentials,
            )
        )

    return sorted(evaluations, key=lambda item: item.calculated_weight, reverse=True)


def get_eligible_courses(weight: Decimal):
    return Course.objects.select_related("university").filter(cutoff_weight__lte=weight).order_by("name")


def get_eligible_evaluations(evaluations: List[CourseEvaluation]) -> List[CourseEvaluation]:
    return [evaluation for evaluation in evaluations if evaluation.is_eligible]


@dataclass
class SubjectStrength:
    subject_name: str
    grade: str
    points: Decimal
    strength_level: str  # "excellent", "strong", "good"


@dataclass
class StrengthProfile:
    strong_subjects: List[SubjectStrength]
    recommended_course_ids: List[int]
    insights: str


def _profile_subject_strengths(normalised_uace_results: Dict[str, str]) -> List[SubjectStrength]:
    """Identify strong subjects based on grades."""
    strengths: List[SubjectStrength] = []
    
    for subject_name, grade in normalised_uace_results.items():
        points = A_LEVEL_GRADE_POINTS.get(grade, Decimal("0"))
        
        if grade in ["A"]:
            strength_level = "excellent"
        elif grade in ["B"]:
            strength_level = "strong"
        elif grade in ["C"]:
            strength_level = "good"
        else:
            continue
        
        strengths.append(SubjectStrength(
            subject_name=subject_name.title(),
            grade=grade,
            points=points,
            strength_level=strength_level
        ))
    
    return sorted(strengths, key=lambda x: x.points, reverse=True)


def _find_courses_matching_strengths(strong_subjects: List[SubjectStrength]) -> List[int]:
    """Find courses that value the student's strong subjects."""
    if not strong_subjects:
        return []
    
    strong_subject_names = {s.subject_name.lower() for s in strong_subjects}
    matching_course_ids: set = set()
    
    courses = Course.objects.prefetch_related(
        Prefetch("subject_requirements", queryset=CourseSubjectRequirement.objects.select_related("subject"))
    )
    
    for course in courses:
        requirements = list(course.subject_requirements.all())
        for req in requirements:
            if req.subject.name.lower() in strong_subject_names:
                matching_course_ids.add(course.id)
                break
    
    return sorted(list(matching_course_ids))


def profile_student_strengths(
    student_results: Dict[str, str], uce_grades: List[str]
) -> StrengthProfile:
    """Create a strength profile based on UACE/UCE performance."""
    normalised_results = _normalise_uace_results(student_results)
    strong_subjects = _profile_subject_strengths(normalised_results)
    
    if not strong_subjects:
        return StrengthProfile(
            strong_subjects=[],
            recommended_course_ids=[],
            insights="No clear subject strengths identified. Consider taking courses with varied subject requirements."
        )
    
    recommended_courses = _find_courses_matching_strengths(strong_subjects)
    
    subjects_list = ", ".join([s.subject_name for s in strong_subjects[:3]])
    insights = (
        f"Your strengths are in {subjects_list}. "
        f"Consider courses that emphasize these subjects for better performance."
    )
    
    if strong_subjects[0].strength_level == "excellent":
        insights += " Your excellent grades suggest you're well-suited for competitive programs."
    
    return StrengthProfile(
        strong_subjects=strong_subjects,
        recommended_course_ids=recommended_courses,
        insights=insights
    )
