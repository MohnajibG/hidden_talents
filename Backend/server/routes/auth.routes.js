import { Router } from "express";
import { User } from "../models.js";
import { setSession, clearSession } from "../auth.js";
import { wrap, rhEmails } from "../lib.js";
import { randomToken, codeChallengeFromVerifier, authorizeUrl, exchangeCode, fetchUserInfo } from "../okta.js";

const router = Router();

// Short-lived cookie that bridges /okta/login and /okta/callback: holds the PKCE
// verifier and the CSRF state, scoped to this flow's own path so it never leaks elsewhere.
const OAUTH_COOKIE = "tc_oauth";
const OAUTH_COOKIE_PATH = "/api/auth/okta";

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

router.get("/auth/okta/login", (req, res) => {
  const state = randomToken();
  const verifier = randomToken();
  res.cookie(OAUTH_COOKIE, JSON.stringify({ state, verifier }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60 * 1000,
    path: OAUTH_COOKIE_PATH,
  });
  res.redirect(authorizeUrl({ state, codeChallenge: codeChallengeFromVerifier(verifier) }));
});

router.get("/auth/okta/callback", wrap(async (req, res) => {
  const fail = (reason) => res.redirect(`${frontendUrl()}/?auth_error=${encodeURIComponent(reason)}`);

  const raw = req.cookies?.[OAUTH_COOKIE];
  res.clearCookie(OAUTH_COOKIE, { path: OAUTH_COOKIE_PATH });
  if (!raw) return fail("expired");

  let saved;
  try { saved = JSON.parse(raw); } catch { return fail("invalid"); }
  if (!req.query.state || req.query.state !== saved.state) return fail("state_mismatch");
  if (!req.query.code) return fail("missing_code");

  const tokens = await exchangeCode(String(req.query.code), saved.verifier);
  const info = await fetchUserInfo(tokens.access_token);
  const email = String(info.email || "").trim().toLowerCase();
  if (!email) return fail("no_email");

  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase();
  if (domain && !email.endsWith("@" + domain)) return fail("domain_not_allowed");

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      oktaId: info.sub,
      fullName: info.name || email.split("@")[0],
      role: rhEmails().includes(email) ? "admin_rh" : "cast_member",
    });
  } else if (!user.oktaId) {
    user.oktaId = info.sub;
    await user.save();
  }

  setSession(res, user);
  res.redirect(frontendUrl());
}));

router.post("/auth/logout", (req, res) => { clearSession(res); res.json({ ok: true }); });

export default router;
