// Test de bout en bout de l'API. Nécessite une base MongoDB de test :
//   MONGODB_URI=mongodb://127.0.0.1:27017/talents-test npm test
// ATTENTION : la base indiquée est vidée au début du test.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

process.env.JWT_SECRET ||= "secret-de-test-suffisamment-long-pour-jwt-123456";
process.env.RH_EMAILS = "rh@exemple.com";
process.env.ALLOWED_EMAIL_DOMAIN = "exemple.com";

const { createApp } = await import("../server/app.js");
const { connectDb } = await import("../server/db.js");

let server, base;

before(async () => {
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI doit pointer vers une base de test");
  await connectDb();
  await mongoose.connection.db.dropDatabase();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await mongoose.disconnect();
});

// Un « navigateur » minimal qui garde le cookie de session.
function client() {
  let cookie = "";
  return async (method, path, body) => {
    const headers = cookie ? { cookie } : {};
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await fetch(base + path, { method, headers, body: payload });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json() : await res.arrayBuffer();
    return { status: res.status, data, type };
  };
}

const pdf = () => new Blob(["%PDF-1.4\n% diplome de test\n"], { type: "application/pdf" });

test("parcours complet : inscription, preuves, visibilité, recherche, missions, admin RH, suppression", async () => {
  const rh = client(), karim = client(), manon = client(), autre = client();

  // Inscriptions
  assert.equal((await autre("POST", "/auth/register", { email: "x@gmail.com", password: "motdepasse", fullName: "X" })).status, 400, "domaine refusé");
  await autre("POST", "/auth/register", { email: "autre@exemple.com", password: "motdepasse", fullName: "Autre Personne" });
  const r1 = await rh("POST", "/auth/register", { email: "rh@exemple.com", password: "motdepasse", fullName: "Rita RH" });
  assert.equal(r1.data.role, "admin_rh");
  const k1 = await karim("POST", "/auth/register", { email: "karim@exemple.com", password: "motdepasse", fullName: "Karim Benali", jobTitle: "Cuisinier", sector: "Restauration" });
  assert.equal(k1.data.role, "cast_member");
  assert.equal(k1.data.visible, false, "masqué par défaut");
  await manon("POST", "/auth/register", { email: "manon@exemple.com", password: "motdepasse", fullName: "Manon Lefort" });
  assert.equal((await karim("POST", "/auth/register", { email: "karim@exemple.com", password: "motdepasse", fullName: "K" })).status, 409);
  assert.equal((await autre("POST", "/auth/login", { email: "karim@exemple.com", password: "mauvais" })).status, 401);
  assert.equal((await client()("GET", "/me")).status, 401);

  // Compétences : une avec preuve, une sans, une avec lien invalide
  const fd = new FormData();
  Object.entries({ name: "Web design", domain: "Numérique & web", level: "Confirmé", years: "4", description: "BTS Design graphique" }).forEach(([k, v]) => fd.append(k, v));
  fd.append("proof", pdf(), "bts.pdf");
  let res = await karim("POST", "/me/skills", fd);
  assert.equal(res.status, 201);
  const web = res.data.skills[0];
  assert.equal(web.status, "pending");
  assert.ok(web.proofUrl);

  const fd2 = new FormData();
  Object.entries({ name: "Photographie", domain: "Création & arts", level: "Intermédiaire", years: "2", portfolioUrl: "javascript:alert(1)" }).forEach(([k, v]) => fd2.append(k, v));
  res = await karim("POST", "/me/skills", fd2);
  const photo = res.data.skills[1];
  assert.equal(photo.status, "declarative", "un lien non http ne compte pas comme preuve");
  assert.equal(photo.portfolioUrl, "");

  const bad = new FormData();
  Object.entries({ name: "Test", domain: "Inconnu", level: "Expert" }).forEach(([k, v]) => bad.append(k, v));
  assert.equal((await karim("POST", "/me/skills", bad)).status, 400);

  const exe = new FormData();
  Object.entries({ name: "Test", domain: "Autre", level: "Expert" }).forEach(([k, v]) => exe.append(k, v));
  exe.append("proof", new Blob(["MZ"], { type: "application/x-msdownload" }), "virus.exe");
  assert.equal((await karim("POST", "/me/skills", exe)).status, 400, "format de fichier refusé");

  // Un cast member ne peut pas se donner un rôle
  await karim("PATCH", "/me", { role: "admin_rh" });
  assert.equal((await karim("GET", "/me")).data.role, "cast_member");

  // Accès à la preuve interdit à un cast member tiers, autorisé au propriétaire
  assert.equal((await autre("GET", web.proofUrl.replace("/api", ""))).status, 403);
  const own = await karim("GET", web.proofUrl.replace("/api", ""));
  assert.equal(own.status, 200);
  assert.equal(own.type, "application/pdf");

  // Manon n'a pas accès à la recherche ni aux stats tant qu'elle n'est pas admin RH
  assert.equal((await manon("GET", "/talents")).status, 403);
  assert.equal((await manon("GET", "/stats")).status, 403);
  const users = (await rh("GET", "/rh/users?q=manon")).data;
  assert.equal(users.length, 1);
  assert.equal((await manon("PATCH", `/rh/users/${users[0].id}/role`, { role: "admin_rh" })).status, 403, "seul un admin RH peut changer un rôle");
  assert.equal((await rh("PATCH", `/rh/users/${users[0].id}/role`, { role: "admin_rh" })).status, 200);

  // Profil masqué : introuvable
  assert.equal((await manon("GET", "/talents?q=web")).data.length, 0);
  await karim("PATCH", "/me", { visible: true });
  let found = (await manon("GET", "/talents?q=web")).data;
  assert.equal(found.length, 1);
  assert.equal(found[0].fullName, "Karim Benali");
  assert.equal(found[0].email, "karim@exemple.com", "l'admin RH voit l'e-mail");
  assert.ok(found[0].skills[0].proofUrl, "l'admin RH voit le lien vers la preuve");
  assert.equal((await manon("GET", "/talents?q=" + encodeURIComponent("(.*"))).status, 200, "recherche protégée contre les regex");
  assert.equal((await manon("GET", "/talents?domain=Langues")).data.length, 0);
  assert.equal((await manon("GET", "/talents?status=justified")).data.length, 0);

  // Manon, maintenant admin RH, a aussi accès au fichier de preuve
  assert.equal((await manon("GET", web.proofUrl.replace("/api", ""))).status, 200);

  // Vérification RH
  const pending = (await rh("GET", "/rh/pending")).data;
  assert.equal(pending.length, 1);
  assert.equal(pending[0].skills.length, 1);
  assert.equal((await autre("GET", "/rh/pending")).status, 403);
  const karimId = pending[0].id;
  assert.equal((await rh("PATCH", `/rh/users/${karimId}/skills/${web.id}`, { status: "justified" })).status, 200);
  assert.equal((await rh("PATCH", `/rh/users/${karimId}/skills/${photo.id}`, { status: "rejected", note: "Lien manquant" })).status, 200);
  found = (await manon("GET", "/talents?status=justified")).data;
  assert.equal(found.length, 1);
  const seen = Object.fromEntries(found[0].skills.map((s) => [s.name, s.status]));
  assert.deepEqual(seen, { "Web design": "justified", Photographie: "rejected" }, "l'admin RH voit le statut réel, y compris un refus");
  const mine = (await karim("GET", "/me")).data.skills.find((s) => s.name === "Photographie");
  assert.equal(mine.status, "rejected");
  assert.equal(mine.reviewNote, "Lien manquant");

  // Missions
  assert.equal((await karim("POST", "/missions", { to: karimId, title: "t", message: "m" })).status, 403, "seul un admin RH propose des missions");
  assert.equal((await manon("POST", "/missions", { to: karimId, title: "Affiches du restaurant", message: "Bonjour Karim" })).status, 201);
  const inbox = (await karim("GET", "/missions")).data;
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].direction, "received");
  assert.equal(inbox[0].from.fullName, "Manon Lefort");
  assert.equal((await manon("PATCH", `/missions/${inbox[0].id}`, { status: "accepted" })).status, 404, "seul le destinataire répond");
  assert.equal((await karim("PATCH", `/missions/${inbox[0].id}`, { status: "accepted" })).status, 200);
  assert.equal((await manon("GET", "/missions")).data[0].status, "accepted");

  // Statistiques
  assert.equal((await autre("GET", "/stats")).status, 403);
  const stats = (await rh("GET", "/stats")).data;
  assert.equal(stats.users, 4);
  assert.equal(stats.visible, 1);
  assert.equal(stats.missions.accepted, 1);
  assert.equal(stats.byDomain.find((d) => d.domain === "Numérique & web").justified, 1);

  // Masquer puis supprimer son compte
  await karim("PATCH", "/me", { visible: false });
  assert.equal((await manon("GET", "/talents")).data.length, 0);
  assert.equal((await manon("POST", "/missions", { to: karimId, title: "t", message: "m" })).status, 404);
  assert.equal((await karim("DELETE", "/me")).status, 200);
  assert.equal((await karim("GET", "/me")).status, 401);
  assert.equal((await rh("GET", web.proofUrl.replace("/api", ""))).status, 404, "preuve effacée");
  assert.equal((await manon("GET", "/missions")).data.length, 0, "missions effacées");
});
