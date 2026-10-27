import mongoose from "mongoose";
import { ROLES, DOMAINS, LEVELS, AVAILABILITY, SKILL_STATUS, MISSION_STATUS } from "./constants.js";

const { Schema } = mongoose;

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    domain: { type: String, enum: DOMAINS, required: true },
    level: { type: String, enum: LEVELS, required: true },
    years: { type: Number, min: 0, max: 60, default: 0 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    portfolioUrl: { type: String, trim: true, maxlength: 300, default: "" },
    proofFileId: { type: Schema.Types.ObjectId, default: null },
    proofFileName: { type: String, default: "" },
    status: { type: String, enum: SKILL_STATUS, default: "declarative" },
    reviewNote: { type: String, maxlength: 300, default: "" },
    reviewedAt: { type: Date, default: null },
    // Name + description, for keyword search (computed automatically).
    searchText: { type: String, default: "", select: true },
  },
  { timestamps: true }
);

// Stays a regular function (not arrow): Mongoose binds `this` to the document here.
skillSchema.pre("validate", function () {
  this.searchText = `${this.name} ${this.description}`.trim();
});

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Set on first Okta login; absent only for accounts created before SSO was wired in.
    oktaId: { type: String, unique: true, sparse: true },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    jobTitle: { type: String, trim: true, maxlength: 80, default: "" },
    sector: { type: String, trim: true, maxlength: 80, default: "" },
    role: { type: String, enum: ROLES, default: "cast_member" },
    availability: { type: String, enum: AVAILABILITY, default: "One-off missions" },
    // Hidden by default: it's up to the employee to make themselves visible.
    visible: { type: Boolean, default: false },
    skills: { type: [skillSchema], default: [] },
  },
  { timestamps: true }
);

const missionSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: MISSION_STATUS, default: "pending" },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Mission = mongoose.models.Mission || mongoose.model("Mission", missionSchema);
