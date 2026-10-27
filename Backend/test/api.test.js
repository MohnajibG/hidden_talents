// End-to-end API test. Needs a MongoDB test database:
//   MONGODB_URI=mongodb://127.0.0.1:27017/talents-test npm test
// WARNING: the given database is wiped at the start of the test.
//
// Login now happens through Okta (see server/routes/auth.routes.js), which this test
// doesn't drive end-to-end (that would need a live Okta tenant). Instead, accounts are
// created directly in the database and a session cookie is minted the same way
// setSession() does — this still exercises every route's authorization logic.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET ||= "test-secret-long-enough-for-jwt-123456";
process.env.RH_EMAILS = "rh@example.com";

const { createApp } = await import("../server/app.js");
const { connectDb } = await import("../server/db.js");
const { SESSION_COOKIE } = await import("../server/auth.js");
const { User } = await import("../server/models.js");

let server, base;

before(async () => {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI must point to a test database");
  await connectDb();
  await mongoose.connection.db.dropDatabase();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
});

// Creates a user (as Okta login would, on first sign-in) and returns a "browser" that
// sends its session cookie, like a client that already completed the Okta flow.
async function login({ email, fullName, role = "cast_member" }) {
  const user = await User.create({ email, fullName, role, oktaId: `test|${email}` });
  const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const cookie = `${SESSION_COOKIE}=${token}`;
  const call = async (method, path, body) => {
    const headers = { cookie };
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await fetch(base + path, { method, headers, body: payload });
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json() : await res.arrayBuffer();
    return { status: res.status, data, type };
  };
  return { call, user };
}

const anonymous = async (method, path, body) => {
  const headers = {};
  let payload;
  if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
  const res = await fetch(base + path, { method, headers, body: payload });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.arrayBuffer();
  return { status: res.status, data, type };
};

const pdf = () => new Blob(["%PDF-1.4\n% test diploma\n"], { type: "application/pdf" });

test("full journey: proofs, visibility, search, missions, admin RH, deletion", async () => {
  const { call: rh } = await login({ email: "rh@example.com", fullName: "Rita HR", role: "admin_rh" });
  const { call: karim } = await login({ email: "karim@example.com", fullName: "Karim Benali" });
  const { call: manon } = await login({ email: "manon@example.com", fullName: "Manon Lefort" });
  const { call: other } = await login({ email: "other@example.com", fullName: "Other Person" });

  assert.equal((await anonymous("GET", "/me")).status, 401);
  assert.equal((await karim("GET", "/me")).data.role, "cast_member");
  assert.equal((await karim("GET", "/me")).data.visible, false, "hidden by default");

  // Skills: one with a proof, one without, one with an invalid link
  const fd = new FormData();
  Object.entries({ name: "Web design", domain: "Digital & web", level: "Advanced", years: "4", description: "BTS Graphic Design" }).forEach(([k, v]) => fd.append(k, v));
  fd.append("proof", pdf(), "degree.pdf");
  let res = await karim("POST", "/me/skills", fd);
  assert.equal(res.status, 201);
  const web = res.data.skills[0];
  assert.equal(web.status, "pending");
  assert.ok(web.proofUrl);

  const fd2 = new FormData();
  Object.entries({ name: "Photography", domain: "Creative & arts", level: "Intermediate", years: "2", portfolioUrl: "javascript:alert(1)" }).forEach(([k, v]) => fd2.append(k, v));
  res = await karim("POST", "/me/skills", fd2);
  const photo = res.data.skills[1];
  assert.equal(photo.status, "declarative", "a non-http link doesn't count as proof");
  assert.equal(photo.portfolioUrl, "");

  const bad = new FormData();
  Object.entries({ name: "Test", domain: "Unknown", level: "Expert" }).forEach(([k, v]) => bad.append(k, v));
  assert.equal((await karim("POST", "/me/skills", bad)).status, 400);

  const exe = new FormData();
  Object.entries({ name: "Test", domain: "Other", level: "Expert" }).forEach(([k, v]) => exe.append(k, v));
  exe.append("proof", new Blob(["MZ"], { type: "application/x-msdownload" }), "virus.exe");
  assert.equal((await karim("POST", "/me/skills", exe)).status, 400, "file format rejected");

  // A cast member can't grant themselves a role
  await karim("PATCH", "/me", { role: "admin_rh" });
  assert.equal((await karim("GET", "/me")).data.role, "cast_member");

  // Proof access denied to an unrelated cast member, allowed to the owner
  assert.equal((await other("GET", web.proofUrl.replace("/api", ""))).status, 403);
  const own = await karim("GET", web.proofUrl.replace("/api", ""));
  assert.equal(own.status, 200);
  assert.equal(own.type, "application/pdf");

  // Manon has no access to search or stats until she's admin RH
  assert.equal((await manon("GET", "/talents")).status, 403);
  assert.equal((await manon("GET", "/stats")).status, 403);
  const users = (await rh("GET", "/rh/users?q=manon")).data;
  assert.equal(users.length, 1);
  assert.equal((await manon("PATCH", `/rh/users/${users[0].id}/role`, { role: "admin_rh" })).status, 403, "only an admin RH can change a role");
  assert.equal((await rh("PATCH", `/rh/users/${users[0].id}/role`, { role: "admin_rh" })).status, 200);

  // Hidden profile: not found
  assert.equal((await manon("GET", "/talents?q=web")).data.length, 0);
  await karim("PATCH", "/me", { visible: true });
  let found = (await manon("GET", "/talents?q=web")).data;
  assert.equal(found.length, 1);
  assert.equal(found[0].fullName, "Karim Benali");
  assert.equal(found[0].email, "karim@example.com", "admin RH sees the email");
  assert.ok(found[0].skills[0].proofUrl, "admin RH sees the proof link");
  assert.equal((await manon("GET", "/talents?q=" + encodeURIComponent("(.*"))).status, 200, "search is protected against regex");
  assert.equal((await manon("GET", "/talents?domain=Languages")).data.length, 0);
  assert.equal((await manon("GET", "/talents?status=justified")).data.length, 0);

  // Manon, now admin RH, also has access to the proof file
  assert.equal((await manon("GET", web.proofUrl.replace("/api", ""))).status, 200);

  // HR review
  const pending = (await rh("GET", "/rh/pending")).data;
  assert.equal(pending.length, 1);
  assert.equal(pending[0].skills.length, 1);
  assert.equal((await other("GET", "/rh/pending")).status, 403);
  const karimId = pending[0].id;
  assert.equal((await rh("PATCH", `/rh/users/${karimId}/skills/${web.id}`, { status: "justified" })).status, 200);
  assert.equal((await rh("PATCH", `/rh/users/${karimId}/skills/${photo.id}`, { status: "rejected", note: "Missing link" })).status, 200);
  found = (await manon("GET", "/talents?status=justified")).data;
  assert.equal(found.length, 1);
  const seen = Object.fromEntries(found[0].skills.map((s) => [s.name, s.status]));
  assert.deepEqual(seen, { "Web design": "justified", Photography: "rejected" }, "admin RH sees the real status, including a rejection");
  const mine = (await karim("GET", "/me")).data.skills.find((s) => s.name === "Photography");
  assert.equal(mine.status, "rejected");
  assert.equal(mine.reviewNote, "Missing link");

  // Missions
  assert.equal((await karim("POST", "/missions", { to: karimId, title: "t", message: "m" })).status, 403, "only admin RH proposes missions");
  assert.equal((await manon("POST", "/missions", { to: karimId, title: "Restaurant signage", message: "Hello Karim" })).status, 201);
  const inbox = (await karim("GET", "/missions")).data;
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].direction, "received");
  assert.equal(inbox[0].from.fullName, "Manon Lefort");
  assert.equal((await manon("PATCH", `/missions/${inbox[0].id}`, { status: "accepted" })).status, 404, "only the recipient can answer");
  assert.equal((await karim("PATCH", `/missions/${inbox[0].id}`, { status: "accepted" })).status, 200);
  assert.equal((await manon("GET", "/missions")).data[0].status, "accepted");

  // Stats
  assert.equal((await other("GET", "/stats")).status, 403);
  const stats = (await rh("GET", "/stats")).data;
  assert.equal(stats.users, 4);
  assert.equal(stats.visible, 1);
  assert.equal(stats.missions.accepted, 1);
  assert.equal(stats.byDomain.find((d) => d.domain === "Digital & web").justified, 1);

  // Hide then delete the account
  await karim("PATCH", "/me", { visible: false });
  assert.equal((await manon("GET", "/talents")).data.length, 0);
  assert.equal((await manon("POST", "/missions", { to: karimId, title: "t", message: "m" })).status, 404);
  assert.equal((await karim("DELETE", "/me")).status, 200);
  assert.equal((await karim("GET", "/me")).status, 401);
  assert.equal((await rh("GET", web.proofUrl.replace("/api", ""))).status, 404, "proof deleted");
  assert.equal((await manon("GET", "/missions")).data.length, 0, "missions deleted");
});
