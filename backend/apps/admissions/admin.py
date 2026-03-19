import csv
from decimal import Decimal, InvalidOperation
from io import TextIOWrapper

from django.contrib import admin
from django.contrib import messages
from django import forms
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import path

from .models import (
    AdminSessionToken,
    Candidate,
    Course,
    CourseCutoffHistory,
    CourseSubjectRequirement,
    StudentResult,
    StudentSubmission,
    Subject,
    UCEGrade,
    University,
)


class CutoffCSVUploadForm(forms.Form):
    csv_file = forms.FileField(help_text="CSV columns: university, course, cutoff_weight, year (optional), duration (optional).")


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ("name", "location")
    search_fields = ("name", "location")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("whatsapp_number", "index_number", "gender", "created_at")
    list_filter = ("gender",)
    search_fields = ("whatsapp_number", "index_number")


@admin.register(AdminSessionToken)
class AdminSessionTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "last_used_at")
    search_fields = ("user__username", "user__email")


class CourseSubjectRequirementInline(admin.TabularInline):
    model = CourseSubjectRequirement
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "university", "cutoff_weight", "duration")
    list_filter = ("university",)
    search_fields = ("name",)
    inlines = [CourseSubjectRequirementInline]
    change_list_template = "admin/admissions/course/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "upload-cutoffs/",
                self.admin_site.admin_view(self.upload_cutoffs_view),
                name="admissions_course_upload_cutoffs",
            ),
            path(
                "download-cutoffs-template/",
                self.admin_site.admin_view(self.download_cutoffs_template_view),
                name="admissions_course_download_cutoffs_template",
            ),
            path(
                "download-cutoff-history-template/",
                self.admin_site.admin_view(self.download_cutoff_history_template_view),
                name="admissions_course_download_cutoff_history_template",
            ),
        ]
        return custom_urls + urls

    def download_cutoffs_template_view(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=course_cutoff_template.csv"

        writer = csv.writer(response)
        writer.writerow(["university", "course", "cutoff_weight", "year", "duration"])
        writer.writerow(["Makerere University", "Computer Science", "43.00", "2026", "3"])
        writer.writerow(["Kyambogo University", "Information Technology", "41.00", "2026", "3"])

        return response

    def download_cutoff_history_template_view(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=course_cutoff_history_template.csv"

        writer = csv.writer(response)
        writer.writerow(["university", "course", "year", "cutoff_weight"])
        writer.writerow(["Makerere University", "Computer Science", "2026", "43.00"])
        writer.writerow(["Kyambogo University", "Information Technology", "2026", "41.00"])

        return response

    def upload_cutoffs_view(self, request):
        if request.method == "POST":
            form = CutoffCSVUploadForm(request.POST, request.FILES)
            if form.is_valid():
                created_count = 0
                updated_count = 0
                history_rows = 0

                wrapped_file = TextIOWrapper(form.cleaned_data["csv_file"].file, encoding="utf-8")
                reader = csv.DictReader(wrapped_file)

                required_columns = {"university", "course", "cutoff_weight"}
                if not reader.fieldnames or not required_columns.issubset(set(reader.fieldnames)):
                    self.message_user(
                        request,
                        "CSV is missing required columns: university, course, cutoff_weight.",
                        level=messages.ERROR,
                    )
                    return redirect("admin:admissions_course_upload_cutoffs")

                for row_index, row in enumerate(reader, start=2):
                    university_name = (row.get("university") or "").strip()
                    course_name = (row.get("course") or "").strip()
                    cutoff_raw = (row.get("cutoff_weight") or "").strip()
                    year_raw = (row.get("year") or "").strip()
                    duration_raw = (row.get("duration") or "").strip()

                    if not university_name or not course_name or not cutoff_raw:
                        self.message_user(
                            request,
                            f"Skipping row {row_index}: missing university/course/cutoff_weight.",
                            level=messages.WARNING,
                        )
                        continue

                    try:
                        cutoff_weight = Decimal(cutoff_raw)
                    except InvalidOperation:
                        self.message_user(
                            request,
                            f"Skipping row {row_index}: invalid cutoff_weight '{cutoff_raw}'.",
                            level=messages.WARNING,
                        )
                        continue

                    duration = 3
                    if duration_raw:
                        try:
                            duration = int(duration_raw)
                        except ValueError:
                            self.message_user(
                                request,
                                f"Skipping row {row_index}: invalid duration '{duration_raw}'.",
                                level=messages.WARNING,
                            )
                            continue

                    university, _ = University.objects.get_or_create(
                        name=university_name,
                        defaults={"location": "Uganda"},
                    )
                    course, created = Course.objects.update_or_create(
                        name=course_name,
                        university=university,
                        defaults={"cutoff_weight": cutoff_weight, "duration": duration},
                    )

                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                    if year_raw:
                        try:
                            year_value = int(year_raw)
                        except ValueError:
                            self.message_user(
                                request,
                                f"Skipping cutoff history year on row {row_index}: invalid year '{year_raw}'.",
                                level=messages.WARNING,
                            )
                        else:
                            CourseCutoffHistory.objects.update_or_create(
                                course=course,
                                year=year_value,
                                defaults={"cutoff_weight": cutoff_weight},
                            )
                            history_rows += 1

                self.message_user(
                    request,
                    (
                        "CSV import complete. "
                        f"Created courses: {created_count}, updated courses: {updated_count}, "
                        f"cutoff-history rows updated: {history_rows}."
                    ),
                    level=messages.SUCCESS,
                )
                return redirect("admin:admissions_course_changelist")
        else:
            form = CutoffCSVUploadForm()

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Upload Course Cutoffs (CSV)",
            "form": form,
        }
        return render(request, "admin/admissions/course/upload_cutoffs.html", context)


@admin.register(CourseCutoffHistory)
class CourseCutoffHistoryAdmin(admin.ModelAdmin):
    list_display = ("course", "year", "cutoff_weight")
    list_filter = ("year",)
    search_fields = ("course__name",)


@admin.register(StudentSubmission)
class StudentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "gender", "created_at")
    list_filter = ("gender",)


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = ("submission", "subject", "grade")
    list_filter = ("grade",)


@admin.register(UCEGrade)
class UCEGradeAdmin(admin.ModelAdmin):
    list_display = ("submission", "subject", "grade")
    list_filter = ("grade",)
