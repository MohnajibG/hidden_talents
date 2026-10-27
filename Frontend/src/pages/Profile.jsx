import { useState } from "react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";
import { Badge, SkillLine, Modal, Field } from "../components.jsx";

const EMPTY_SKILL = { name: "", domain: "", level: "Advanced", years: 1, description: "", portfolioUrl: "" };

const Profile = ({ me, setMe, options, notify }) => {
  const { t, label } = useLang();
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
      notify(t("profile.saved"));
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleVisible = async () => {
    try {
      const updated = await api.patch("/me", { visible: !me.visible });
      setMe(updated);
      notify(updated.visible ? t("profile.nowVisible") : t("profile.nowHidden"));
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
      notify(file || skill.portfolioUrl ? t("profile.skillWithProofAdded") : t("profile.skillAdded"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (id) => {
    try {
      setMe(await api.del(`/me/skills/${id}`));
      notify(t("profile.skillRemoved"));
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
      <h1>{t("profile.heading")}</h1>
      <p className="lead">{t("profile.lead")}</p>

      <div className={`visibility ${me.visible ? "on" : ""}`}>
        <div>
          <strong>{me.visible ? t("profile.visibleTitle") : t("profile.hiddenTitle")}</strong>
          <span>{me.visible ? t("profile.visibleHint") : t("profile.hiddenHint")}</span>
        </div>
        <button className="btn" onClick={toggleVisible}>{me.visible ? t("profile.hideBtn") : t("profile.showBtn")}</button>
      </div>

      <div className="two">
        <div className="stack">
          <form className="panel" onSubmit={addSkill}>
            <h2>{t("profile.addSkillHeading")}</h2>
            <div className="row">
              <Field id="s-name" label={t("profile.skillLabel")} placeholder={t("profile.skillPlaceholder")} value={skill.name} onChange={set("name")} required maxLength={80} />
              <Field id="s-domain" as="select" label={t("profile.domainLabel")} value={skill.domain || domains[0] || ""} onChange={set("domain")}>
                {domains.map((d) => <option key={d} value={d}>{label("domain", d)}</option>)}
              </Field>
            </div>
            <div className="row">
              <Field id="s-level" as="select" label={t("profile.levelLabel")} value={skill.level} onChange={set("level")}>
                {levels.map((l) => <option key={l} value={l}>{label("level", l)}</option>)}
              </Field>
              <Field id="s-years" type="number" min={0} max={60} label={t("profile.yearsLabel")} value={skill.years} onChange={set("years")} />
            </div>
            <Field id="s-desc" as="textarea" rows={3} maxLength={500} label={t("profile.descLabel")} placeholder={t("profile.descPlaceholder")} value={skill.description} onChange={set("description")} />
            <div className="field">
              <label htmlFor="s-proof">{t("profile.proofLabel")}</label>
              <input key={fileKey} id="s-proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files[0] || null)} />
              <span className="hint">{t("profile.proofHint")}</span>
            </div>
            <Field id="s-url" type="url" label={t("profile.portfolioLabel")} placeholder="https://myportfolio.com" value={skill.portfolioUrl} onChange={set("portfolioUrl")} />
            {error && <p className="error" role="alert">{error}</p>}
            <div className="actions"><button className="btn" disabled={busy}>{busy ? t("profile.sending") : t("profile.addToProfile")}</button></div>
          </form>

          <form className="panel" onSubmit={saveInfo}>
            <h2>{t("profile.infoHeading")}</h2>
            <Field id="p-name" label={t("profile.nameLabel")} value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} required />
            <div className="row">
              <Field id="p-job" label={t("profile.jobLabel")} value={info.jobTitle} onChange={(e) => setInfo({ ...info, jobTitle: e.target.value })} />
              <Field id="p-sector" label={t("profile.sectorLabel")} value={info.sector} onChange={(e) => setInfo({ ...info, sector: e.target.value })} />
            </div>
            <Field id="p-dispo" as="select" label={t("profile.availabilityLabel")} value={info.availability} onChange={(e) => setInfo({ ...info, availability: e.target.value })}>
              {availability.map((a) => <option key={a} value={a}>{label("availability", a)}</option>)}
            </Field>
            <div className="actions"><button className="btn ghost">{t("profile.save")}</button></div>
          </form>
        </div>

        <div className="stack">
          <div className="panel">
            <span className="label">{t("profile.whatAdminSees")}</span>
            <Badge person={{ ...me, ...info }} footer={<span className="dispo">{label("availability", info.availability)}</span>}>
              {me.skills.length === 0 && <p className="hint">{t("profile.addFirstSkillHint")}</p>}
              {me.skills.map((s) => (
                <SkillLine key={s.id} skill={s} actions={<button className="link danger" onClick={() => removeSkill(s.id)} aria-label={t("profile.removeAria", { name: s.name })}>{t("profile.remove")}</button>} />
              ))}
            </Badge>
          </div>
          <div className="panel danger-zone">
            <h2>{t("profile.deleteHeading")}</h2>
            <p className="hint">{t("profile.deleteHint")}</p>
            <div className="actions"><button className="btn danger" onClick={() => setConfirmDelete(true)}>{t("profile.deleteBtn")}</button></div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Modal title={t("profile.deleteModalTitle")} onClose={() => setConfirmDelete(false)}>
          <p>{t("profile.deleteModalBody")}</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>{t("profile.cancel")}</button>
            <button className="btn danger" onClick={deleteAccount}>{t("profile.deleteConfirm")}</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Profile;
