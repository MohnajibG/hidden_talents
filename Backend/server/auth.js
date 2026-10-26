import jwt from "jsonwebtoken";
import { User } from "./models.js";

const COOKIE = "tc_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET is missing or too short (32 characters minimum)");
  return s;
};

export const setSession = (res, user) => {
  const token = jwt.sign({ sub: String(user._id) }, secret(), { expiresIn: "7d" });
  const crossSite = process.env.NODE_ENV === "production";
  res.cookie(COOKIE, token, {
    httpOnly: true,
    // Frontend and Backend are deployed on different domains in prod:
    // SameSite=None (+ Secure, required with None) is needed for the cookie to follow.
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite,
    maxAge: MAX_AGE_MS,
    path: "/",
  });
};

export const clearSession = (res) => {
  res.clearCookie(COOKIE, { path: "/" });
};

// Loads the logged-in user into req.user, or responds 401.
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: "Please log in to continue." });
    const { sub } = jwt.verify(token, secret());
    const user = await User.findById(sub);
    if (!user) return res.status(401).json({ error: "Session expired, please log in again." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expired, please log in again." });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "This page is reserved for another role." });
  }
  next();
};
