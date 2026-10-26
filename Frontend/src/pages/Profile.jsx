import { useState } from "react";
import { api } from "../api.js";
import { Field } from "./Auth.jsx";
import { Badge, SkillLine, Modal } from "../components.jsx";

const EMPTY_SKILL = { name: "", domain: "", level: "Confirmé", years: 1, description: "", portfolioUrl: "" };

const Profile = ({ me, setMe, options, notify }) => {
  const [info, setInfo] = useState({ fullName: me.fullName, jobTitle: me.jobTitle, sector: me.sector, availability: me.availability });
  const [skill, setSkill] = useState(EMPTY_SKILL);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const domains = options?.domains || [];
  const levels = options?.levels || [];
  const availability = options?.availability || [];

  const saveInfo = async (e) => {
    e.preventDefault();
    try {
      setMe(await api.patch("/me", info));
      notify("Profil enregistré.");
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleVisible = async () => {
    try {
      const updated = await api.patch("/me", { visible: !me.visible });
      setMe(updated);
      notify(updated.visible ? "Votre profil est visible par l'admin RH." : "Votre profil est masqué.");
    } catch (err) {
      notify(err.message);
    }
  };

  const addSkill = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData();
    Object.entries({ ...skill, domain: skill.domain || domains[0] }).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("proof", file);
    try {
      setMe(await api.post("/me/skills", fd));
      setSkill(EMPTY_SKILL);
      setFile(null);
      setFileKey((k) => k + 1);
      notify(file || skill.portfolioUrl ? "Compétence ajoutée. L'admin RH va vérifier votre preuve." : "Compétence ajoutée.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (id) => {
    try {
      setMe(await api.del(`/me/skills/${id}`));
      notify("Compétence retirée.");
    } catch (err) {
      notify(err.message);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.del("/me");
      setMe(null);
    } catch (err) {
      notify(err.message);
    }
  };

  const set = (k) => (e) => setSkill({ ...skill, [k]: e.target.value });

  return (
    <>
      <h1>Mon profil talents</h1>
      <p className="lead">Ajoutez les compétences que vous avez en dehors de votre poste. Une compétence avec une preuve (diplôme, certificat, portfolio) est marquée « Justifiée » après vérification par l'admin RH.</p>

      <div className={`visibility ${me.visible ? "on" : ""}`}>
        <div>
          <strong>{me.visible ? "Votre profil est visible" : "Votre profil est masqué"}</strong>
          <span>{me.visible ? "L'admin RH peut vous trouver et proposer une mission." : "Personne ne peut vous trouver dans la recherche pour l'instant."}</span>
        </div>
        <button className="btn" onClick={toggleVisible}>{me.visible ? "Masquer mon profil" : "Rendre mon profil visible"}</button>
      </div>

      <div className="two">
        <div className="stack">
          <form className="panel" onSubmit={addSkill}>
            <h2>Ajouter une compétence</h2>
            <div className="row">
              <Field id="s-name" label="Compétence" placeholder="ex. Web design" value={skill.name} onChange={set("name")} required maxLength={80} />
              <Field id="s-domain" as="select" label="Domaine" value={skill.domain || domains[0] || ""} onChange={set("domain")}>
                {domains.map((d) => <option key={d}>{d}</option>)}
              </Field>
            </div>
            <div className="row">
              <Field id="s-level" as="select" label="Niveau" value={skill.level} onChange={set("level")}>
                {levels.map((l) => <option key={l}>{l}</option>)}
              </Field>
              <Field id="s-years" type="number" min={0} max={60} label="Années d'expérience" value={skill.years} onChange={set("years")} />
            </div>
            <Field id="s-desc" as="textarea" rows={3} maxLength={500} label="En quelques mots" placeholder="ex. BTS Design graphique, sites vitrines pour des associations" value={skill.description} onChange={set("description")} />
            <div className="field">
              <label htmlFor="s-proof">Preuve : diplôme, certificat, attestation</label>
              <input key={fileKey} id="s-proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files[0] || null)} />
              <span className="hint">PDF ou image, 4 Mo maximum. Seul l'admin RH peut ouvrir ce fichier.</span>
            </div>
            <Field id="s-url" type="url" label="Ou lien vers un portfolio" placeholder="https://monportfolio.fr" value={skill.portfolioUrl} onChange={set("portfolioUrl")} />
            {error && <p className="error" role="alert">{error}</p>}
            <div className="actions"><button className="btn" disabled={busy}>{busy ? "Envoi…" : "Ajouter à mon profil"}</button></div>
          </form>

          <form className="panel" onSubmit={saveInfo}>
            <h2>Mes informations</h2>
            <Field id="p-name" label="Prénom et nom" value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} required />
            <div className="row">
              <Field id="p-job" label="Poste actuel" value={info.jobTitle} onChange={(e) => setInfo({ ...info, jobTitle: e.target.value })} />
              <Field id="p-sector" label="Secteur" value={info.sector} onChange={(e) => setInfo({ ...info, sector: e.target.value })} />
            </div>
            <Field id="p-dispo" as="select" label="Disponibilité pour des missions" value={info.availability} onChange={(e) => setInfo({ ...info, availability: e.target.value })}>
              {availability.map((a) => <option key={a}>{a}</option>)}
            </Field>
            <div className="actions"><button className="btn ghost">Enregistrer</button></div>
          </form>
        </div>

        <div className="stack">
          <div className="panel">
            <span className="label">Ce que voit l'admin RH</span>
            <Badge person={{ ...me, ...info }} footer={<span className="dispo">{info.availability}</span>}>
              {me.skills.length === 0 && <p className="hint">Ajoutez votre première compétence avec le formulaire.</p>}
              {me.skills.map((s) => (
                <SkillLine key={s.id} skill={s} actions={<button className="link danger" onClick={() => removeSkill(s.id)} aria-label={`Retirer ${s.name}`}>Retirer</button>} />
              ))}
            </Badge>
          </div>
          <div className="panel danger-zone">
            <h2>Supprimer mon compte</h2>
            <p className="hint">Votre profil, vos compétences, vos fichiers et vos propositions de mission sont effacés définitivement.</p>
            <div className="actions"><button className="btn danger" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</button></div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Modal title="Supprimer votre compte ?" onClose={() => setConfirmDelete(false)}>
          <p>Toutes vos données seront effacées. Cette action est définitive.</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Annuler</button>
            <button className="btn danger" onClick={deleteAccount}>Oui, tout supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Profile;
