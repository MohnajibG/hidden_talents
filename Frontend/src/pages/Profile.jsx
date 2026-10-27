import { useState } from "react";
import { api } from "../api.js";
import { Badge, SkillLine, Modal, Field } from "../components.jsx";

const EMPTY_SKILL = { name: "", domain: "", level: "Advanced", years: 1, description: "", portfolioUrl: "" };

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
      notify("Profile saved.");
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleVisible = async () => {
    try {
      const updated = await api.patch("/me", { visible: !me.visible });
      setMe(updated);
      notify(updated.visible ? "Your profile is visible to the admin RH." : "Your profile is hidden.");
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
      notify(file || skill.portfolioUrl ? "Skill added. The admin RH will review your proof." : "Skill added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (id) => {
    try {
      setMe(await api.del(`/me/skills/${id}`));
      notify("Skill removed.");
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
      <h1>My talent profile</h1>
      <p className="lead">Add the skills you have outside your job. A skill with proof (degree, certificate, portfolio) is marked "Justified" after review by the admin RH.</p>

      <div className={`visibility ${me.visible ? "on" : ""}`}>
        <div>
          <strong>{me.visible ? "Your profile is visible" : "Your profile is hidden"}</strong>
          <span>{me.visible ? "The admin RH can find you and propose a mission." : "No one can find you in search for now."}</span>
        </div>
        <button className="btn" onClick={toggleVisible}>{me.visible ? "Hide my profile" : "Make my profile visible"}</button>
      </div>

      <div className="two">
        <div className="stack">
          <form className="panel" onSubmit={addSkill}>
            <h2>Add a skill</h2>
            <div className="row">
              <Field id="s-name" label="Skill" placeholder="e.g. Web design" value={skill.name} onChange={set("name")} required maxLength={80} />
              <Field id="s-domain" as="select" label="Domain" value={skill.domain || domains[0] || ""} onChange={set("domain")}>
                {domains.map((d) => <option key={d}>{d}</option>)}
              </Field>
            </div>
            <div className="row">
              <Field id="s-level" as="select" label="Level" value={skill.level} onChange={set("level")}>
                {levels.map((l) => <option key={l}>{l}</option>)}
              </Field>
              <Field id="s-years" type="number" min={0} max={60} label="Years of experience" value={skill.years} onChange={set("years")} />
            </div>
            <Field id="s-desc" as="textarea" rows={3} maxLength={500} label="In a few words" placeholder="e.g. Graphic design degree, websites for local associations" value={skill.description} onChange={set("description")} />
            <div className="field">
              <label htmlFor="s-proof">Proof: degree, certificate, attestation</label>
              <input key={fileKey} id="s-proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files[0] || null)} />
              <span className="hint">PDF or image, 4 MB maximum. Only the admin RH can open this file.</span>
            </div>
            <Field id="s-url" type="url" label="Or a link to a portfolio" placeholder="https://myportfolio.com" value={skill.portfolioUrl} onChange={set("portfolioUrl")} />
            {error && <p className="error" role="alert">{error}</p>}
            <div className="actions"><button className="btn" disabled={busy}>{busy ? "Sending…" : "Add to my profile"}</button></div>
          </form>

          <form className="panel" onSubmit={saveInfo}>
            <h2>My information</h2>
            <Field id="p-name" label="First and last name" value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} required />
            <div className="row">
              <Field id="p-job" label="Current job title" value={info.jobTitle} onChange={(e) => setInfo({ ...info, jobTitle: e.target.value })} />
              <Field id="p-sector" label="Sector" value={info.sector} onChange={(e) => setInfo({ ...info, sector: e.target.value })} />
            </div>
            <Field id="p-dispo" as="select" label="Availability for missions" value={info.availability} onChange={(e) => setInfo({ ...info, availability: e.target.value })}>
              {availability.map((a) => <option key={a}>{a}</option>)}
            </Field>
            <div className="actions"><button className="btn ghost">Save</button></div>
          </form>
        </div>

        <div className="stack">
          <div className="panel">
            <span className="label">What the admin RH sees</span>
            <Badge person={{ ...me, ...info }} footer={<span className="dispo">{info.availability}</span>}>
              {me.skills.length === 0 && <p className="hint">Add your first skill using the form.</p>}
              {me.skills.map((s) => (
                <SkillLine key={s.id} skill={s} actions={<button className="link danger" onClick={() => removeSkill(s.id)} aria-label={`Remove ${s.name}`}>Remove</button>} />
              ))}
            </Badge>
          </div>
          <div className="panel danger-zone">
            <h2>Delete my account</h2>
            <p className="hint">Your profile, skills, files and mission proposals are permanently erased.</p>
            <div className="actions"><button className="btn danger" onClick={() => setConfirmDelete(true)}>Delete my account</button></div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Modal title="Delete your account?" onClose={() => setConfirmDelete(false)}>
          <p>All your data will be erased. This action is permanent.</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn danger" onClick={deleteAccount}>Yes, delete everything</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Profile;
