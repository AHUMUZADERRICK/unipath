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
        return "excellent";
      case "strong":
        return "strong";
      case "good":
        return "good";
      default:
        return "neutral";
    }
  };

  return (
    <section className="feature-panel tone-green">
      <div className="section-heading">
        <h3>Your Subject Strengths</h3>
        <p>These are the strongest parts of your academic profile right now.</p>
      </div>

      <div className="strength-badges">
          {strong_subjects.map((subject, idx) => (
            <div
              key={idx}
              className={`strength-badge tone-${strengthBadgeColor(subject.strength_level)}`}
            >
              {subject.subject_name} ({subject.grade}) - {subject.strength_level}
            </div>
          ))}
      </div>

      <p className="feature-copy">{insights}</p>

      {recommended_course_ids && recommended_course_ids.length > 0 && (
        <p className="feature-tip">
          Tip: {recommended_course_ids.length} course(s) especially value the subjects where you
          are performing best.
        </p>
      )}
    </section>
  );
}
