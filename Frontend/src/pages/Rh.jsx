import { useEffect, useState } from "react";
import { api, ROLE_LABELS } from "../api.js";
import { Badge, SkillLine } from "../components.jsx";

const Rh = ({ me, notify }) => (
  <>
    <h1>Admin RH area</h1>
    <p className="lead">Review proofs sent by cast members and grant the admin RH role.</p>
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
      notify(status === "justified" ? "Skill justified." : "Proof rejected.");
      load();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="stack">
      <h2>Proofs to review {list && <span className="count">{list.reduce((n, u) => n + u.skills.length, 0)}</span>}</h2>
      {list && list.length === 0 && <div className="empty">No proof pending.</div>}
      <div className="grid">
        {list?.map((u) => (
          <Badge key={u.id} person={u}>
            {u.skills.map((s) => (
              <div key={s.id} className="review">
                <SkillLine skill={s} />
                <input
                  aria-label={`Note for ${s.name}`} placeholder="Note in case of rejection (optional)"
                  value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                />
                <div className="actions">
                  <button className="btn ghost small" onClick={() => review(u.id, s.id, "rejected")}>Reject</button>
                  <button className="btn small" onClick={() => review(u.id, s.id, "justified")}>Approve</button>
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
      notify("Role updated.");
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="panel">
      <h2>User roles</h2>
      <input type="search" aria-label="Search a user" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Job title</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.jobTitle}</td>
                <td>
                  <select aria-label={`Role of ${u.fullName}`} value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u.id, e.target.value)}>
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
