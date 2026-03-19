export default function GenderStep({ gender, locked = false, whatsapp, indexNumber, onChange, onLogout }) {
  if (locked) {
    return (
      <section className="card">
        <div className="card-head">
          <h2>Step 3: Account Profile</h2>
          <p>Gender is taken from your account and used in PUJAB weighting.</p>
        </div>

        <div className="uace-grid">
          <input type="text" value={`WhatsApp: ${whatsapp}`} readOnly />
          <input type="text" value={`Index Number: ${indexNumber}`} readOnly />
          <input type="text" value={`Gender: ${gender}`} readOnly />
        </div>

        <button type="button" className="btn-muted" onClick={onLogout}>
          Logout
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Step 3: Gender</h2>
        <p>Female candidates receive the PUJAB bonus of 1.5 points.</p>
      </div>

      <div className="gender-pills">
        <button
          type="button"
          className={`pill ${gender === "male" ? "active" : ""}`}
          onClick={() => onChange("male")}
        >
          Male
        </button>
        <button
          type="button"
          className={`pill ${gender === "female" ? "active" : ""}`}
          onClick={() => onChange("female")}
        >
          Female
        </button>
      </div>
    </section>
  );
}
