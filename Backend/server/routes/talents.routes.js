import { Router } from "express";
import { User, Mission } from "../models.js";
import { requireAuth, requireRole } from "../auth.js";
import { talentView } from "../serialize.js";
import { wrap, escapeRegex } from "../lib.js";
import { MISSION_STATUS } from "../constants.js";

const router = Router();

// ---------- Talent search (admin RH) ----------
router.get("/talents", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const { q, domain, status, availability } = req.query;
  const filter = { visible: true, _id: { $ne: req.user._id } };
  if (availability) filter.availability = String(availability);
  const rx = q ? new RegExp(escapeRegex(String(q).slice(0, 60)), "i") : null;
  // Pre-filter in the database (dotted fields, widely compatible), then exact check:
  // the SAME skill must satisfy every criterion.
  filter["skills.0"] = { $exists: true };
  if (domain) filter["skills.domain"] = String(domain);
  if (status === "justified") filter["skills.status"] = "justified";
  if (rx) filter["skills.searchText"] = rx;
  const matches = (s) =>
    (!domain || s.domain === domain) &&
    (status !== "justified" || s.status === "justified") &&
    (!rx || rx.test(s.searchText || `${s.name} ${s.description}`));
  const users = await User.find(filter).sort({ updatedAt: -1 }).limit(500);
  res.json(users.filter((u) => u.skills.some(matches)).slice(0, 200).map((u) => talentView(u, req.user.role)));
}));

router.get("/stats", requireAuth, requireRole("admin_rh"), wrap(async (req, res) => {
  const [users, visibleUsers, ...missionCounts] = await Promise.all([
    User.countDocuments(),
    User.find({ visible: true }).select("skills.domain skills.status").lean(),
    ...MISSION_STATUS.map((s) => Mission.countDocuments({ status: s })),
  ]);
  const domains = {};
  for (const u of visibleUsers) {
    for (const s of u.skills) {
      const d = (domains[s.domain] ||= { domain: s.domain, skills: 0, justified: 0 });
      d.skills += 1;
      if (s.status === "justified") d.justified += 1;
    }
  }
  res.json({
    users,
    visible: visibleUsers.length,
    byDomain: Object.values(domains).sort((a, b) => b.skills - a.skills),
    missions: Object.fromEntries(MISSION_STATUS.map((s, i) => [s, missionCounts[i]])),
  });
}));

export default router;
