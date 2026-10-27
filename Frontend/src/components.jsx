import { initials, fileUrl } from "./api.js";
import { useLang } from "./i18n.jsx";

export const StatusPill = ({ status }) => {
  const { label } = useLang();
  return <span className={`pill ${status}`}>{label("skillStatus", status)}</span>;
};

export const SkillLine = ({ skill, actions }) => {
  const { t, label } = useLang();
  return (
    <div className="skill">
      <div>
        <strong>{skill.name}</strong>
        <small>
          {label("domain", skill.domain)} · {label("level", skill.level)} · {skill.years} {skill.years > 1 ? t("components.years") : t("components.year")}
          {skill.description ? ` · ${skill.description}` : ""}
        </small>
        {(skill.portfolioUrl || skill.proofUrl) && (
          <small className="proofs">
            {skill.portfolioUrl && <a href={skill.portfolioUrl} target="_blank" rel="noreferrer noopener">{t("components.portfolio")}</a>}
            {skill.proofUrl && <a href={fileUrl(skill.proofUrl)} target="_blank" rel="noreferrer">{skill.proofFileName || t("components.attachedProof")}</a>}
          </small>
        )}
        {skill.status === "rejected" && skill.reviewNote && <small className="note">{t("components.hrNote", { note: skill.reviewNote })}</small>}
      </div>
      <div className="skill-side">
        <StatusPill status={skill.status} />
        {actions}
      </div>
    </div>
  );
};

export const Badge = ({ person, footer, children }) => {
  const { t } = useLang();
  return (
    <article className="badge">
      <div className="badge-top">
        <div className="av">{initials(person.fullName)}</div>
        <div className="who">
          <strong>{person.fullName}</strong>
          <span>{[person.jobTitle, person.sector].filter(Boolean).join(" · ") || t("components.noJobTitle")}</span>
        </div>
      </div>
      <div className="badge-body">
        {children ?? (person.skills.length
          ? person.skills.map((s) => <SkillLine key={s.id} skill={s} />)
          : <p className="hint">{t("components.noSkillsYet")}</p>)}
      </div>
      {footer && <div className="badge-foot">{footer}</div>}
    </article>
  );
};

export const Modal = ({ title, children, onClose }) => (
  <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="panel">
      <h2>{title}</h2>
      {children}
    </div>
  </div>
);

export const Field = ({ id, label, hint, as = "input", children, ...props }) => {
  const Tag = as;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} {...props}>{children}</Tag>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
};
