import { useEffect, useState } from "react";
import { api } from "./api.js";
import { useLang } from "./i18n.jsx";
import Auth from "./pages/Auth.jsx";
import Profile from "./pages/Profile.jsx";
import Talents from "./pages/Talents.jsx";
import Missions from "./pages/Missions.jsx";
import Rh from "./pages/Rh.jsx";
import Stats from "./pages/Stats.jsx";

const TABS = [
  { id: "profile", key: "app.tab.profile", roles: ["cast_member"] },
  { id: "talents", key: "app.tab.talents", roles: ["admin_rh"] },
  { id: "missions", key: "app.tab.missions", roles: ["cast_member", "admin_rh"] },
  { id: "stats", key: "app.tab.stats", roles: ["admin_rh"] },
  { id: "rh", key: "app.tab.rh", roles: ["admin_rh"] },
];

const App = () => {
  const { t, label, lang, setLang } = useLang();
  const [me, setMe] = useState(undefined); // undefined = loading, null = logged out
  const [options, setOptions] = useState(null);
  const [tab, setTab] = useState(() => location.hash.slice(1) || "profile");
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/me").then(setMe).catch(() => setMe(null));
    api.get("/options").then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const tabs = me ? TABS.filter((tb) => tb.roles.includes(me.role)) : [];
  const current = tabs.find((tb) => tb.id === tab) ? tab : tabs[0]?.id;

  const go = (id) => {
    setTab(id);
    history.replaceState(null, "", "#" + id);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setMe(null);
  };

  if (me === undefined) return <div className="loading">{t("app.loading")}</div>;
  if (!me) return <Auth />;

  const shared = { me, setMe, options, notify: setToast };

  return (
    <>
      <header className="topbar">
        <div className="wrap bar">
          <div className="brand"><i />Hidden Talents</div>
          <nav className="tabs" aria-label="Navigation">
            {tabs.map((tb) => (
              <button key={tb.id} aria-current={current === tb.id ? "page" : undefined} onClick={() => go(tb.id)}>
                {t(tb.key)}
              </button>
            ))}
          </nav>
          <div className="user">
            <div className="lang-switch" role="group" aria-label="Language">
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
              <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
            </div>
            <span>{me.fullName} · {label("role", me.role)}</span>
            <button className="btn ghost small" onClick={logout}>{t("app.logout")}</button>
          </div>
        </div>
      </header>
      <main className="wrap page">
        {current === "profile" && <Profile {...shared} />}
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
