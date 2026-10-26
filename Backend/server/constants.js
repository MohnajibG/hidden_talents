export const ROLES = ["cast_member", "admin_rh"];

export const DOMAINS = [
  "Digital & web",
  "Creative & arts",
  "Languages",
  "Nature & gardening",
  "Technical & DIY",
  "Teaching & training",
  "Health & wellness",
  "Business & finance",
  "Other",
];

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export const AVAILABILITY = ["One-off missions", "A few hours / month", "Long-term project", "Not available"];

// declarative : no proof provided
// pending     : proof provided, awaiting HR review
// justified   : proof verified by HR
// rejected    : proof rejected by HR
export const SKILL_STATUS = ["declarative", "pending", "justified", "rejected"];

export const MISSION_STATUS = ["pending", "accepted", "declined"];

export const MAX_PROOF_BYTES = 4 * 1024 * 1024; // request body limit
export const PROOF_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
