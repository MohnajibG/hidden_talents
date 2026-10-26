import { useEffect, useState } from "react";
import { api } from "../api.js";

const Stats = ({ notify }) => {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/stats").then(setS).catch((e) => notify(e.message)); }, []);
  if (!s) return <p className="hint">Chargement…</p>;

  const max = Math.max(1, ...s.byDomain.map((d) => d.skills));
  const totalSkills = s.byDomain.reduce((n, d) => n + d.skills, 0);
  const totalJustified = s.byDomain.reduce((n, d) => n + d.justified, 0);

  return (
    <>
      <h1>Vue d'ensemble</h1>
      <p className="lead">Les talents disponibles dans l'entreprise, à partir des profils rendus visibles.</p>
      <div className="stats">
        <Stat label="Comptes créés" value={s.users} />
        <Stat label="Profils visibles" value={s.visible} />
        <Stat label="Compétences" value={totalSkills} sub={`dont ${totalJustified} justifiées`} />
        <Stat label="Missions acceptées" value={s.missions.accepted || 0} sub={`sur ${(s.missions.accepted || 0) + (s.missions.declined || 0) + (s.missions.pending || 0)} proposées`} />
      </div>
      <div className="panel">
        <h2>Compétences par domaine</h2>
        {s.byDomain.length === 0 && <p className="hint">Aucune compétence visible pour l'instant.</p>}
        <div className="bars">
          {s.byDomain.map((d) => (
            <div key={d.domain} className="bar-row">
              <span className="bar-label">{d.domain}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.skills / max) * 100}%` }}>
                  <div className="bar-just" style={{ width: `${d.skills ? (d.justified / d.skills) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="bar-num">{d.skills} <small>({d.justified} justifiées)</small></span>
            </div>
          ))}
        </div>
        <p className="hint legend"><i className="sw just" /> Justifiées <i className="sw all" /> Déclarées</p>
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
