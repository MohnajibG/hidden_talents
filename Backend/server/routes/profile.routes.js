import { Router } from "express";
import mongoose from "mongoose";
import { proofBucket } from "../db.js";
import { Mission } from "../models.js";
import { requireAuth, clearSession } from "../auth.js";
import { selfView } from "../serialize.js";
import { wrap, pick, isId, cleanUrl, deleteProof, storeProof, upload } from "../lib.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => res.json(selfView(req.user)));

router.patch("/me", requireAuth, wrap(async (req, res) => {
  const data = pick(req.body, ["fullName", "jobTitle", "sector", "availability", "visible"]);
  if ("visible" in data) data.visible = data.visible === true;
  Object.assign(req.user, data);
  await req.user.save();
  res.json(selfView(req.user));
}));

// Right to erasure: deletes the account, its proof files and related missions.
router.delete("/me", requireAuth, wrap(async (req, res) => {
  await Promise.all(req.user.skills.map((s) => deleteProof(s.proofFileId)));
  await Mission.deleteMany({ $or: [{ from: req.user._id }, { to: req.user._id }] });
  await req.user.deleteOne();
  clearSession(res);
  res.json({ ok: true });
}));

router.post("/me/skills", requireAuth, upload.single("proof"), wrap(async (req, res) => {
  if (req.user.skills.length >= 30) return res.status(400).json({ error: "30 skills maximum per profile." });
  const portfolioUrl = cleanUrl(req.body.portfolioUrl);
  let proofFileId = null;
  if (req.file) proofFileId = await storeProof(req.file, req.user._id);
  req.user.skills.push({
    name: req.body.name,
    domain: req.body.domain,
    level: req.body.level,
    years: Number(req.body.years) || 0,
    description: req.body.description || "",
    portfolioUrl,
    proofFileId,
    proofFileName: req.file ? req.file.originalname : "",
    status: proofFileId || portfolioUrl ? "pending" : "declarative",
  });
  try {
    await req.user.save();
  } catch (e) {
    await deleteProof(proofFileId);
    throw e;
  }
  res.status(201).json(selfView(req.user));
}));

router.delete("/me/skills/:skillId", requireAuth, wrap(async (req, res) => {
  const skill = req.user.skills.id(req.params.skillId);
  if (!skill) return res.status(404).json({ error: "Skill not found." });
  await deleteProof(skill.proofFileId);
  skill.deleteOne();
  await req.user.save();
  res.json(selfView(req.user));
}));

// Proof file: visible to its owner and to the admin RH only.
router.get("/proofs/:fileId", requireAuth, wrap(async (req, res) => {
  if (!isId(req.params.fileId)) return res.status(404).end();
  const fileId = new mongoose.Types.ObjectId(req.params.fileId);
  const [file] = await proofBucket().find({ _id: fileId }).toArray();
  if (!file) return res.status(404).json({ error: "File not found." });
  const isOwner = String(file.metadata?.owner) === String(req.user._id);
  if (!isOwner && req.user.role !== "admin_rh") return res.status(403).json({ error: "Access reserved to admin RH." });
  res.setHeader("Content-Type", file.metadata?.contentType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  res.setHeader("Cache-Control", "private, no-store");
  proofBucket().openDownloadStream(fileId).pipe(res);
}));

export default router;
