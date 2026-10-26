import { useEffect, useState } from "react";
import { api } from "../api.js";

const LABELS = { pending: "En attente", accepted: "Acceptée", declined: "Refusée" };

const Missions = ({ notify }) => {
  const [list, setList] = useState(null);

  const load = () => api.get("/missions").then(setList).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);

  const answer = async (id, status) => {
    try {
      await api.patch(`/missions/${id}`, { status });
      notify(status === "accepted" ? "Mission acceptée. Le demandeur va vous recontacter." : "Proposition refusée.");
      load();
    } catch (e) {
      notify(e.message);
    }
  };

  const received = list?.filter((m) => m.direction === "received") || [];
  const sent = list?.filter((m) => m.direction === "sent") || [];

  return (
    <>
      <h1>Missions</h1>
      <p className="lead">Les propositions reçues grâce à votre profil, et celles que vous avez envoyées. Vous pouvez refuser une proposition sans vous justifier.</p>
      {list === null && <p className="hint">Chargement…</p>}

      <section className="stack">
        <h2>Reçues</h2>
        {list && received.length === 0 && <div className="empty">Aucune proposition pour l'instant. Rendez votre profil visible pour être trouvé.</div>}
        {received.map((m) => (
          <article key={m.id} className="mission">
            <div className="mission-head">
              <div>
                <strong>{m.title}</strong>
                <small>De {m.from?.fullName || "un ancien compte"}{m.from?.jobTitle ? ` · ${m.from.jobTitle}` : ""} · {new Date(m.createdAt).toLocaleDateString("fr-FR")}</small>
              </div>
              <span className={`pill m-${m.status}`}>{LABELS[m.status]}</span>
            </div>
            <p className="msg">{m.message}</p>
            {m.status === "pending" && (
              <div className="actions">
                <button className="btn ghost" onClick={() => answer(m.id, "declined")}>Refuser</button>
                <button className="btn" onClick={() => answer(m.id, "accepted")}>Accepter</button>
              </div>
            )}
          </article>
        ))}
      </section>

      {sent.length > 0 && (
        <section className="stack">
          <h2>Envoyées</h2>
          {sent.map((m) => (
            <article key={m.id} className="mission">
              <div className="mission-head">
                <div>
                  <strong>{m.title}</strong>
                  <small>À {m.to?.fullName || "un ancien compte"} · {new Date(m.createdAt).toLocaleDateString("fr-FR")}</small>
                </div>
                <span className={`pill m-${m.status}`}>{LABELS[m.status]}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
};

export default Missions;
