import { useState } from "react";
import * as api from "../services/api";

export default function ApplicationPlannerPanel({ candidateId, eligibleCourses, onSaved }) {
  const [planned, setPlanned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [notes, setNotes] = useState("");

  const addCourseToPlan = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      const newRank = (planned.length || 0) + 1;
      const result = await api.savePlannerCourse(candidateId, selectedCourse.id, newRank, notes);

      setPlanned([
        ...planned,
        {
          id: result.id,
          course_id: selectedCourse.id,
          course_name: selectedCourse.course,
          university: selectedCourse.university,
          rank: newRank,
          notes,
        },
      ].sort((a, b) => a.rank - b.rank));

      setSelectedCourse(null);
      setNotes("");
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  const removeCourseFromPlan = async (plannerId) => {
    setLoading(true);
    try {
      await api.deletePlannerCourse(plannerId);
      const updated = planned.filter((p) => p.id !== plannerId);
      
      // Renumber ranks
      const renumbered = updated.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));
      setPlanned(renumbered);
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...planned];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    updated.forEach((p, i) => (p.rank = i + 1));
    setPlanned(updated);
  };

  const moveDown = (index) => {
    if (index === planned.length - 1) return;
    const updated = [...planned];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((p, i) => (p.rank = i + 1));
    setPlanned(updated);
  };

  const availableCourses = eligibleCourses?.filter(
    (c) => !planned.some((p) => p.course_id === c.course_id)
  ) || [];

  return (
    <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", marginTop: 0 }}>
        📋 Application Planner
      </h3>

      <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #dbeafe" }}>
        <p style={{ fontSize: "13px", color: "#374151", marginTop: 0, marginBottom: "12px" }}>
          Add courses in order of preference. You can rerank them anytime.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <select
            value={selectedCourse?.id || ""}
            onChange={(e) => {
              const course = availableCourses.find((c) => c.course_id === parseInt(e.target.value));
              setSelectedCourse(course);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              minWidth: "200px",
            }}
            disabled={availableCourses.length === 0 || loading}
          >
            <option value="">Select a course to add...</option>
            {availableCourses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.course} - {course.university}
              </option>
            ))}
          </select>

          <button
            onClick={addCourseToPlan}
            disabled={!selectedCourse || loading}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedCourse && !loading ? "#3b82f6" : "#d1d5db",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: selectedCourse && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {selectedCourse && (
          <div style={{ marginBottom: "12px" }}>
            <textarea
              placeholder="Optional notes (e.g., good location, scholarship available)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                minHeight: "60px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}
      </div>

      {planned.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: 0, marginBottom: 0 }}>
          No courses added yet. Select eligible courses above to start planning your application.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {planned.map((course, idx) => (
            <div
              key={course.id}
              style={{
                padding: "12px",
                backgroundColor: "white",
                borderRadius: "6px",
                border: "1px solid #dbeafe",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                  #{course.rank}. {course.course_name}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  {course.university}
                  {course.notes && ` • ${course.notes}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || loading}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: idx === 0 || loading ? "#e5e7eb" : "#f3f4f6",
                    color: idx === 0 || loading ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: idx === 0 || loading ? "not-allowed" : "pointer",
                  }}
                >
                  ↑
                </button>

                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === planned.length - 1 || loading}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: idx === planned.length - 1 || loading ? "#e5e7eb" : "#f3f4f6",
                    color: idx === planned.length - 1 || loading ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: idx === planned.length - 1 || loading ? "not-allowed" : "pointer",
                  }}
                >
                  ↓
                </button>

                <button
                  onClick={() => removeCourseFromPlan(course.id)}
                  disabled={loading}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: loading ? "#e5e7eb" : "#fee2e2",
                    color: loading ? "#9ca3af" : "#dc2626",
                    border: "1px solid #fca5a5",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planned.length > 0 && (
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px", marginBottom: 0 }}>
          ℹ️ Prioritize your top 3 choices. Use the arrows to reorder anytime.
        </p>
      )}
    </div>
  );
}
