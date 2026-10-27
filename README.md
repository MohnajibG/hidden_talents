# Hidden Talents

Internal platform where cast members declare the skills they have outside their job (degrees, portfolio, experience), and where the admin RH can find them for missions.

**Stack**: React (Vite) · Node.js (Express) · MongoDB (Mongoose, proofs stored in GridFS) · Okta (OIDC login). Everything is JavaScript.

**Organization**: `Frontend/` and `Backend/` are two independent applications (each with its own `package.json`), meant to be deployed separately — for example the Frontend on Vercel/Netlify and the Backend on Render/Railway/Fly.io.

## Roles

| Role | Can do |
| --- | --- |
| Cast member | Create their profile, add skills and proofs, make themselves visible or not, accept or decline a mission, delete their account |
| Admin RH | Everything above, plus search for talents, propose missions, see the overview (stats), review proofs, open files and grant roles |

Rules enforced by the API (tested in `Backend/test/api.test.js`):

- A profile is **hidden by default**. Only the employee can make it visible.
- A proof rejection by the admin RH is only shown to the employee and the admin RH.
- Only the recipient of a mission can answer it.
- Deleting an account erases the profile, files, and related missions.

## Authentication

Login goes through **Okta** (OAuth2 Authorization Code + PKCE), not an email/password form:

1. The Frontend sends the browser to `Backend GET /api/auth/okta/login`.
2. The Backend redirects to Okta's `/authorize` with a PKCE challenge.
3. Okta redirects back to `Backend GET /api/auth/okta/callback` with a code.
4. The Backend exchanges the code for tokens, fetches the profile from Okta's `/userinfo`, finds or creates the matching `User` by email, and sets its own session cookie.
5. The browser lands back on the Frontend, already logged in.

An email listed in `RH_EMAILS` gets the `admin_rh` role on its first login; everyone else gets `cast_member`.

## 1. Create the MongoDB database (free)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), then an **M0 (free)** cluster, in a region close to you.
2. *Database Access*: create a user with a password.
3. *Network Access*: add `0.0.0.0/0` (the Backend may not have a fixed IP address depending on the host).
4. *Connect › Drivers*: copy the connection string and add the database name before the `?`:
   `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/hidden-talents?retryWrites=true&w=majority`

## 2. Create the Okta app

1. Create a free [Okta Developer](https://developer.okta.com/signup/) org.
2. Applications → Create App Integration → **OIDC – OpenID Connect**, type **Web Application**.
3. Grant type: **Authorization Code**. Sign-in redirect URI: `http://localhost:3000/api/auth/okta/callback`. Sign-out redirect URI: `http://localhost:5173`.
4. Assignments: allow the users who should be able to log in.
5. Note the **Client ID**, **Client secret**, and the **Issuer** (Security → API → Authorization Servers → `default`).
6. Security → API → Authorization Servers → `default` → Access Policies: make sure at least one policy with a rule allowing the **Authorization Code** grant exists (a brand new authorization server has none by default, which makes every login fail with `access_denied`).

## 3. Run locally

Prerequisite: Node.js 20 or later. Two terminals, one per app.

```bash
# Terminal 1 — Backend (API on :3000)
cd Backend
npm install
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, OKTA_*, RH_EMAILS (PORT=3000 by default)
npm run dev
```

```bash
# Terminal 2 — Frontend (site on http://localhost:5173)
cd Frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000 by default, no need to change it locally
npm run dev
```

Log in with an address listed in `RH_EMAILS` to get the admin RH role.

## 4. Deploy

Both apps deploy **independently**, each with its own `package.json`:

**Backend** (e.g. Render, Railway, Fly.io):
- Build: `npm install` · Start: `npm start`
- Environment variables: `MONGODB_URI`, `JWT_SECRET`, `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `OKTA_REDIRECT_URI` (pointing at the deployed Backend), `RH_EMAILS`, `ALLOWED_EMAIL_DOMAIN` (optional), `FRONTEND_URL` (the exact URL of the deployed Frontend, for CORS + cookie), `NODE_ENV=production`.

**Frontend** (e.g. Vercel, Netlify):
- Project root directory: `Frontend`
- Build: `npm install && npm run build` · Output directory: `dist`
- Environment variable: `VITE_API_URL` = the deployed Backend's URL.

⚠️ Deploy the Backend first to know its URL, to set in `VITE_API_URL` on the Frontend and in `FRONTEND_URL` on the Backend — and add both the Backend's `/api/auth/okta/callback` and the Frontend's URL as additional redirect URIs on the Okta app.

## Environment variables

| Variable | Where | Role |
| --- | --- | --- |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret used to sign sessions, 32 characters minimum |
| `OKTA_ISSUER` | Backend | Okta domain + `/oauth2/default` (or a custom authorization server) |
| `OKTA_CLIENT_ID` | Backend | Client ID of the Okta OIDC app |
| `OKTA_CLIENT_SECRET` | Backend | Client secret of the Okta OIDC app |
| `OKTA_REDIRECT_URI` | Backend | Must exactly match the app's Sign-in redirect URI |
| `RH_EMAILS` | Backend | Addresses that get the admin RH role on first login, comma-separated |
| `ALLOWED_EMAIL_DOMAIN` | Backend | Optional: only accept addresses on this domain (e.g. `company.com`) |
| `FRONTEND_URL` | Backend | URL of the deployed Frontend, for CORS, the cross-origin cookie, and the post-login redirect |
| `NODE_ENV` | Backend | `production` once deployed (enables Secure + SameSite=None on the cookie) |
| `VITE_API_URL` | Frontend | URL of the deployed Backend |

## Tests

The test simulates the whole journey: proofs, visibility, search, missions, HR review, deletion. Login itself isn't driven through Okta (that would need a live tenant) — accounts are created directly in the database and a session cookie is minted the same way the Okta callback does, so every route's authorization logic is still exercised.

```bash
cd Backend
MONGODB_URI=mongodb://127.0.0.1:27017/talents-test npm test
```

⚠️ The given database is **wiped** at the start of the test: never use the production database.

## Structure

```
Backend/
  server/app.js            Express app: CORS, middleware, mounts the routes below
  server/okta.js            PKCE helpers, Okta token exchange, userinfo call
  server/origin.js          list of allowed CORS origins (local + FRONTEND_URL)
  server/models.js          Mongoose models (User with their skills, Mission)
  server/auth.js            session cookie (httpOnly + JWT) and role checks
  server/serialize.js       what each role is allowed to see
  server/constants.js       domains, levels, availability, limits
  server/lib.js             shared route helpers (wrap, upload, proof storage…)
  server/dev.js             local server entry point
  server/routes/            one router per area: auth, profile, talents, missions, rh, meta
  test/api.test.js          end-to-end test
  package.json               Backend dependencies and scripts

Frontend/
  index.html
  src/
    main.jsx, App.jsx
    api.js                  API calls (VITE_API_URL)
    i18n.jsx                 EN/FR translations and the language switcher
    components.jsx, pages/
  package.json               Frontend dependencies and scripts
```

## Known limitations and next steps

- **Proof files: 4 MB maximum** per request.
- **No login attempt rate limiting on the Backend itself**: Okta handles the actual login, but the API routes could still use rate limiting before a wider rollout (e.g. with Upstash Rate Limit).
- **No email notification** for new missions: they show up in the Missions tab.
- Search is designed for a few thousand profiles. Beyond that, a MongoDB text index will be needed.

## Before putting in real data

This application handles employees' personal data. Before opening it up to colleagues, get the project approved by HR, the DPO (GDPR) and IT, and inform the works council. The company's designated hosting may also be required. Until then, test with fictional accounts.
