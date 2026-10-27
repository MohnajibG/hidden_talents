import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";
import { Badge, Modal, Field } from "../components.jsx";

const Talents = ({ options, notify }) => {
  const { t, label } = useLang();
  const [filters, setFilters] = useState({ q: "", domain: "", status: "", availability: "" });
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      api.get("/talents" + (qs ? "?" + qs : ""))
        .then((r) => { setList(r); setError(""); })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(id);
  }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <h1>{t("talents.heading")}</h1>
      <p className="lead">{t("talents.lead")}</p>

      <div className="filters">
        <input className="q" type="search" aria-label={t("talents.searchAria")} placeholder={t("talents.searchPlaceholder")} value={filters.q} onChange={set("q")} />
        <select aria-label={t("talents.domainAria")} value={filters.domain} onChange={set("domain")}>
          <option value="">{t("talents.allDomains")}</option>
          {options?.domains.map((d) => <option key={d} value={d}>{label("domain", d)}</option>)}
        </select>
        <select aria-label={t("talents.proofAria")} value={filters.status} onChange={set("status")}>
          <option value="">{t("talents.allSkills")}</option>
          <option value="justified">{t("talents.justifiedOnly")}</option>
        </select>
        <select aria-label={t("talents.availabilityAria")} value={filters.availability} onChange={set("availability")}>
          <option value="">{t("talents.anyAvailability")}</option>
          {options?.availability.filter((a) => a !== "Not available").map((a) => <option key={a} value={a}>{label("availability", a)}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {list === null && !error && <p className="hint">{t("talents.searching")}</p>}
      {list && list.length === 0 && (
        <div className="empty">{t("talents.noMatch")}</div>
      )}
      <div className="grid">
        {list?.map((p) => (
          <Badge
            key={p.id}
            person={p}
            footer={
              <>
                <span className="dispo">{label("availability", p.availability)}</span>
                {p.availability !== "Not available" && (
                  <button className="btn ghost small" onClick={() => setTarget(p)}>{t("talents.proposeMission")}</button>
                )}
              </>
            }
          />
        ))}
      </div>

      {target && <MissionForm target={target} onClose={() => setTarget(null)} notify={notify} />}
    </>
  );
};

export default Talents;

const MissionForm = ({ target, onClose, notify }) => {
  const { t } = useLang();
  const first = target.fullName.split(" ")[0];
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState(t("talents.defaultMessage", { first }));
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    try {
      await api.post("/missions", { to: target.id, title, message });
      notify(t("talents.proposalSent", { name: target.fullName }));
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={t("talents.missionFormTitle", { name: target.fullName })} onClose={onClose}>
      <form className="stack" onSubmit={send}>
        <p className="hint">{t("talents.missionFormHint")}</p>
        <Field id="m-title" label={t("talents.missionTitleLabel")} placeholder={t("talents.missionTitlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <Field id="m-msg" as="textarea" rows={6} label={t("talents.messageLabel")} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>{t("profile.cancel")}</button>
          <button className="btn amber">{t("talents.sendProposal")}</button>
        </div>
      </form>
    </Modal>
  );
};
