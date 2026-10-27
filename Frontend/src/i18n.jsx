import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

const STORAGE_KEY = "ht_lang";

// Flat key → { en, fr }. Keys are grouped by page as a naming convention only.
const STRINGS = {
  "app.loading": { en: "Loading…", fr: "Chargement…" },
  "app.logout": { en: "Log out", fr: "Se déconnecter" },
  "app.tab.profile": { en: "My profile", fr: "Mon profil" },
  "app.tab.talents": { en: "Find a talent", fr: "Trouver un talent" },
  "app.tab.missions": { en: "Missions", fr: "Missions" },
  "app.tab.stats": { en: "Overview", fr: "Vue d'ensemble" },
  "app.tab.rh": { en: "Admin RH area", fr: "Espace admin RH" },

  "auth.tagline": {
    en: "Your skills don't stop at your job title. Let people know what you can do outside your contract: web design, gardening, languages, DIY…",
    fr: "Vos compétences ne s'arrêtent pas à votre poste. Faites savoir ce que vous savez faire en dehors de votre contrat : web design, jardinage, langues, bricolage…",
  },
  "auth.promise1": { en: "Your profile stays hidden until you make it visible.", fr: "Votre profil reste masqué tant que vous ne le rendez pas visible." },
  "auth.promise2": { en: "You can decline any mission proposal.", fr: "Vous pouvez refuser toute proposition de mission." },
  "auth.promise3": { en: "You can delete your account at any time.", fr: "Vous pouvez supprimer votre compte à tout moment." },
  "auth.loginTitle": { en: "Log in", fr: "Se connecter" },
  "auth.loginHint": { en: "Sign in with your company Okta account.", fr: "Connectez-vous avec votre compte Okta d'entreprise." },
  "auth.loginBtn": { en: "Log in with Okta", fr: "Se connecter avec Okta" },
  "auth.error.expired": { en: "Your login session expired, please try again.", fr: "Votre session de connexion a expiré, merci de réessayer." },
  "auth.error.state_mismatch": { en: "Login failed for security reasons, please try again.", fr: "Échec de connexion pour raison de sécurité, merci de réessayer." },
  "auth.error.domain_not_allowed": { en: "This email address isn't allowed to access this app.", fr: "Cette adresse e-mail n'est pas autorisée à accéder à cette application." },
  "auth.error.no_email": { en: "Your Okta account doesn't have an email address, please contact an admin.", fr: "Votre compte Okta n'a pas d'adresse e-mail, contactez un administrateur." },
  "auth.error.default": { en: "Login failed, please try again.", fr: "Échec de connexion, merci de réessayer." },

  "profile.heading": { en: "My talent profile", fr: "Mon profil talents" },
  "profile.lead": {
    en: "Add the skills you have outside your job. A skill with proof (degree, certificate, portfolio) is marked \"Justified\" after review by the admin RH.",
    fr: "Ajoutez les compétences que vous avez en dehors de votre poste. Une compétence avec une preuve (diplôme, certificat, portfolio) est marquée « Justifiée » après vérification par l'admin RH.",
  },
  "profile.saved": { en: "Profile saved.", fr: "Profil enregistré." },
  "profile.nowVisible": { en: "Your profile is visible to the admin RH.", fr: "Votre profil est visible par l'admin RH." },
  "profile.nowHidden": { en: "Your profile is hidden.", fr: "Votre profil est masqué." },
  "profile.skillWithProofAdded": { en: "Skill added. The admin RH will review your proof.", fr: "Compétence ajoutée. L'admin RH va vérifier votre preuve." },
  "profile.skillAdded": { en: "Skill added.", fr: "Compétence ajoutée." },
  "profile.skillRemoved": { en: "Skill removed.", fr: "Compétence retirée." },
  "profile.visibleTitle": { en: "Your profile is visible", fr: "Votre profil est visible" },
  "profile.hiddenTitle": { en: "Your profile is hidden", fr: "Votre profil est masqué" },
  "profile.visibleHint": { en: "The admin RH can find you and propose a mission.", fr: "L'admin RH peut vous trouver et proposer une mission." },
  "profile.hiddenHint": { en: "No one can find you in search for now.", fr: "Personne ne peut vous trouver dans la recherche pour l'instant." },
  "profile.hideBtn": { en: "Hide my profile", fr: "Masquer mon profil" },
  "profile.showBtn": { en: "Make my profile visible", fr: "Rendre mon profil visible" },
  "profile.addSkillHeading": { en: "Add a skill", fr: "Ajouter une compétence" },
  "profile.skillLabel": { en: "Skill", fr: "Compétence" },
  "profile.skillPlaceholder": { en: "e.g. Web design", fr: "ex. Web design" },
  "profile.domainLabel": { en: "Domain", fr: "Domaine" },
  "profile.levelLabel": { en: "Level", fr: "Niveau" },
  "profile.yearsLabel": { en: "Years of experience", fr: "Années d'expérience" },
  "profile.descLabel": { en: "In a few words", fr: "En quelques mots" },
  "profile.descPlaceholder": { en: "e.g. Graphic design degree, websites for local associations", fr: "ex. BTS Design graphique, sites vitrines pour des associations" },
  "profile.proofLabel": { en: "Proof: degree, certificate, attestation", fr: "Preuve : diplôme, certificat, attestation" },
  "profile.proofHint": { en: "PDF or image, 4 MB maximum. Only the admin RH can open this file.", fr: "PDF ou image, 4 Mo maximum. Seul l'admin RH peut ouvrir ce fichier." },
  "profile.portfolioLabel": { en: "Or a link to a portfolio", fr: "Ou lien vers un portfolio" },
  "profile.sending": { en: "Sending…", fr: "Envoi…" },
  "profile.addToProfile": { en: "Add to my profile", fr: "Ajouter à mon profil" },
  "profile.infoHeading": { en: "My information", fr: "Mes informations" },
  "profile.nameLabel": { en: "First and last name", fr: "Prénom et nom" },
  "profile.jobLabel": { en: "Current job title", fr: "Poste actuel" },
  "profile.sectorLabel": { en: "Sector", fr: "Secteur" },
  "profile.availabilityLabel": { en: "Availability for missions", fr: "Disponibilité pour des missions" },
  "profile.save": { en: "Save", fr: "Enregistrer" },
  "profile.whatAdminSees": { en: "What the admin RH sees", fr: "Ce que voit l'admin RH" },
  "profile.addFirstSkillHint": { en: "Add your first skill using the form.", fr: "Ajoutez votre première compétence avec le formulaire." },
  "profile.remove": { en: "Remove", fr: "Retirer" },
  "profile.removeAria": { en: "Remove {name}", fr: "Retirer {name}" },
  "profile.deleteHeading": { en: "Delete my account", fr: "Supprimer mon compte" },
  "profile.deleteHint": { en: "Your profile, skills, files and mission proposals are permanently erased.", fr: "Votre profil, vos compétences, vos fichiers et vos propositions de mission sont effacés définitivement." },
  "profile.deleteBtn": { en: "Delete my account", fr: "Supprimer mon compte" },
  "profile.deleteModalTitle": { en: "Delete your account?", fr: "Supprimer votre compte ?" },
  "profile.deleteModalBody": { en: "All your data will be erased. This action is permanent.", fr: "Toutes vos données seront effacées. Cette action est définitive." },
  "profile.cancel": { en: "Cancel", fr: "Annuler" },
  "profile.deleteConfirm": { en: "Yes, delete everything", fr: "Oui, tout supprimer" },

  "talents.heading": { en: "Find a talent", fr: "Trouver un talent" },
  "talents.lead": { en: "Only cast members who chose to make their profile visible appear here.", fr: "Seuls les cast members qui ont choisi de rendre leur profil visible apparaissent ici." },
  "talents.searchAria": { en: "Search a skill", fr: "Rechercher une compétence" },
  "talents.searchPlaceholder": { en: "Search: web design, gardening, sign language…", fr: "Rechercher : web design, jardinage, langue des signes…" },
  "talents.domainAria": { en: "Domain", fr: "Domaine" },
  "talents.allDomains": { en: "All domains", fr: "Tous les domaines" },
  "talents.proofAria": { en: "Proof", fr: "Preuve" },
  "talents.allSkills": { en: "All skills", fr: "Toutes les compétences" },
  "talents.justifiedOnly": { en: "Justified only", fr: "Justifiées seulement" },
  "talents.availabilityAria": { en: "Availability", fr: "Disponibilité" },
  "talents.anyAvailability": { en: "Any availability", fr: "Toute disponibilité" },
  "talents.searching": { en: "Searching…", fr: "Recherche…" },
  "talents.noMatch": { en: "No profile matches. Try another keyword or remove a filter.", fr: "Aucun profil ne correspond. Essayez un autre mot-clé ou retirez un filtre." },
  "talents.proposeMission": { en: "Propose a mission", fr: "Proposer une mission" },
  "talents.proposalSent": { en: "Proposal sent to {name}.", fr: "Proposition envoyée à {name}." },
  "talents.missionFormTitle": { en: "Propose a mission to {name}", fr: "Proposer une mission à {name}" },
  "talents.missionFormHint": { en: "The person sees your proposal in their Missions tab and remains free to accept or decline.", fr: "La personne voit votre proposition dans son onglet Missions et reste libre d'accepter ou de refuser." },
  "talents.missionTitleLabel": { en: "Mission title", fr: "Intitulé de la mission" },
  "talents.missionTitlePlaceholder": { en: "e.g. Redesign the restaurant's signage", fr: "ex. Refonte de l'affichage du restaurant" },
  "talents.messageLabel": { en: "Message", fr: "Message" },
  "talents.sendProposal": { en: "Send proposal", fr: "Envoyer la proposition" },
  "talents.defaultMessage": {
    en: "Hi {first},\n\nYour Hidden Talents profile caught our attention for a project. Would you be up for discussing it?",
    fr: "Bonjour {first},\n\nVotre profil Talents Cachés a retenu notre attention pour un projet. Seriez-vous partant(e) pour en discuter ?",
  },

  "missions.heading": { en: "Missions", fr: "Missions" },
  "missions.lead": { en: "Proposals received thanks to your profile, and the ones you've sent. You can decline a proposal without justifying yourself.", fr: "Les propositions reçues grâce à votre profil, et celles que vous avez envoyées. Vous pouvez refuser une proposition sans vous justifier." },
  "missions.loading": { en: "Loading…", fr: "Chargement…" },
  "missions.received": { en: "Received", fr: "Reçues" },
  "missions.noneReceived": { en: "No proposal yet. Make your profile visible to be found.", fr: "Aucune proposition pour l'instant. Rendez votre profil visible pour être trouvé." },
  "missions.from": { en: "From {name}{job} · {date}", fr: "De {name}{job} · {date}" },
  "missions.former": { en: "a former account", fr: "un ancien compte" },
  "missions.decline": { en: "Decline", fr: "Refuser" },
  "missions.accept": { en: "Accept", fr: "Accepter" },
  "missions.accepted": { en: "Mission accepted. The requester will get back to you.", fr: "Mission acceptée. Le demandeur va vous recontacter." },
  "missions.declined": { en: "Proposal declined.", fr: "Proposition refusée." },
  "missions.sent": { en: "Sent", fr: "Envoyées" },
  "missions.to": { en: "To {name} · {date}", fr: "À {name} · {date}" },

  "stats.heading": { en: "Overview", fr: "Vue d'ensemble" },
  "stats.lead": { en: "The talents available across the company, based on profiles made visible.", fr: "Les talents disponibles dans l'entreprise, à partir des profils rendus visibles." },
  "stats.accounts": { en: "Accounts created", fr: "Comptes créés" },
  "stats.visibleProfiles": { en: "Visible profiles", fr: "Profils visibles" },
  "stats.skills": { en: "Skills", fr: "Compétences" },
  "stats.skillsSub": { en: "of which {n} justified", fr: "dont {n} justifiées" },
  "stats.acceptedMissions": { en: "Accepted missions", fr: "Missions acceptées" },
  "stats.acceptedSub": { en: "out of {n} proposed", fr: "sur {n} proposées" },
  "stats.byDomain": { en: "Skills by domain", fr: "Compétences par domaine" },
  "stats.noSkills": { en: "No visible skills for now.", fr: "Aucune compétence visible pour l'instant." },
  "stats.justifiedCount": { en: "({n} justified)", fr: "({n} justifiées)" },
  "stats.legendJustified": { en: "Justified", fr: "Justifiées" },
  "stats.legendDeclared": { en: "Declared", fr: "Déclarées" },

  "rh.heading": { en: "Admin RH area", fr: "Espace admin RH" },
  "rh.lead": { en: "Review proofs sent by cast members and grant the admin RH role.", fr: "Vérifiez les preuves envoyées par les cast members et attribuez le rôle admin RH." },
  "rh.pendingHeading": { en: "Proofs to review", fr: "Preuves à vérifier" },
  "rh.noPending": { en: "No proof pending.", fr: "Aucune preuve en attente." },
  "rh.noteAria": { en: "Note for {name}", fr: "Motif pour {name}" },
  "rh.notePlaceholder": { en: "Note in case of rejection (optional)", fr: "Motif en cas de refus (facultatif)" },
  "rh.reject": { en: "Reject", fr: "Refuser" },
  "rh.approve": { en: "Approve", fr: "Valider" },
  "rh.skillJustified": { en: "Skill justified.", fr: "Compétence justifiée." },
  "rh.proofRejected": { en: "Proof rejected.", fr: "Preuve refusée." },
  "rh.rolesHeading": { en: "User roles", fr: "Rôles des utilisateurs" },
  "rh.searchUserAria": { en: "Search a user", fr: "Rechercher un utilisateur" },
  "rh.searchUserPlaceholder": { en: "Search by name or email", fr: "Rechercher par nom ou e-mail" },
  "rh.colName": { en: "Name", fr: "Nom" },
  "rh.colEmail": { en: "Email", fr: "E-mail" },
  "rh.colJob": { en: "Job title", fr: "Poste" },
  "rh.colRole": { en: "Role", fr: "Rôle" },
  "rh.roleOfAria": { en: "Role of {name}", fr: "Rôle de {name}" },
  "rh.roleUpdated": { en: "Role updated.", fr: "Rôle mis à jour." },

  "components.year": { en: "year", fr: "an" },
  "components.years": { en: "years", fr: "ans" },
  "components.portfolio": { en: "Portfolio", fr: "Portfolio" },
  "components.attachedProof": { en: "Attached proof", fr: "Preuve jointe" },
  "components.hrNote": { en: "HR note: {note}", fr: "Motif RH : {note}" },
  "components.noJobTitle": { en: "No job title given", fr: "Poste non renseigné" },
  "components.noSkillsYet": { en: "No skills added yet.", fr: "Aucune compétence ajoutée pour l'instant." },
};

const DOMAIN_LABELS = {
  "Digital & web": { en: "Digital & web", fr: "Numérique & web" },
  "Creative & arts": { en: "Creative & arts", fr: "Création & arts" },
  "Languages": { en: "Languages", fr: "Langues" },
  "Nature & gardening": { en: "Nature & gardening", fr: "Nature & jardinage" },
  "Technical & DIY": { en: "Technical & DIY", fr: "Technique & bricolage" },
  "Teaching & training": { en: "Teaching & training", fr: "Enseignement & formation" },
  "Health & wellness": { en: "Health & wellness", fr: "Santé & bien-être" },
  "Business & finance": { en: "Business & finance", fr: "Gestion & finance" },
  "Other": { en: "Other", fr: "Autre" },
};

const LEVEL_LABELS = {
  "Beginner": { en: "Beginner", fr: "Débutant" },
  "Intermediate": { en: "Intermediate", fr: "Intermédiaire" },
  "Advanced": { en: "Advanced", fr: "Confirmé" },
  "Expert": { en: "Expert", fr: "Expert" },
};

const AVAILABILITY_LABELS = {
  "One-off missions": { en: "One-off missions", fr: "Missions ponctuelles" },
  "A few hours / month": { en: "A few hours / month", fr: "Quelques heures / mois" },
  "Long-term project": { en: "Long-term project", fr: "Projet long" },
  "Not available": { en: "Not available", fr: "Pas disponible" },
};

const ROLE_LABELS = {
  cast_member: { en: "Cast member", fr: "Cast member" },
  admin_rh: { en: "Admin RH", fr: "Admin RH" },
};

const SKILL_STATUS_LABELS = {
  declarative: { en: "Declarative", fr: "Déclarative" },
  pending: { en: "Under review", fr: "En vérification" },
  justified: { en: "Justified", fr: "Justifiée" },
  rejected: { en: "Proof rejected", fr: "Preuve refusée" },
};

const MISSION_STATUS_LABELS = {
  pending: { en: "Pending", fr: "En attente" },
  accepted: { en: "Accepted", fr: "Acceptée" },
  declined: { en: "Declined", fr: "Refusée" },
};

// Canonical values (stored in the DB, sent to the API) stay in English; this only
// swaps the label shown to the user.
export const VALUE_LABELS = {
  domain: DOMAIN_LABELS,
  level: LEVEL_LABELS,
  availability: AVAILABILITY_LABELS,
  role: ROLE_LABELS,
  skillStatus: SKILL_STATUS_LABELS,
  missionStatus: MISSION_STATUS_LABELS,
};

const LangContext = createContext(null);

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr") return saved;
    } catch { /* localStorage unavailable */ }
    return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* localStorage unavailable */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const t = useCallback((key, vars) => {
    let str = STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, v);
    return str;
  }, [lang]);

  // category: one of the VALUE_LABELS keys above; value: the canonical English value.
  const label = useCallback((category, value) => VALUE_LABELS[category]?.[value]?.[lang] ?? value, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, label }), [lang, setLang, t, label]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);
