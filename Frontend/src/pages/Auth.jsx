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
        <div className="brand big"><i />Talents Cachés</div>
        <p>Vos compétences ne s'arrêtent pas à votre poste. Faites connaître ce que vous savez faire en dehors de votre contrat : web design, jardinage, langues, bricolage…</p>
        <ul className="promises">
          <li>Votre profil reste masqué tant que vous ne le rendez pas visible.</li>
          <li>Vous pouvez refuser toute proposition de mission.</li>
          <li>Vous pouvez supprimer votre compte à tout moment.</li>
        </ul>
      </div>
      <form className="panel" onSubmit={submit}>
        <h1>{mode === "login" ? "Se connecter" : "Créer mon compte"}</h1>
        {mode === "register" && (
          <>
            <Field id="fullName" label="Prénom et nom" value={form.fullName} onChange={set("fullName")} required />
            <div className="row">
              <Field id="jobTitle" label="Poste actuel" placeholder="ex. Cuisinier" value={form.jobTitle} onChange={set("jobTitle")} />
              <Field id="sector" label="Secteur" placeholder="ex. Restauration" value={form.sector} onChange={set("sector")} />
            </div>
          </>
        )}
        <Field id="email" label="Adresse e-mail professionnelle" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
        <Field
          id="password" label="Mot de passe" type="password" minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          hint={mode === "register" ? "8 caractères minimum" : undefined}
          value={form.password} onChange={set("password")} required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
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
