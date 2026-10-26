import { useEffect, useState } from "react";
import { api } from "../api.js";

const LABELS = { pending: "Pending", accepted: "Accepted", declined: "Declined" };

const Missions = ({ notify }) => {
  const [list, setList] = useState(null);

  const load = () => api.get("/missions").then(setList).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);

  const answer = async (id, status) => {
    try {
      await api.patch(`/missions/${id}`, { status });
      notify(status === "accepted" ? "Mission accepted. The requester will get back to you." : "Proposal declined.");
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
      <p className="lead">Proposals received thanks to your profile, and the ones you've sent. You can decline a proposal without justifying yourself.</p>
      {list === null && <p className="hint">Loading…</p>}

      <section className="stack">
        <h2>Received</h2>
        {list && received.length === 0 && <div className="empty">No proposal yet. Make your profile visible to be found.</div>}
        {received.map((m) => (
          <article key={m.id} className="mission">
            <div className="mission-head">
              <div>
                <strong>{m.title}</strong>
                <small>From {m.from?.fullName || "a former account"}{m.from?.jobTitle ? ` · ${m.from.jobTitle}` : ""} · {new Date(m.createdAt).toLocaleDateString("en-US")}</small>
              </div>
              <span className={`pill m-${m.status}`}>{LABELS[m.status]}</span>
            </div>
            <p className="msg">{m.message}</p>
            {m.status === "pending" && (
              <div className="actions">
                <button className="btn ghost" onClick={() => answer(m.id, "declined")}>Decline</button>
                <button className="btn" onClick={() => answer(m.id, "accepted")}>Accept</button>
              </div>
            )}
          </article>
        ))}
      </section>

      {sent.length > 0 && (
        <section className="stack">
          <h2>Sent</h2>
          {sent.map((m) => (
            <article key={m.id} className="mission">
              <div className="mission-head">
                <div>
                  <strong>{m.title}</strong>
                  <small>To {m.to?.fullName || "a former account"} · {new Date(m.createdAt).toLocaleDateString("en-US")}</small>
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
