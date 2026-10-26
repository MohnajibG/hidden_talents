import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models.js";
import { setSession, clearSession } from "../auth.js";
import { selfView } from "../serialize.js";
import { wrap, rhEmails } from "../lib.js";

const router = Router();

router.post("/auth/register", wrap(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const fullName = String(req.body.fullName || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Invalid email address." });
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase();
  if (domain && !email.endsWith("@" + domain)) {
    return res.status(400).json({ error: `Please use your work email address (@${domain}).` });
  }
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (!fullName) return res.status(400).json({ error: "Please enter your first and last name." });
  if (await User.exists({ email })) return res.status(409).json({ error: "An account already exists with this address." });

  const user = await User.create({
    email,
    fullName,
    jobTitle: String(req.body.jobTitle || "").trim(),
    sector: String(req.body.sector || "").trim(),
    passwordHash: await bcrypt.hash(password, 10),
    role: rhEmails().includes(email) ? "admin_rh" : "cast_member",
  });
  setSession(res, user);
  res.status(201).json(selfView(user));
}));

router.post("/auth/login", wrap(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(String(req.body.password || ""), user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });
  setSession(res, user);
  res.json(selfView(user));
}));

router.post("/auth/logout", (req, res) => { clearSession(res); res.json({ ok: true }); });

export default router;
