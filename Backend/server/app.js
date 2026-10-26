import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { connectDb } from "./db.js";
import { isAllowedOrigin } from "./origin.js";
import { wrap } from "./lib.js";

import metaRoutes from "./routes/meta.routes.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import talentsRoutes from "./routes/talents.routes.js";
import missionsRoutes from "./routes/missions.routes.js";
import rhRoutes from "./routes/rh.routes.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use("/api", wrap(async (req, res, next) => { await connectDb(); next(); }));

  const api = express.Router();
  api.use(metaRoutes);
  api.use(authRoutes);
  api.use(profileRoutes);
  api.use(talentsRoutes);
  api.use(missionsRoutes);
  api.use(rhRoutes);

  app.use("/api", api);
  app.use("/api", (req, res) => res.status(404).json({ error: "Unknown route." }));

  // Errors: readable messages, no technical details sent to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "File too large (4 MB maximum)." : "File rejected.";
      return res.status(400).json({ error: msg });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: "Some fields are missing or invalid." });
    }
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Server error, please try again in a moment." });
  });

  return app;
};
