# Hidden Talents

Internal platform where cast members declare the skills they have outside their job (degrees, portfolio, experience), and where the admin RH can find them for missions.

**Stack**: React (Vite) · Node.js (Express) · MongoDB (Mongoose, proofs stored in GridFS). Everything is JavaScript.

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

## 1. Create the MongoDB database (free)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), then an **M0 (free)** cluster, in a region close to you.
2. *Database Access*: create a user with a password.
3. *Network Access*: add `0.0.0.0/0` (the Backend may not have a fixed IP address depending on the host).
4. *Connect › Drivers*: copy the connection string and add the database name before the `?`:
   `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/hidden-talents?retryWrites=true&w=majority`

## 2. Run locally

Prerequisite: Node.js 20 or later. Two terminals, one per app.

```bash
# Terminal 1 — Backend (API on :3000)
cd Backend
npm install
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET and RH_EMAILS (PORT=3000 by default)
npm run dev
```

```bash
# Terminal 2 — Frontend (site on http://localhost:5173)
cd Frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000 by default, no need to change it locally
npm run dev
```

Sign up with an address listed in `RH_EMAILS`: that account gets the admin RH role.

## 3. Deploy

Both apps deploy **independently**, each with its own `package.json`:

**Backend** (e.g. Render, Railway, Fly.io):
- Build: `npm install` · Start: `npm start`
- Environment variables: `MONGODB_URI`, `JWT_SECRET`, `RH_EMAILS`, `ALLOWED_EMAIL_DOMAIN` (optional), `FRONTEND_URL` (the exact URL of the deployed Frontend, for CORS + cookie), `NODE_ENV=production`.

**Frontend** (e.g. Vercel, Netlify):
- Project root directory: `Frontend`
- Build: `npm install && npm run build` · Output directory: `dist`
- Environment variable: `VITE_API_URL` = the deployed Backend's URL.

⚠️ Deploy the Backend first to know its URL, to set in `VITE_API_URL` on the Frontend and in `FRONTEND_URL` on the Backend.

## Environment variables

| Variable | Where | Role |
| --- | --- | --- |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret used to sign sessions, 32 characters minimum |
| `RH_EMAILS` | Backend | Addresses that become admin RH at registration, comma-separated |
| `ALLOWED_EMAIL_DOMAIN` | Backend | Optional: only accept addresses on this domain (e.g. `company.com`) |
| `FRONTEND_URL` | Backend | URL of the deployed Frontend, to allow CORS + cross-origin cookie |
| `NODE_ENV` | Backend | `production` once deployed (enables Secure + SameSite=None on the cookie) |
| `VITE_API_URL` | Frontend | URL of the deployed Backend |

## Tests

The test simulates the whole journey: registration, proofs, visibility, search, missions, HR review, deletion.

```bash
cd Backend
MONGODB_URI=mongodb://127.0.0.1:27017/talents-test npm test
```

⚠️ The given database is **wiped** at the start of the test: never use the production database.

## Structure

```
Backend/
  server/app.js         Express routes + CORS
  server/origin.js      list of allowed origins (local + FRONTEND_URL)
  server/models.js      Mongoose models (User with their skills, Mission)
  server/auth.js        sessions (httpOnly cookie + JWT) and role checks
  server/serialize.js   what each role is allowed to see
  server/constants.js   domains, levels, availability, limits
  server/dev.js         local server
  test/api.test.js      end-to-end test
  package.json          Backend dependencies and scripts

Frontend/
  index.html
  src/
    main.jsx, App.jsx
    api.js               API calls (VITE_API_URL)
    components.jsx, pages/
  package.json           Frontend dependencies and scripts
```

## Known limitations and next steps

- **Proof files: 4 MB maximum** per request.
- **No "forgot password"**: would need an email-sending service (Resend, Brevo…). In the meantime, the admin RH can delete an account so it can be recreated.
- **No login attempt rate limiting**: should be added before a wider rollout (e.g. with Upstash Rate Limit).
- **No email notification** for new missions: they show up in the Missions tab.
- Search is designed for a few thousand profiles. Beyond that, a MongoDB text index will be needed.

## Before putting in real data

This application handles employees' personal data. Before opening it up to colleagues, get the project approved by HR, the DPO (GDPR) and IT, and inform the works council. The company's designated hosting may also be required. Until then, test with fictional accounts.
