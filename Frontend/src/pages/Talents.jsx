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
      <h1>Trouver un talent</h1>
      <p className="lead">Seuls les cast members qui ont choisi de rendre leur profil visible apparaissent ici.</p>

      <div className="filters">
        <input className="q" type="search" aria-label="Rechercher une compétence" placeholder="Rechercher : web design, jardinage, langue des signes…" value={filters.q} onChange={set("q")} />
        <select aria-label="Domaine" value={filters.domain} onChange={set("domain")}>
          <option value="">Tous les domaines</option>
          {options?.domains.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select aria-label="Preuve" value={filters.status} onChange={set("status")}>
          <option value="">Toutes les compétences</option>
          <option value="justified">Justifiées seulement</option>
        </select>
        <select aria-label="Disponibilité" value={filters.availability} onChange={set("availability")}>
          <option value="">Toute disponibilité</option>
          {options?.availability.filter((a) => a !== "Pas disponible").map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {list === null && !error && <p className="hint">Recherche…</p>}
      {list && list.length === 0 && (
        <div className="empty">Aucun profil ne correspond. Essayez un autre mot-clé ou retirez un filtre.</div>
      )}
      <div className="grid">
        {list?.map((p) => (
          <Badge
            key={p.id}
            person={p}
            footer={
              <>
                <span className="dispo">{p.availability}</span>
                {p.availability !== "Pas disponible" && (
                  <button className="btn ghost small" onClick={() => setTarget(p)}>Proposer une mission</button>
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
    `Bonjour ${first},\n\nVotre profil Talents Cachés a retenu notre attention pour un projet. Seriez-vous partant(e) pour en discuter ?`
  );
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    try {
      await api.post("/missions", { to: target.id, title, message });
      notify(`Proposition envoyée à ${target.fullName}.`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={`Proposer une mission à ${target.fullName}`} onClose={onClose}>
      <form className="stack" onSubmit={send}>
        <p className="hint">La personne voit votre proposition dans son onglet Missions et reste libre d'accepter ou de refuser.</p>
        <Field id="m-title" label="Intitulé de la mission" placeholder="ex. Refonte de l'affichage du restaurant" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        <Field id="m-msg" as="textarea" rows={6} label="Message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button className="btn amber">Envoyer la proposition</button>
        </div>
      </form>
    </Modal>
  );
};
