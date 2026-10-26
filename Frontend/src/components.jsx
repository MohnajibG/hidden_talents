import { initials, STATUS_LABELS, fileUrl } from "./api.js";

export const StatusPill = ({ status }) => <span className={`pill ${status}`}>{STATUS_LABELS[status]}</span>;

export const SkillLine = ({ skill, actions }) => (
  <div className="skill">
    <div>
      <strong>{skill.name}</strong>
      <small>
        {skill.domain} · {skill.level} · {skill.years} an{skill.years > 1 ? "s" : ""}
        {skill.description ? ` · ${skill.description}` : ""}
      </small>
      {(skill.portfolioUrl || skill.proofUrl) && (
        <small className="proofs">
          {skill.portfolioUrl && <a href={skill.portfolioUrl} target="_blank" rel="noreferrer noopener">Portfolio</a>}
          {skill.proofUrl && <a href={fileUrl(skill.proofUrl)} target="_blank" rel="noreferrer">{skill.proofFileName || "Preuve jointe"}</a>}
        </small>
      )}
      {skill.status === "rejected" && skill.reviewNote && <small className="note">Motif RH : {skill.reviewNote}</small>}
    </div>
    <div className="skill-side">
      <StatusPill status={skill.status} />
      {actions}
    </div>
  </div>
);

export const Badge = ({ person, footer, children }) => (
  <article className="badge">
    <div className="badge-top">
      <div className="av">{initials(person.fullName)}</div>
      <div className="who">
        <strong>{person.fullName}</strong>
        <span>{[person.jobTitle, person.sector].filter(Boolean).join(" · ") || "Poste non renseigné"}</span>
      </div>
    </div>
    <div className="badge-body">
      {children ?? (person.skills.length
        ? person.skills.map((s) => <SkillLine key={s.id} skill={s} />)
        : <p className="hint">Aucune compétence ajoutée pour l'instant.</p>)}
    </div>
    {footer && <div className="badge-foot">{footer}</div>}
  </article>
);

export const Modal = ({ title, children, onClose }) => (
  <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="panel">
      <h2>{title}</h2>
      {children}
    </div>
  </div>
);
