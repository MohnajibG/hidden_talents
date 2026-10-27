import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";

const Stats = ({ notify }) => {
  const { t, label } = useLang();
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/stats").then(setS).catch((e) => notify(e.message)); }, []);
  if (!s) return <p className="hint">{t("missions.loading")}</p>;

  const max = Math.max(1, ...s.byDomain.map((d) => d.skills));
  const totalSkills = s.byDomain.reduce((n, d) => n + d.skills, 0);
  const totalJustified = s.byDomain.reduce((n, d) => n + d.justified, 0);

  return (
    <>
      <h1>{t("stats.heading")}</h1>
      <p className="lead">{t("stats.lead")}</p>
      <div className="stats">
        <Stat label={t("stats.accounts")} value={s.users} />
        <Stat label={t("stats.visibleProfiles")} value={s.visible} />
        <Stat label={t("stats.skills")} value={totalSkills} sub={t("stats.skillsSub", { n: totalJustified })} />
        <Stat label={t("stats.acceptedMissions")} value={s.missions.accepted || 0} sub={t("stats.acceptedSub", { n: (s.missions.accepted || 0) + (s.missions.declined || 0) + (s.missions.pending || 0) })} />
      </div>
      <div className="panel">
        <h2>{t("stats.byDomain")}</h2>
        {s.byDomain.length === 0 && <p className="hint">{t("stats.noSkills")}</p>}
        <div className="bars">
          {s.byDomain.map((d) => (
            <div key={d.domain} className="bar-row">
              <span className="bar-label">{label("domain", d.domain)}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.skills / max) * 100}%` }}>
                  <div className="bar-just" style={{ width: `${d.skills ? (d.justified / d.skills) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="bar-num">{d.skills} <small>{t("stats.justifiedCount", { n: d.justified })}</small></span>
            </div>
          ))}
        </div>
        <p className="hint legend"><i className="sw just" /> {t("stats.legendJustified")} <i className="sw all" /> {t("stats.legendDeclared")}</p>
      </div>
    </>
  );
};

export default Stats;

const Stat = ({ label, value, sub }) => (
  <div className="stat">
    <span className="label">{label}</span>
    <b>{value}</b>
    {sub && <small>{sub}</small>}
  </div>
);
