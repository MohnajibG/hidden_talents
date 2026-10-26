import { useEffect, useState } from "react";
import { api } from "../api.js";

const Stats = ({ notify }) => {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/stats").then(setS).catch((e) => notify(e.message)); }, []);
  if (!s) return <p className="hint">Loading…</p>;

  const max = Math.max(1, ...s.byDomain.map((d) => d.skills));
  const totalSkills = s.byDomain.reduce((n, d) => n + d.skills, 0);
  const totalJustified = s.byDomain.reduce((n, d) => n + d.justified, 0);

  return (
    <>
      <h1>Overview</h1>
      <p className="lead">The talents available across the company, based on profiles made visible.</p>
      <div className="stats">
        <Stat label="Accounts created" value={s.users} />
        <Stat label="Visible profiles" value={s.visible} />
        <Stat label="Skills" value={totalSkills} sub={`of which ${totalJustified} justified`} />
        <Stat label="Accepted missions" value={s.missions.accepted || 0} sub={`out of ${(s.missions.accepted || 0) + (s.missions.declined || 0) + (s.missions.pending || 0)} proposed`} />
      </div>
      <div className="panel">
        <h2>Skills by domain</h2>
        {s.byDomain.length === 0 && <p className="hint">No visible skills for now.</p>}
        <div className="bars">
          {s.byDomain.map((d) => (
            <div key={d.domain} className="bar-row">
              <span className="bar-label">{d.domain}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(d.skills / max) * 100}%` }}>
                  <div className="bar-just" style={{ width: `${d.skills ? (d.justified / d.skills) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="bar-num">{d.skills} <small>({d.justified} justified)</small></span>
            </div>
          ))}
        </div>
        <p className="hint legend"><i className="sw just" /> Justified <i className="sw all" /> Declared</p>
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
