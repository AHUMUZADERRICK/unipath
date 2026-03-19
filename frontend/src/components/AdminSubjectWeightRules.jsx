import { useState } from "react";
import * as api from "../services/api";

export default function AdminSubjectWeightRules({ token, courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [error, setError] = useState(null);
  const [newSubjectId, setNewSubjectId] = useState(null);
  const [newCategory, setNewCategory] = useState("essential");
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setRequirements([]);
    setError(null);
    let loadedRequirements = [];

    setLoadingReqs(true);
    try {
      const reqs = await api.fetchCourseRequirements(token, course.id);
      setRequirements(reqs);
      loadedRequirements = reqs;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoadingReqs(false);
    }

    // Load available subjects if not already loaded
    if (subjects.length === 0) {
      setLoadingSubjects(true);
      try {
        // Fetch from any API endpoint that gives us subjects
        // For now, we'll just estimate from requirements
        setSubjects(
          Array.from(new Set(loadedRequirements.map((r) => r.subject_name))).map((name, idx) => ({
            id: idx + 1,
            name,
          }))
        );
      } finally {
        setLoadingSubjects(false);
      }
    }
  };

  const handleAddRequirement = async () => {
    if (!selectedCourse || !newSubjectId) {
      setError("Select a course and subject");
      return;
    }

    setError(null);
    try {
      const result = await api.addCourseRequirement(token, selectedCourse.id, newSubjectId, newCategory);
      setRequirements([...requirements, result]);
      setNewSubjectId(null);
      setNewCategory("essential");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!window.confirm("Remove this requirement?")) return;

    setError(null);
    try {
      await api.deleteCourseRequirement(token, reqId);
      setRequirements(requirements.filter((r) => r.id !== reqId));
    } catch (err) {
      setError(err.message);
    }
  };

  const categoryColors = {
    essential: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    relevant: { bg: "#fef3c7", text: "#78350f", border: "#fcd34d" },
    desirable: { bg: "#dbeafe", text: "#0c2340", border: "#93c5fd" },
  };

  return (
    <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", marginTop: 0 }}>
        ⚙️ Subject Weight Rules Management
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px", color: "#374151" }}>
          Select Course
        </label>
        <select
          value={selectedCourse?.id || ""}
          onChange={(e) => {
            const course = courses.find((c) => c.id === parseInt(e.target.value));
            if (course) handleSelectCourse(course);
          }}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
          }}
        >
          <option value="">Choose a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} - {course.university__name}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "12px", marginBottom: "12px" }}>Error: {error}</p>}

      {selectedCourse && (
        <>
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #d1d5db" }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#374151", marginTop: 0, marginBottom: "12px" }}>
              Add Subject Requirement
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={newSubjectId || ""}
                onChange={(e) => setNewSubjectId(parseInt(e.target.value))}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px",
                  flex: 1,
                  minWidth: "150px",
                }}
              >
                <option value="">Select subject...</option>
                {/* Placeholder - in real app would fetch actual subjects */}
                <option value="1">Mathematics</option>
                <option value="2">Physics</option>
                <option value="3">Chemistry</option>
                <option value="4">Biology</option>
                <option value="5">English</option>
                <option value="6">Geography</option>
              </select>

              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px",
                  minWidth: "120px",
                }}
              >
                <option value="essential">Essential (×3)</option>
                <option value="relevant">Relevant (×2)</option>
                <option value="desirable">Desirable (×1)</option>
              </select>

              <button
                onClick={handleAddRequirement}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {loadingReqs ? (
            <p style={{ fontSize: "12px", color: "#6b7280" }}>Loading requirements...</p>
          ) : requirements.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>No requirements set yet. Add one above.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {requirements.map((req) => {
                const colors = categoryColors[req.category] || categoryColors.desirable;
                return (
                  <div
                    key={req.id}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: colors.bg,
                      borderRadius: "6px",
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: colors.text, fontWeight: 500 }}>
                      {req.subject_name} - {req.category.charAt(0).toUpperCase() + req.category.slice(1)}
                    </span>
                    <button
                      onClick={() => handleDeleteRequirement(req.id)}
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "transparent",
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "12px", marginBottom: 0 }}>
        💡 Tip: Use Essential for required subjects, Relevant for strongly preferred, Desirable for nice-to-have.
      </p>
    </div>
  );
}
