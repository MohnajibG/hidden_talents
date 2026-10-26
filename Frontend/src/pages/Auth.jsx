import { useState } from "react";
import { api } from "../api.js";

const Auth = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", jobTitle: "", sector: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const me = await api.post(mode === "login" ? "/auth/login" : "/auth/register", form);
      onLogin(me);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-intro">
        <div className="brand big"><i />Hidden Talents</div>
        <p>Your skills don't stop at your job title. Let people know what you can do outside your contract: web design, gardening, languages, DIY…</p>
        <ul className="promises">
          <li>Your profile stays hidden until you make it visible.</li>
          <li>You can decline any mission proposal.</li>
          <li>You can delete your account at any time.</li>
        </ul>
      </div>
      <form className="panel" onSubmit={submit}>
        <h1>{mode === "login" ? "Log in" : "Create my account"}</h1>
        {mode === "register" && (
          <>
            <Field id="fullName" label="First and last name" value={form.fullName} onChange={set("fullName")} required />
            <div className="row">
              <Field id="jobTitle" label="Current job title" placeholder="e.g. Cook" value={form.jobTitle} onChange={set("jobTitle")} />
              <Field id="sector" label="Sector" placeholder="e.g. Catering" value={form.sector} onChange={set("sector")} />
            </div>
          </>
        )}
        <Field id="email" label="Work email address" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <Field
          id="password" label="Password" type="password" minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          hint={mode === "register" ? "8 characters minimum" : undefined}
          value={form.password} onChange={set("password")} required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create my account"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "No account yet? Sign up" : "Already registered? Log in"}
        </button>
      </form>
    </div>
  );
};

export default Auth;

export const Field = ({ id, label, hint, as = "input", children, ...props }) => {
  const Tag = as;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} {...props}>{children}</Tag>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
};
