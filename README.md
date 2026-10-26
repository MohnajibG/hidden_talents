# Talents Cachés

Plateforme interne où les cast members déclarent les compétences qu'ils ont en dehors de leur contrat (diplômes, portfolio, expérience), et où les managers, la direction et les RH peuvent les trouver pour des missions.

**Stack** : React (Vite) · Node.js (Express) · MongoDB (Mongoose, preuves stockées dans GridFS). Tout est en JavaScript.

**Organisation** : `Frontend/` et `Backend/` sont deux applications indépendantes (chacune son `package.json`), pensées pour être déployées séparément — par exemple le Frontend sur Vercel/Netlify et le Backend sur Render/Railway/Fly.io.

## Rôles

| Rôle | Peut faire |
| --- | --- |
| Cast member | Créer son profil, ajouter compétences et preuves, se rendre visible ou non, accepter ou refuser une mission, supprimer son compte |
| Manager | Tout ce qui précède, plus chercher des talents et proposer des missions |
| Direction | Tout ce que fait le manager, plus la vue d'ensemble (statistiques) |
| RH | Tout, plus vérifier les preuves, ouvrir les fichiers et attribuer les rôles |

Règles appliquées par l'API (testées dans `Backend/test/api.test.js`) :

- Un profil est **masqué par défaut**. Seul le salarié peut le rendre visible.
- Managers et direction ne voient **ni l'e-mail ni les fichiers de preuve**, seulement le statut (« Justifiée », « En vérification », « Déclarative »).
- Un refus de preuve par les RH n'est montré qu'au salarié et aux RH.
- Seul le destinataire d'une mission peut y répondre.
- Supprimer son compte efface le profil, les fichiers et les missions liées.

## 1. Créer la base MongoDB (gratuit)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) puis un cluster **M0 (gratuit)**, région **Europe** (Paris ou Francfort).
2. *Database Access* : créez un utilisateur avec un mot de passe.
3. *Network Access* : ajoutez `0.0.0.0/0` (le Backend n'a pas forcément d'adresse IP fixe selon l'hébergeur).
4. *Connect › Drivers* : copiez la chaîne de connexion et ajoutez le nom de la base avant le `?` :
   `mongodb+srv://utilisateur:motdepasse@cluster0.xxxxx.mongodb.net/talents-caches?retryWrites=true&w=majority`

## 2. Lancer en local

Prérequis : Node.js 20 ou plus. Deux terminaux, un par app.

```bash
# Terminal 1 — Backend (API sur :3000)
cd Backend
npm install
cp .env.example .env      # remplissez MONGODB_URI, JWT_SECRET et RH_EMAILS (PORT=3000 par défaut)
npm run dev
```

```bash
# Terminal 2 — Frontend (site sur http://localhost:5173)
cd Frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000 par défaut, pas besoin d'y toucher en local
npm run dev
```

Inscrivez-vous avec une adresse listée dans `RH_EMAILS` : ce compte reçoit le rôle RH. Depuis l'**Espace RH**, attribuez ensuite les rôles manager et direction.

## 3. Déployer

Les deux apps se déploient **indépendamment**, chacune avec son propre `package.json` :

**Backend** (ex. Render, Railway, Fly.io) :
- Build : `npm install` · Démarrage : `npm start`
- Variables d'environnement : `MONGODB_URI`, `JWT_SECRET`, `RH_EMAILS`, `ALLOWED_EMAIL_DOMAIN` (facultatif), `FRONTEND_URL` (l'URL exacte du Frontend déployé, pour CORS + cookie), `NODE_ENV=production`.

**Frontend** (ex. Vercel, Netlify) :
- Dossier racine du projet : `Frontend`
- Build : `npm install && npm run build` · Dossier de sortie : `dist`
- Variable d'environnement : `VITE_API_URL` = l'URL du Backend déployé.

⚠️ Déployez le Backend d'abord pour connaître son URL, à renseigner dans `VITE_API_URL` côté Frontend et dans `FRONTEND_URL` côté Backend.

## Variables d'environnement

| Variable | Où | Rôle |
| --- | --- | --- |
| `MONGODB_URI` | Backend | Chaîne de connexion MongoDB |
| `JWT_SECRET` | Backend | Secret de signature des sessions, 32 caractères minimum |
| `RH_EMAILS` | Backend | Adresses qui deviennent RH à l'inscription, séparées par des virgules |
| `ALLOWED_EMAIL_DOMAIN` | Backend | Facultatif : n'accepte que les adresses de ce domaine (ex. `entreprise.com`) |
| `FRONTEND_URL` | Backend | URL du Frontend déployé, pour autoriser CORS + cookie cross-origin |
| `NODE_ENV` | Backend | `production` une fois déployé (active Secure + SameSite=None sur le cookie) |
| `VITE_API_URL` | Frontend | URL du Backend déployé |

## Tests

Le test simule tout le parcours : inscription, preuves, visibilité, recherche, missions, vérification RH, suppression.

```bash
cd Backend
MONGODB_URI=mongodb://127.0.0.1:27017/talents-test npm test
```

⚠️ La base indiquée est **vidée** au début du test : n'utilisez jamais la base de production.

## Structure

```
Backend/
  server/app.js         routes Express + CORS
  server/origin.js       liste des origines autorisées (local + FRONTEND_URL)
  server/models.js       modèles Mongoose (User avec ses compétences, Mission)
  server/auth.js         sessions (cookie httpOnly + JWT) et contrôle des rôles
  server/serialize.js    ce que chaque rôle a le droit de voir
  server/constants.js    domaines, niveaux, disponibilités, limites
  server/dev.js          serveur local
  test/api.test.js       test de bout en bout
  package.json           dépendances et scripts du Backend

Frontend/
  index.html
  src/
    main.jsx, App.jsx
    api.js                appels à l'API (VITE_API_URL)
    components.jsx, pages/
  package.json            dépendances et scripts du Frontend
```

## Limites connues et prochaines étapes

- **Fichiers de preuve : 4 Mo maximum** par requête.
- **Pas de « mot de passe oublié »** : il faut un service d'envoi d'e-mails (Resend, Brevo…). En attendant, les RH peuvent supprimer un compte pour qu'il soit recréé.
- **Pas de limite de tentatives de connexion** : à ajouter avant une ouverture large (par exemple avec Upstash Rate Limit).
- **Pas de notification par e-mail** pour les nouvelles missions : elles apparaissent dans l'onglet Missions.
- La recherche est pensée pour quelques milliers de profils. Au-delà, il faudra un index texte MongoDB.

## Avant d'y mettre de vraies données

Cette application traite des données personnelles de salariés. Avant de l'ouvrir à des collègues, faites valider le projet par les RH, le DPO (RGPD) et la DSI, et informez le CSE. L'hébergement prévu par l'entreprise peut aussi être imposé. D'ici là, testez avec des comptes fictifs.
