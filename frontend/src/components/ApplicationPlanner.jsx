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
      const result = await api.savePlannerCourse(candidateId, selectedCourse.course_id, newRank, notes);

      setPlanned([
        ...planned,
        {
          id: result.id,
          course_id: selectedCourse.course_id,
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
    <section className="feature-panel tone-blue">
      <div className="section-heading">
        <h3>Application Planner</h3>
        <p>Build a ranked shortlist from the courses you already qualify for.</p>
      </div>

      <div className="planner-form">
        <p className="feature-copy">
          Add courses in order of preference. You can rerank them anytime.
        </p>

        <div className="planner-controls">
          <select
            value={selectedCourse?.course_id || ""}
            onChange={(e) => {
              const course = availableCourses.find((c) => c.course_id === parseInt(e.target.value));
              setSelectedCourse(course);
            }}
            className="planner-select"
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
            type="button"
            onClick={addCourseToPlan}
            disabled={!selectedCourse || loading}
            className="btn-primary planner-add"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {selectedCourse && (
          <div>
            <textarea
              placeholder="Optional notes (e.g., good location, scholarship available)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="planner-notes"
            />
          </div>
        )}
      </div>

      {planned.length === 0 ? (
        <p className="feature-tip">
          No courses added yet. Select eligible courses above to start planning your application.
        </p>
      ) : (
        <div className="planner-list">
          {planned.map((course, idx) => (
            <div
              key={course.id}
              className="planner-item"
            >
              <div className="planner-item-copy">
                <div className="planner-item-title">
                  #{course.rank}. {course.course_name}
                </div>
                <div className="planner-item-meta">
                  {course.university}
                  {course.notes && ` • ${course.notes}`}
                </div>
              </div>

              <div className="planner-actions">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || loading}
                  className="planner-icon-btn"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === planned.length - 1 || loading}
                  className="planner-icon-btn"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => removeCourseFromPlan(course.id)}
                  disabled={loading}
                  className="planner-icon-btn danger"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {planned.length > 0 && (
        <p className="feature-tip">
          Prioritize your top 3 choices first, then use the arrows to refine the rest of the order.
        </p>
      )}
    </section>
  );
}
