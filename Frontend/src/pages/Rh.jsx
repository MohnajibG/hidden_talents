import { useEffect, useState } from "react";
import { api, ROLE_LABELS } from "../api.js";
import { Badge, SkillLine } from "../components.jsx";

const Rh = ({ me, notify }) => (
  <>
    <h1>Espace RH</h1>
    <p className="lead">Vérifiez les preuves envoyées par les cast members et attribuez le rôle admin RH.</p>
    <Pending notify={notify} />
    <Roles me={me} notify={notify} />
  </>
);

export default Rh;

const Pending = ({ notify }) => {
  const [list, setList] = useState(null);
  const [notes, setNotes] = useState({});
  const load = () => api.get("/rh/pending").then(setList).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);

  const review = async (userId, skillId, status) => {
    try {
      await api.patch(`/rh/users/${userId}/skills/${skillId}`, { status, note: notes[skillId] || "" });
      notify(status === "justified" ? "Compétence justifiée." : "Preuve refusée.");
      load();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="stack">
      <h2>Preuves à vérifier {list && <span className="count">{list.reduce((n, u) => n + u.skills.length, 0)}</span>}</h2>
      {list && list.length === 0 && <div className="empty">Aucune preuve en attente.</div>}
      <div className="grid">
        {list?.map((u) => (
          <Badge key={u.id} person={u}>
            {u.skills.map((s) => (
              <div key={s.id} className="review">
                <SkillLine skill={s} />
                <input
                  aria-label={`Motif pour ${s.name}`} placeholder="Motif en cas de refus (facultatif)"
                  value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                />
                <div className="actions">
                  <button className="btn ghost small" onClick={() => review(u.id, s.id, "rejected")}>Refuser</button>
                  <button className="btn small" onClick={() => review(u.id, s.id, "justified")}>Valider</button>
                </div>
              </div>
            ))}
          </Badge>
        ))}
      </div>
    </section>
  );
};

const Roles = ({ me, notify }) => {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get("/rh/users" + (q ? "?q=" + encodeURIComponent(q) : "")).then(setUsers).catch((e) => notify(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/rh/users/${id}/role`, { role });
      setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
      notify("Rôle mis à jour.");
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="panel">
      <h2>Rôles des utilisateurs</h2>
      <input type="search" aria-label="Rechercher un utilisateur" placeholder="Rechercher par nom ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>E-mail</th><th>Poste</th><th>Rôle</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.jobTitle}</td>
                <td>
                  <select aria-label={`Rôle de ${u.fullName}`} value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u.id, e.target.value)}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
