import mongoose from "mongoose";
import multer from "multer";
import { proofBucket } from "./db.js";
import { MAX_PROOF_BYTES, PROOF_TYPES } from "./constants.js";

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const isId = (v) => mongoose.isValidObjectId(v);
export const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const cleanUrl = (u) => {
  if (!u) return "";
  try {
    const url = new URL(String(u).trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export const rhEmails = () =>
  (process.env.RH_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const deleteProof = async (fileId) => {
  if (!fileId) return;
  try { await proofBucket().delete(fileId); } catch { /* already deleted */ }
};

export const storeProof = (file, ownerId) =>
  new Promise((resolve, reject) => {
    const stream = proofBucket().openUploadStream(file.originalname, {
      metadata: { owner: ownerId, contentType: file.mimetype },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(file.buffer);
  });

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROOF_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (PROOF_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error("Accepted formats: PDF, JPG, PNG or WebP."), { status: 400 }));
  },
});
