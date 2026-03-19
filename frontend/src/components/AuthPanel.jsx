import { useState } from "react";

export default function AuthPanel({ onLogin, onSignup, loading, error }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    whatsappNumber: "",
    indexNumber: "",
    gender: "male",
  });

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const submit = async () => {
    if (mode === "signup") {
      await onSignup({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirmPassword,
        whatsapp_number: form.whatsappNumber.trim(),
        index_number: form.indexNumber.trim().toUpperCase(),
        gender: form.gender,
      });
      return;
    }

    await onLogin({
      identifier: form.email.trim(),
      password: form.password,
    });
  };

  return (
    <section className="auth-shell card">
      <div className="auth-brand-side">
        <img src="/logo.png" alt="UniPath logo" className="auth-logo" />
        <h2>UniPath</h2>
        <p>
          Discover eligible Ugandan university courses faster with your verified candidate profile.
        </p>
        <p>Admins and candidates can both log in from this page.</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-tabs">
          <button
            type="button"
            className={`pill ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`pill ${mode === "signup" ? "active" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-fields">
          {mode === "signup" && (
            <>
              <div className="auth-row-2">
                <input
                  type="text"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                />
              </div>

              <input
                type="text"
                placeholder="WhatsApp number (e.g. +2567...)"
                value={form.whatsappNumber}
                onChange={(event) => update("whatsappNumber", event.target.value)}
              />
              <input
                type="text"
                placeholder="Index number"
                value={form.indexNumber}
                onChange={(event) => update("indexNumber", event.target.value)}
              />
              <select value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </>
          )}

          <input
            type="text"
            placeholder="Email address or admin username"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
          />

          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(event) => update("confirmPassword", event.target.value)}
            />
          )}
        </div>

        <button type="button" className="btn-primary auth-submit" onClick={submit} disabled={loading}>
          {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
        </button>

        {error && <p className="status error">{error}</p>}
      </div>
    </section>
  );
}
