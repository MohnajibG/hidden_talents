// The Backend is deployed separately: the URL is configurable via VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Small API client: returns the JSON or throws an error with the server's message.
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
    const err = new Error(data.error || "Something went wrong.");
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

// The server returns relative paths (e.g. proofUrl: "/api/proofs/xxx"): prefix them
// with the Backend's URL so an <a href> works cross-origin.
export const fileUrl = (path) => (path ? API_URL + path : path);

// Full-page navigation: the Backend redirects to Okta, then back here once logged in.
export const oktaLoginUrl = () => `${API_URL}/api/auth/okta/login`;

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
