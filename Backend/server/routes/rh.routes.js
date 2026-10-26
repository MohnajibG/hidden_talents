import { Router } from "express";
import { User } from "../models.js";
import { requireAuth, requireRole } from "../auth.js";
import { talentView } from "../serialize.js";
import { wrap, isId, escapeRegex } from "../lib.js";
import { ROLES } from "../constants.js";

const router = Router();

// ---------- Admin RH area ----------
router.get("/rh/pending", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const users = await User.find({ "skills.status": "pending" }).limit(200);
  res.json(users.map((u) => {
    const v = talentView(u, "admin_rh");
    v.skills = v.skills.filter((s) => s.status === "pending");
    return v;
  }));
}));

router.patch("/rh/users/:userId/skills/:skillId", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!["justified", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status." });
  if (!isId(req.params.userId)) return res.status(404).end();
  const user = await User.findById(req.params.userId);
  const skill = user?.skills.id(req.params.skillId);
  if (!skill) return res.status(404).json({ error: "Skill not found." });
  skill.status = status;
  skill.reviewNote = String(note || "").slice(0, 300);
  skill.reviewedAt = new Date();
  await user.save();
  res.json({ ok: true });
}));

router.get("/rh/users", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const q = String(req.query.q || "").slice(0, 60);
  const filter = q ? { $or: [{ fullName: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }] } : {};
  const users = await User.find(filter).sort({ fullName: 1 }).limit(100);
  res.json(users.map((u) => ({ id: String(u._id), fullName: u.fullName, email: u.email, jobTitle: u.jobTitle, role: u.role })));
}));

router.patch("/rh/users/:userId/role", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: "Invalid role." });
  if (!isId(req.params.userId)) return res.status(404).end();
  if (String(req.params.userId) === String(req.user._id) && req.body.role !== "admin_rh") {
    return res.status(400).json({ error: "You cannot remove your own admin RH role." });
  }
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  user.role = req.body.role;
  await user.save();
  res.json({ ok: true });
}));

export default router;
