// Le Backend est déployé séparément : l'URL est configurable via VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Petit client pour l'API : renvoie le JSON ou lève une erreur avec le message du serveur.
const request = async (method, url, body) => {
  const opts = { method, credentials: "include", headers: {} };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API_URL + "/api" + url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Une erreur est survenue.");
    err.status = res.status;
    throw err;
  }
  return data;
};

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body),
  patch: (url, body) => request("PATCH", url, body),
  del: (url) => request("DELETE", url),
};

export const ROLE_LABELS = {
  cast_member: "Cast member",
  admin_rh: "Admin RH",
};

export const STATUS_LABELS = {
  declarative: "Déclarative",
  pending: "En vérification",
  justified: "Justifiée",
  rejected: "Preuve refusée",
};

// Le serveur renvoie des chemins relatifs (ex: proofUrl: "/api/proofs/xxx") : on les
// préfixe avec l'URL du Backend pour qu'un <a href> fonctionne en cross-origin.
export const fileUrl = (path) => (path ? API_URL + path : path);

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
