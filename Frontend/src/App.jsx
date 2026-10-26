import { useEffect, useState } from "react";
import { api, ROLE_LABELS } from "./api.js";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";
import Talents from "./pages/Talents.jsx";
import Missions from "./pages/Missions.jsx";
import Rh from "./pages/Rh.jsx";
import Stats from "./pages/Stats.jsx";

const TABS = [
  { id: "profil", label: "Mon profil", roles: ["cast_member", "admin_rh"] },
  { id: "talents", label: "Trouver un talent", roles: ["admin_rh"] },
  { id: "missions", label: "Missions", roles: ["cast_member", "admin_rh"] },
  { id: "stats", label: "Vue d'ensemble", roles: ["admin_rh"] },
  { id: "rh", label: "Espace RH", roles: ["admin_rh"] },
];

const App = () => {
  const [me, setMe] = useState(undefined); // undefined = chargement, null = déconnecté
  const [options, setOptions] = useState(null);
  const [tab, setTab] = useState(() => location.hash.slice(1) || "profil");
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/me").then(setMe).catch(() => setMe(null));
    api.get("/options").then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const tabs = me ? TABS.filter((t) => t.roles.includes(me.role)) : [];
  const current = tabs.find((t) => t.id === tab) ? tab : "profil";

  const go = (id) => {
    setTab(id);
    history.replaceState(null, "", "#" + id);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setMe(null);
  };

  if (me === undefined) return <div className="loading">Chargement…</div>;
  if (!me) return <Auth onLogin={setMe} />;

  const shared = { me, setMe, options, notify: setToast };

  return (
    <>
      <header className="topbar">
        <div className="wrap bar">
          <div className="brand"><i />Talents Cachés</div>
          <nav className="tabs" aria-label="Navigation">
            {tabs.map((t) => (
              <button key={t.id} aria-current={current === t.id ? "page" : undefined} onClick={() => go(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="user">
            <span>{me.fullName} · {ROLE_LABELS[me.role]}</span>
            <button className="btn ghost small" onClick={logout}>Se déconnecter</button>
          </div>
        </div>
      </header>
      <main className="wrap page">
        {current === "profil" && <Profile {...shared} />}
        {current === "talents" && <Talents {...shared} />}
        {current === "missions" && <Missions {...shared} />}
        {current === "stats" && <Stats {...shared} />}
        {current === "rh" && <Rh {...shared} />}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
};

export default App;
