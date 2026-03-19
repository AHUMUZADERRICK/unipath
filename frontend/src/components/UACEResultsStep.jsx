const UACE_GRADE_OPTIONS = ["A", "B", "C", "D", "E", "O", "F"];

export default function UACEResultsStep({
  rows,
  subjects,
  subjectsLoading,
  onAddRow,
  onRemoveRow,
  onChange,
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Step 1: UACE Results</h2>
        <p>Add at least 3 principal subjects and grades from the Uganda A-Level subject list.</p>
      </div>

      {subjectsLoading && <p className="status">Loading UACE subject catalog...</p>}

      <div className="uace-grid">
        {rows.map((row, index) => (
          <div className="uace-row" key={row.id}>
            <select
              value={row.subject}
              disabled={subjectsLoading}
              onChange={(event) => onChange(index, "subject", event.target.value)}
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={row.grade}
              onChange={(event) => onChange(index, "grade", event.target.value)}
            >
              <option value="">Grade</option>
              {UACE_GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-muted"
              onClick={() => onRemoveRow(index)}
              disabled={rows.length <= 3}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={onAddRow}>
        + Add Subject
      </button>
    </section>
  );
}
