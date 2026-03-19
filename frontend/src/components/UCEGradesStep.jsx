const UCE_GRADE_OPTIONS = ["D1", "D2", "C3", "C4", "C5", "C6", "P7", "P8", "F9"];

export default function UCEGradesStep({ grades, onChange }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Step 2: UCE Grades</h2>
        <p>Enter up to 8 UCE grades. Empty entries are ignored.</p>
      </div>

      <div className="uce-grid">
        {grades.map((grade, index) => (
          <select
            key={`uce-${index + 1}`}
            value={grade}
            onChange={(event) => onChange(index, event.target.value)}
          >
            <option value="">UCE Grade {index + 1}</option>
            {UCE_GRADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
      </div>
    </section>
  );
}
