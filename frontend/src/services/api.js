import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 12000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function calculateWeight(payload) {
  const response = await apiClient.post("/calculate-weight", payload);
  return response.data;
}

export async function signupCandidate(payload) {
  const response = await apiClient.post("/auth/signup", payload);
  return response.data;
}

export async function loginCandidate(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
}

export async function fetchUaceSubjects() {
  const response = await apiClient.get("/uace-subjects");
  return response.data.subjects || [];
}

function buildAdminHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function loginAdmin(payload) {
  const response = await apiClient.post("/admin/login", payload);
  return response.data;
}

export async function logoutAdmin(token) {
  const response = await apiClient.post("/admin/logout", {}, buildAdminHeaders(token));
  return response.data;
}

export async function fetchAdminDashboard(token) {
  const response = await apiClient.get("/admin/dashboard", buildAdminHeaders(token));
  return response.data;
}

export async function fetchAdminUsers(token) {
  const response = await apiClient.get("/admin/users", buildAdminHeaders(token));
  return response.data.candidates || [];
}

export async function updateAdminUser(token, candidateId, payload) {
  const response = await apiClient.patch(
    `/admin/users/${candidateId}`,
    payload,
    buildAdminHeaders(token)
  );
  return response.data;
}

export async function fetchAdminCourses(token) {
  const response = await apiClient.get("/admin/courses", buildAdminHeaders(token));
  return response.data.courses || [];
}

export async function updateCourseCutoff(token, courseId, payload) {
  const response = await apiClient.patch(
    `/admin/courses/${courseId}/cutoff`,
    payload,
    buildAdminHeaders(token)
  );
  return response.data;
}

export async function uploadAdminCutoffExcel(token, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/admin/cutoffs/upload", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function downloadAdminCsv(token, endpoint, filename) {
  const response = await apiClient.get(endpoint, {
    ...buildAdminHeaders(token),
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAdminCutoffTemplate(token) {
  await downloadAdminCsv(token, "/admin/templates/cutoff-csv", "course_cutoff_template.csv");
}

export async function downloadAdminCutoffHistoryTemplate(token) {
  await downloadAdminCsv(
    token,
    "/admin/templates/cutoff-history-csv",
    "course_cutoff_history_template.csv"
  );
}

// Planner courses API
export async function fetchPlannerCourses(candidateId) {
  const response = await apiClient.get("/planner-courses", {
    params: { candidate_id: candidateId },
  });
  return response.data;
}

export async function savePlannerCourse(candidateId, courseId, rank, notes = "") {
  const response = await apiClient.post("/planner-courses", {
    candidate_id: candidateId,
    course_id: courseId,
    rank,
    notes,
  });
  return response.data;
}

export async function deletePlannerCourse(plannerId) {
  const response = await apiClient.delete("/planner-courses", {
    params: { planner_id: plannerId },
  });
  return response.data;
}

// Strength profile API
export async function generateStrengthProfile(submissionId, uaceResults, uceGrades) {
  const response = await apiClient.post("/strength-profile", {
    submission_id: submissionId,
    uace_results: uaceResults,
    uce_grades: uceGrades,
  });
  return response.data;
}

export async function fetchStrengthProfile(submissionId) {
  const response = await apiClient.get("/strength-profile", {
    params: { submission_id: submissionId },
  });
  return response.data;
}

// PDF export API
export async function exportEligibilitySummaryPDF(candidateId, evaluations, finalWeight) {
  const response = await apiClient.post(
    "/export-pdf",
    {
      candidate_id: candidateId,
      evaluations,
      final_weight: finalWeight,
    },
    { responseType: "blob" }
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eligibility_summary_${candidateId}_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Analytics API
export async function fetchAdminAnalytics(token) {
  const response = await apiClient.get("/admin/analytics", buildAdminHeaders(token));
  return response.data;
}

// Subject requirement management API
export async function fetchCourseRequirements(token, courseId) {
  const response = await apiClient.get(`/admin/courses/${courseId}/requirements`, buildAdminHeaders(token));
  return response.data;
}

export async function addCourseRequirement(token, courseId, subjectId, category) {
  const response = await apiClient.post(
    "/admin/course-requirements",
    {
      course_id: courseId,
      subject_id: subjectId,
      category,
    },
    buildAdminHeaders(token)
  );
  return response.data;
}

export async function deleteCourseRequirement(token, requirementId) {
  const response = await apiClient.delete("/admin/course-requirements", {
    params: { requirement_id: requirementId },
    ...buildAdminHeaders(token),
  });
  return response.data;
}
