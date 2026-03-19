export default function StrengthProfilePanel({ result }) {
  if (!result?.strength_profile) {
    return null;
  }

  const { strong_subjects, recommended_course_ids, insights } = result.strength_profile;

  if (!strong_subjects || strong_subjects.length === 0) {
    return null;
  }

  const strengthBadgeColor = (level) => {
    switch (level) {
      case "excellent":
        return "#059669"; // green
      case "strong":
        return "#0891b2"; // cyan
      case "good":
        return "#7c3aed"; // violet
      default:
        return "#6b7280"; // gray
    }
  };

  return (
    <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", marginTop: 0 }}>
        📊 Your Subject Strengths
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {strong_subjects.map((subject, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 12px",
                backgroundColor: strengthBadgeColor(subject.strength_level),
                color: "white",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {subject.subject_name} ({subject.grade}) - {subject.strength_level}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#374151", marginBottom: "12px", marginTop: 0 }}>
        {insights}
      </p>

      {recommended_course_ids && recommended_course_ids.length > 0 && (
        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
          💡 Tip: {recommended_course_ids.length} course(s) value your strong subjects
        </p>
      )}
    </div>
  );
}
