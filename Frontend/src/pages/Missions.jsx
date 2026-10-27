import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useLang } from "../i18n.jsx";

const Missions = ({ notify }) => {
  const { t, label, lang } = useLang();
  const [list, setList] = useState(null);

  const load = () => api.get("/missions").then(setList).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);

  const answer = async (id, status) => {
    try {
      await api.patch(`/missions/${id}`, { status });
      notify(status === "accepted" ? t("missions.accepted") : t("missions.declined"));
      load();
    } catch (e) {
      notify(e.message);
    }
  };

  const received = list?.filter((m) => m.direction === "received") || [];
  const sent = list?.filter((m) => m.direction === "sent") || [];
  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <>
      <h1>{t("missions.heading")}</h1>
      <p className="lead">{t("missions.lead")}</p>
      {list === null && <p className="hint">{t("missions.loading")}</p>}

      <section className="stack">
        <h2>{t("missions.received")}</h2>
        {list && received.length === 0 && <div className="empty">{t("missions.noneReceived")}</div>}
        {received.map((m) => (
          <article key={m.id} className="mission">
            <div className="mission-head">
              <div>
                <strong>{m.title}</strong>
                <small>{t("missions.from", {
                  name: m.from?.fullName || t("missions.former"),
                  job: m.from?.jobTitle ? ` · ${m.from.jobTitle}` : "",
                  date: new Date(m.createdAt).toLocaleDateString(dateLocale),
                })}</small>
              </div>
              <span className={`pill m-${m.status}`}>{label("missionStatus", m.status)}</span>
            </div>
            <p className="msg">{m.message}</p>
            {m.status === "pending" && (
              <div className="actions">
                <button className="btn ghost" onClick={() => answer(m.id, "declined")}>{t("missions.decline")}</button>
                <button className="btn" onClick={() => answer(m.id, "accepted")}>{t("missions.accept")}</button>
              </div>
            )}
          </article>
        ))}
      </section>

      {sent.length > 0 && (
        <section className="stack">
          <h2>{t("missions.sent")}</h2>
          {sent.map((m) => (
            <article key={m.id} className="mission">
              <div className="mission-head">
                <div>
                  <strong>{m.title}</strong>
                  <small>{t("missions.to", {
                    name: m.to?.fullName || t("missions.former"),
                    date: new Date(m.createdAt).toLocaleDateString(dateLocale),
                  })}</small>
                </div>
                <span className={`pill m-${m.status}`}>{label("missionStatus", m.status)}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
};

export default Missions;
