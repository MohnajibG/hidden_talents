import { Router } from "express";
import { DOMAINS, LEVELS, AVAILABILITY } from "../constants.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));
router.get("/options", (req, res) => res.json({ domains: DOMAINS, levels: LEVELS, availability: AVAILABILITY }));

export default router;
