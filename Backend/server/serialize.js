// What each role is allowed to see of a profile.

export const publicSkill = (s, { withProof = false } = {}) => {
  const out = {
    id: String(s._id),
    name: s.name,
    domain: s.domain,
    level: s.level,
    years: s.years,
    description: s.description,
    // A rejection is only shown to the employee and the admin: others see "declarative".
    status: !withProof && s.status === "rejected" ? "declarative" : s.status,
    hasProof: !!(s.proofFileId || s.portfolioUrl),
  };
  if (withProof) {
    out.portfolioUrl = s.portfolioUrl;
    out.proofFileName = s.proofFileName;
    out.proofUrl = s.proofFileId ? `/api/proofs/${s.proofFileId}` : null;
    out.reviewNote = s.reviewNote;
  }
  return out;
};

// The employee sees everything on their own profile.
export const selfView = (u) => ({
  id: String(u._id),
  email: u.email,
  fullName: u.fullName,
  jobTitle: u.jobTitle,
  sector: u.sector,
  role: u.role,
  availability: u.availability,
  visible: u.visible,
  skills: u.skills.map((s) => publicSkill(s, { withProof: true })),
});

// Admin RH: full access, email and proof files included.
export const talentView = (u, viewerRole) => {
  const isAdmin = viewerRole === "admin_rh";
  return {
    id: String(u._id),
    fullName: u.fullName,
    jobTitle: u.jobTitle,
    sector: u.sector,
    availability: u.availability,
    ...(isAdmin ? { email: u.email, role: u.role, visible: u.visible } : {}),
    skills: u.skills.map((s) => publicSkill(s, { withProof: isAdmin })),
  };
};
