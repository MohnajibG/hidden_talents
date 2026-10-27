import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";
import { Badge, SkillLine } from "../components.jsx";

const ROLE_KEYS = ["cast_member", "admin_rh"];

const Rh = ({ me, notify }) => {
  const { t } = useLang();
  return (
    <>
      <h1>{t("rh.heading")}</h1>
      <p className="lead">{t("rh.lead")}</p>
      <Pending notify={notify} />
      <Roles me={me} notify={notify} />
    </>
  );
};

export default Rh;

const Pending = ({ notify }) => {
  const { t } = useLang();
  const [list, setList] = useState(null);
  const [notes, setNotes] = useState({});
  const load = () => api.get("/rh/pending").then(setList).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);

  const review = async (userId, skillId, status) => {
    try {
      await api.patch(`/rh/users/${userId}/skills/${skillId}`, { status, note: notes[skillId] || "" });
      notify(status === "justified" ? t("rh.skillJustified") : t("rh.proofRejected"));
      load();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="stack">
      <h2>{t("rh.pendingHeading")} {list && <span className="count">{list.reduce((n, u) => n + u.skills.length, 0)}</span>}</h2>
      {list && list.length === 0 && <div className="empty">{t("rh.noPending")}</div>}
      <div className="grid">
        {list?.map((u) => (
          <Badge key={u.id} person={u}>
            {u.skills.map((s) => (
              <div key={s.id} className="review">
                <SkillLine skill={s} />
                <input
                  aria-label={t("rh.noteAria", { name: s.name })} placeholder={t("rh.notePlaceholder")}
                  value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                />
                <div className="actions">
                  <button className="btn ghost small" onClick={() => review(u.id, s.id, "rejected")}>{t("rh.reject")}</button>
                  <button className="btn small" onClick={() => review(u.id, s.id, "justified")}>{t("rh.approve")}</button>
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
  const { t, label } = useLang();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const id = setTimeout(() => {
      api.get("/rh/users" + (q ? "?q=" + encodeURIComponent(q) : "")).then(setUsers).catch((e) => notify(e.message));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/rh/users/${id}/role`, { role });
      setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
      notify(t("rh.roleUpdated"));
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <section className="panel">
      <h2>{t("rh.rolesHeading")}</h2>
      <input type="search" aria-label={t("rh.searchUserAria")} placeholder={t("rh.searchUserPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>{t("rh.colName")}</th><th>{t("rh.colEmail")}</th><th>{t("rh.colJob")}</th><th>{t("rh.colRole")}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.jobTitle}</td>
                <td>
                  <select aria-label={t("rh.roleOfAria", { name: u.fullName })} value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u.id, e.target.value)}>
                    {ROLE_KEYS.map((k) => <option key={k} value={k}>{label("role", k)}</option>)}
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
