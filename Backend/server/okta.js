import crypto from "node:crypto";

const base64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const randomToken = () => base64url(crypto.randomBytes(32));

export const codeChallengeFromVerifier = (verifier) =>
  base64url(crypto.createHash("sha256").update(verifier).digest());

const env = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} is missing from the environment variables`);
  return v;
};

export const authorizeUrl = ({ state, codeChallenge }) => {
  const params = new URLSearchParams({
    client_id: env("OKTA_CLIENT_ID"),
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: env("OKTA_REDIRECT_URI"),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${env("OKTA_ISSUER")}/v1/authorize?${params}`;
};

// The code exchange uses the client secret over a direct server-to-server HTTPS call
// (not a browser redirect), so the tokens we get back are inherently trustworthy —
// no need to separately verify the id_token's signature.
export const exchangeCode = async (code, codeVerifier) => {
  const res = await fetch(`${env("OKTA_ISSUER")}/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env("OKTA_REDIRECT_URI"),
      client_id: env("OKTA_CLIENT_ID"),
      client_secret: env("OKTA_CLIENT_SECRET"),
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Okta token exchange failed (${res.status})`);
  return res.json();
};

export const fetchUserInfo = async (accessToken) => {
  const res = await fetch(`${env("OKTA_ISSUER")}/v1/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Okta userinfo failed (${res.status})`);
  return res.json();
};
