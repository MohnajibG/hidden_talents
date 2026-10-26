import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Badge, Modal } from "../components.jsx";
import { Field } from "./Auth.jsx";

const Talents = ({ options, notify }) => {
  const [filters, setFilters] = useState({ q: "", domain: "", status: "", availability: "" });
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      api.get("/talents" + (qs ? "?" + qs : ""))
        .then((r) => { setList(r); setError(""); })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <h1>Find a talent</h1>
      <p className="lead">Only cast members who chose to make their profile visible appear here.</p>

      <div className="filters">
        <input className="q" type="search" aria-label="Search a skill" placeholder="Search: web design, gardening, sign language…" value={filters.q} onChange={set("q")} />
        <select aria-label="Domain" value={filters.domain} onChange={set("domain")}>
          <option value="">All domains</option>
          {options?.domains.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select aria-label="Proof" value={filters.status} onChange={set("status")}>
          <option value="">All skills</option>
          <option value="justified">Justified only</option>
        </select>
        <select aria-label="Availability" value={filters.availability} onChange={set("availability")}>
          <option value="">Any availability</option>
          {options?.availability.filter((a) => a !== "Not available").map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {list === null && !error && <p className="hint">Searching…</p>}
      {list && list.length === 0 && (
        <div className="empty">No profile matches. Try another keyword or remove a filter.</div>
      )}
      <div className="grid">
        {list?.map((p) => (
          <Badge
            key={p.id}
            person={p}
            footer={
              <>
                <span className="dispo">{p.availability}</span>
                {p.availability !== "Not available" && (
                  <button className="btn ghost small" onClick={() => setTarget(p)}>Propose a mission</button>
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
  const first = target.fullName.split(" ")[0];
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState(
    `Hi ${first},\n\nYour Hidden Talents profile caught our attention for a project. Would you be up for discussing it?`
  );
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    try {
      await api.post("/missions", { to: target.id, title, message });
      notify(`Proposal sent to ${target.fullName}.`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={`Propose a mission to ${target.fullName}`} onClose={onClose}>
      <form className="stack" onSubmit={send}>
        <p className="hint">The person sees your proposal in their Missions tab and remains free to accept or decline.</p>
        <Field id="m-title" label="Mission title" placeholder="e.g. Redesign the restaurant's signage" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <Field id="m-msg" as="textarea" rows={6} label="Message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn amber">Send proposal</button>
        </div>
      </form>
    </Modal>
  );
};
