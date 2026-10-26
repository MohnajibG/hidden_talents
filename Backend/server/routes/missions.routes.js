import { Router } from "express";
import { User, Mission } from "../models.js";
import { requireAuth, requireRole } from "../auth.js";
import { wrap, isId } from "../lib.js";

const router = Router();

// ---------- Mission proposals ----------
router.post("/missions", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const { to, title, message } = req.body;
  if (!isId(to)) return res.status(400).json({ error: "Invalid recipient." });
  const target = await User.findOne({ _id: to, visible: true });
  if (!target) return res.status(404).json({ error: "This profile is no longer visible." });
  const m = await Mission.create({ from: req.user._id, to: target._id, title, message });
  res.status(201).json({ id: String(m._id) });
}));

router.get("/missions", requireAuth, wrap(async (req, res) => {
  const list = await Mission.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("from", "fullName jobTitle")
    .populate("to", "fullName jobTitle");
  res.json(list.map((m) => ({
    id: String(m._id),
    direction: String(m.to?._id) === String(req.user._id) ? "received" : "sent",
    from: m.from ? { fullName: m.from.fullName, jobTitle: m.from.jobTitle } : null,
    to: m.to ? { fullName: m.to.fullName, jobTitle: m.to.jobTitle } : null,
    title: m.title,
    message: m.message,
    status: m.status,
    createdAt: m.createdAt,
  })));
}));

// Only the recipient can answer, and can always decline.
router.patch("/missions/:id", requireAuth, wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).end();
  const status = req.body.status;
  if (!["accepted", "declined"].includes(status)) return res.status(400).json({ error: "Invalid response." });
  const m = await Mission.findOne({ _id: req.params.id, to: req.user._id });
  if (!m) return res.status(404).json({ error: "Proposal not found." });
  m.status = status;
  m.answeredAt = new Date();
  await m.save();
  res.json({ ok: true });
}));

export default router;
