# S'STACK : semer au bon moment grâce aux données NASA

Projet de l'équipe **S'STACK** (INPTIC, Libreville) pour le **NASA Space Apps Challenge 2026**, défi **« Field Shift »**.

S'STACK est un **agent conseiller** pour les producteurs gabonais de **manioc** et de **banane plantain**. Il leur dit **quand semer**, à partir des données satellites **NASA POWER** (pluie, température, humidité du sol) et **SoilGrids** (texture du sol). On l'utilise de deux façons :

- **le site web** : tableau de bord, carte, données, cultures et assistant Mbolo ;
- **le bot Telegram** [@sstack_agri_bot](https://t.me/sstack_agri_bot), par écrit ou par **message vocal**.

Zone pilote : **Tchibanga (Nyanga)**, plus 7 autres villes du Gabon.

> **Règle d'or : « le code calcule, le modèle explique ».** Les chiffres et le verdict (favorable, risquée ou défavorable) sont calculés par notre code TypeScript. Le modèle de langage (LLM) ne fait que les expliquer en français simple. On n'entraîne aucun modèle.

---

## Sommaire

1. [Démarrer en 5 minutes](#1-démarrer-en-5-minutes)
2. [Organisation du dépôt](#2-organisation-du-dépôt)
3. [Comment marche l'agent](#3-comment-marche-lagent)
4. [L'API du serveur](#4-lapi-du-serveur)
5. [Le site web](#5-le-site-web)
6. [Le bot Telegram](#6-le-bot-telegram)
7. [Base de données Supabase](#7-base-de-données-supabase)
8. [Scripts utiles](#8-scripts-utiles)
9. [Règles de l'équipe](#9-règles-de-léquipe)
10. [Travailler avec Claude Code](#10-travailler-avec-claude-code)
11. [Problèmes connus et solutions](#11-problèmes-connus-et-solutions)
12. [État du projet](#12-état-du-projet)

---

## 1. Démarrer en 5 minutes

**Il faut :** Node.js 20 ou plus récent (testé avec 24), npm, Git.

```bash
git clone https://github.com/orodneyfrederic-creator/Space_app.git
cd Space_app
```

### Étape 1 : les clés (une seule fois)

```bash
cp .env.example server/.env          # puis remplir server/.env
cp web/.env.example web/.env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001
```

Les **vraies valeurs** des clés (Groq, Gemini, Supabase, Telegram) sont envoyées **en message privé** par le chef d'équipe. Elles ne passent jamais par GitHub, un groupe ou un document partagé.

| Variable (`server/.env`) | Rôle |
|---|---|
| `GROQ_API_KEY`, `GROQ_MODEL` | LLM principal (Groq, modèle `openai/gpt-oss-120b`) |
| `GROQ_REASONING_EFFORT` | `low` par défaut : économise le quota gratuit |
| `GROQ_STT_MODEL` | Transcription des messages vocaux (`whisper-large-v3`) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | LLM de secours si Groq sature (`gemini-3.1-flash-lite`) |
| `GEMINI_TTS_MODEL`, `GEMINI_TTS_VOIX` | Facultatifs : voix des notes vocales du bot (`gemini-3.8-flash-lite-tts`, voix `Charon` par défaut) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Base de données (historique des conseils) |
| `TELEGRAM_BOT_TOKEN` | Bot Telegram ; sans lui, le serveur démarre quand même |
| `JWT_SECRET` | Signe les jetons de connexion (au moins 32 caractères, **chacun génère le sien**) : `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `PORT`, `FRONTEND_URL` | `3001` et `http://localhost:3000` |

### Étape 2 : lancer (deux terminaux)

```bash
# Terminal 1 : le serveur (API + bot Telegram)
cd server
npm install
npm run dev            # → http://localhost:3001  (test : http://localhost:3001/api/sante)

# Terminal 2 : le site
cd web
npm install
npm run dev            # → http://localhost:3000
```

| Adresse | Ce que vous voyez |
|---|---|
| http://localhost:3000 | Landing (présentation) |
| http://localhost:3000/tableau-de-bord | Espace agriculteur (la visite guidée se lance à la première visite) |
| http://localhost:3001/api/sante | `{"ok":true}` : le serveur fonctionne |

---

## 2. Organisation du dépôt

```
Space_app/
├── server/            Serveur Node + TypeScript (Hono) : API, agent, bot Telegram
│   └── src/
│       ├── index.ts           démarrage : CORS, routes /api, bot Telegram
│       ├── types/api.ts       ⭐ CONTRAT D'API : les types partagés avec le front
│       ├── gateways/
│       │   ├── api.ts         les routes HTTP (/api/...)
│       │   ├── auth.ts        comptes : inscription, connexion, jeton, middleware exigerCompte
│       │   ├── llm.ts         accès aux LLM : Groq, puis Gemini en secours
│       │   ├── voice.ts       transcription vocale (Whisper de Groq)
│       │   └── guardrails.ts  garde-fous : entrées (zod), limite d'appels, filtre de sortie
│       ├── context/           ⭐ LE CALCUL (testé, ne pas réécrire sans en parler)
│       │   ├── nasa-power.ts  appels NASA POWER (cache 6 h, une nouvelle tentative)
│       │   ├── indicateurs.ts pluie, jours secs, démarrage de saison, verdict
│       │   ├── fiche-parcelle.ts  la « fiche » chiffrée d'un lieu
│       │   ├── sols.ts        sol le plus proche (SoilGrids pré-téléchargé)
│       │   ├── sites.ts       les 8 villes suivies
│       │   ├── knowledge.ts   lecture des fichiers knowledge/
│       │   └── construire-contexte.ts  assemblage du message envoyé au LLM
│       ├── agents/climat.ts   l'agent climat : contexte → LLM → filtre
│       ├── bot/telegram.ts    le bot Telegram (grammY)
│       ├── auth/              empreinte des mots de passe (scrypt), numéros gabonais
│       ├── db/supabase.ts     enregistrement et lecture des conseils
│       ├── db/utilisateurs.ts comptes des producteurs
│       └── scripts/           outils en ligne de commande (voir section 8)
├── web/               Site Next.js 16 + Tailwind 4 (guide détaillé : web/FRONTEND.md)
├── knowledge/         Ce que l'agent « sait » (en Markdown, modifiable sans coder)
│   ├── skills/climat/SKILL.md   rôle, règles et format des réponses de l'agent
│   ├── fiches/                  calendrier des cultures, rotations, seuils, sols du Gabon
│   ├── data/soilgrids-sites.json  valeurs de sol des 8 sites
│   └── tests/questions-test.md  les 11 questions de test
├── supabase/migrations/   001 : table des conseils ; 002 : comptes des producteurs
├── docs/              Brief, ressources, prompt de liaison front/back, résultats de tests
└── screenshot/        Captures de toutes les pages (ordinateur et téléphone)
```

Les fichiers `server/src/agents/rotation.ts`, `sols.ts`, `supervisor.ts` et `gateways/data.ts`, `tools.ts`, `notifications.ts` sont **vides**. Ce sont des emplacements prévus pour la suite (voir section 12).

---

## 3. Comment marche l'agent

```
Question (web ou Telegram, texte ou voix)
   │  voix → transcription Whisper (Groq)
   ▼
Compte obligatoire (jeton sur le web, compte relié sur Telegram)
   ▼
Garde-fous d'entrée : position au Gabon, question de 1 à 1000 caractères, 10 questions par minute et par IP
   ▼
Fiche parcelle calculée par le code : NASA POWER + SoilGrids → pluie 7/30 j, écart à la normale,
humidité du sol, jours secs, démarrage de la saison des pluies, VERDICT
   ▼
Contexte en 4 couches : SKILL.md + fiches de connaissances + fiche parcelle + question (entre balises)
   ▼
LLM : Groq (gpt-oss-120b) ; en cas de quota (429), de délai dépassé ou de réponse vide → Gemini Flash-Lite
   ▼
Garde-fou de sortie : texte simple, aucune dose de produit, aucune promesse de rendement, 5 phrases au maximum
   ▼
Réponse + fiche, enregistrées dans Supabase
```

**Le verdict de semis** (calculé dans `context/indicateurs.ts`) :
- **défavorable** si la saison des pluies n'a pas démarré ou si le sol est sec ;
- **risquée** si une période de 7 jours secs d'affilée vient d'avoir lieu, ou s'il y a trop de jours secs sur 14 jours ;
- **favorable** si la saison a démarré, que le sol est assez humide et que les pluies sont régulières.

La **saison des pluies démarre**, à partir du 1er septembre, au premier jour où il tombe au moins 20 mm en 3 jours, sans 7 jours secs d'affilée dans les 20 jours qui suivent.

**Pour changer le comportement de l'agent**, on modifie d'abord `knowledge/` (aucun code à toucher), puis on vérifie avec `npx tsx src/scripts/tester-agent.ts` (voir section 8).

> **Piège connu :** l'API de Gemini (compatible OpenAI) **ne garde que le dernier message système**. Tout le contexte doit donc tenir dans **un seul** message système (c'est ce que fait `construire-contexte.ts`).

---

## 4. L'API du serveur

Base : `http://localhost:3001/api`. Les types sont dans **`server/src/types/api.ts`**, copiés **à l'identique** dans `web/src/lib/types.ts`. Les erreurs ont toujours la forme `{ "erreur": "message lisible" }`.

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/sante` | `{ ok: true, version }` |
| GET | `/sites` | les 8 villes suivies |
| GET | `/apercu` | verdict + pluie 30 j de chaque ville (une ville en erreur renvoie `verdict: null`) |
| GET | `/fiche/:siteId` | fiche complète d'une ville + série de pluie sur 30 jours |
| GET | `/fiche?lat=&lon=&nom=` | fiche d'une position quelconque au Gabon |
| POST | `/auth/inscription` | `{ nom, telephone, motDePasse, siteId? }` → `{ jeton, utilisateur }` (201) |
| POST | `/auth/connexion` | `{ telephone, motDePasse }` → `{ jeton, utilisateur }` |
| GET | `/auth/moi` 🔒 | profil du producteur connecté |
| POST | `/conseil` 🔒 | `{ lat, lon, question, nomLieu?, culture?, canal? }` → réponse de l'agent |
| POST | `/voix` 🔒 | formulaire avec un fichier audio (10 Mo au maximum) + lat/lon → transcription + réponse |
| GET | `/conseils?limit=20` 🔒 | conseils **du producteur connecté** (1 à 50), du plus récent au plus ancien |

🔒 = compte obligatoire : en-tête `Authorization: Bearer <jeton>`. Sans jeton ou avec un jeton expiré : erreur 401.

Identifiants des villes : `tchibanga`, `mouila`, `lambarene`, `libreville`, `oyem`, `makokou`, `koulamoutou`, `franceville`.

### Comptes des producteurs (téléphone + mot de passe, sans SMS)

- **Il faut un compte pour utiliser l'agent** (web et Telegram). Les données NASA (`/sites`, `/apercu`, `/fiche`) restent libres.
- **Numéro** : deux écritures seulement, `077 12 34 56` ou `+241 77 12 34 56` (espaces facultatifs, `+241 077…` toléré). Tout le reste (tirets, points, chiffres manquants, `00241…`) est refusé avec « Ce numéro est mal écrit. Écrivez-le comme ceci : 077 12 34 56 ou +241 77 12 34 56. » Le serveur range le numéro sous une seule forme : `+241077123456`. Conseil pour le formulaire : `type="tel"`, `inputMode="tel"`, `placeholder="077 12 34 56"`.
- **Mot de passe** : 8 à 72 caractères, gardé sous forme d'empreinte scrypt (jamais en clair).
- **Jeton** valable 30 jours. Au-delà, l'API répond 401 et il faut se reconnecter.
- **Sécurité** : 10 essais de connexion ou d'inscription par quart d'heure et par adresse ; le message d'erreur ne dit pas si le numéro existe.
- **Erreurs à afficher telles quelles** (champ `erreur`) : 400 champ invalide, 401 identifiants incorrects, 409 numéro déjà inscrit, 429 trop d'essais, 503 base indisponible.

**Côté site** : les formulaires `/inscription` et `/connexion` sont branchés. Après l'inscription, la page `/bienvenue` présente le bot Telegram. L'espace agriculteur est protégé par `components/auth/GardeSession.tsx` (renvoi vers `/connexion?suite=…`). « Se déconnecter » est en bas du menu. Les fonctions utiles sont dans `web/src/lib/` :

```ts
import { connecter, inscrire, getMoi, deconnecter } from '@/lib/api'
import { utilisateurConnecte, EVENEMENT_SESSION } from '@/lib/session'

await inscrire({ nom, telephone, motDePasse, siteId })   // enregistre la session
await connecter({ telephone, motDePasse })                 // idem
// Ensuite, demanderConseil, envoyerVocal et listerConseils envoient le jeton tout seuls.
// Une erreur ErreurApi porte .message (prêt à afficher) et .statut (401, 409…).
// Si le serveur répond 401, la session est effacée : renvoyer vers /connexion.
```

**Faire connaître le bot Telegram** : le nom et le lien sont dans `web/src/lib/telegram.ts` (`@sstack_agri_bot`, `https://t.me/sstack_agri_bot`). Le bot est présenté sur `/bienvenue`, dans la carte Telegram du tableau de bord (`components/telegram/CarteTelegram.tsx` : 3 étapes, puis « Telegram relié » une fois le compte relié), dans la visite guidée, dans la réponse de Mbolo et sur la landing (appel à l'action et pied de page).

**CORS :** le serveur accepte `FRONTEND_URL`, ainsi que `localhost`, `127.0.0.1` et les adresses du réseau local (192.168.x.x, 10.x.x.x), quel que soit le port.

---

## 5. Le site web

Le guide complet est dans **[web/FRONTEND.md](web/FRONTEND.md)** (pages, composants, responsive). L'essentiel :

- **Next.js 16** : certaines habitudes des anciennes versions ne marchent plus. `params` est une promesse (`await params`), et `usePathname()` / `useSearchParams()` doivent être sous `<Suspense>`. En cas de doute, lire `web/node_modules/next/dist/docs/`.
- **Pages** : la landing est à `/` ; l'espace agriculteur est dans `app/(app)/` (tableau de bord, carte, données, cultures, discuter, historique) ; connexion et inscription ont leurs pages.
- **Mbolo** : l'agent flottant, présent sur toutes les pages (`components/agent/`).
- **Aide pour les producteurs** (`components/aide/`) :
  - une **visite guidée** du tableau de bord (8 étapes, français facile), lancée à la première visite et relançable avec « Comment ça marche ? » ou « Visite guidée » dans le menu ;
  - des **infobulles « i »** sur les mots difficiles, dont les textes sont dans `web/src/lib/explications.ts` ;
  - la description de chaque page du menu au survol.
  - Pour ajouter une étape de visite : mettre `data-visite="ma-cle"` sur l'élément, puis ajouter l'étape dans `ETAPES` (`VisiteGuidee.tsx`).
- **Charte S'STACK** : polices Outfit et JetBrains Mono (chiffres) ; couleurs Vert Forêt `#0B5D3B`, Vert Gabon `#009E60`, Bleu Océan `#3A75C4`, Terre Latérite `#B4532A`, Jaune Soleil `#FCD116` (**jamais en texte sur fond clair**), Noir Ébène `#111A14`, Pierre de Mbigou `#E9E2CF`. Les tokens sont dans `web/src/app/globals.css`.
- **Carte** : MapLibre avec les tuiles OpenStreetMap. Le worker est copié dans `public/maplibre/` par `npm run dev` et `npm run build`.

---

## 6. Le bot Telegram

Le bot démarre avec le serveur (`npm run dev` dans `server/`) si `TELEGRAM_BOT_TOKEN` est rempli. Il fonctionne en *long polling* : aucune URL publique n'est nécessaire en local.

1. **Relier son compte** (une seule fois) : le producteur crée son compte sur le site, puis touche « 📱 Partager mon numéro » dans le bot. Le bot retrouve le compte qui a ce numéro et le relie à Telegram. Sans compte relié, le bot n'accepte aucune question.
2. `/start` affiche des boutons : « Partager ma position » ou le choix d'une des 8 villes.
3. On pose sa question **par écrit** (réponse écrite) ou **par message vocal** (réponse en note vocale seulement, voix Gemini convertie en OGG/Opus avec ffmpeg-static : `server/src/gateways/synthese.ts` ; si la voix échoue, la réponse arrive par écrit).
4. **Le lieu n'est pas redemandé** : le bot prend la ville citée dans la question (« … à Libreville »), sinon la position ou la ville choisie dans la conversation, sinon la ville du compte. Toucher une ville la garde comme ville par défaut du compte.

⚠️ **Un seul serveur à la fois** doit tourner avec le même jeton Telegram. Sinon, Telegram renvoie une erreur 409 et un des deux bots s'arrête.

---

## 7. Base de données Supabase

- `public.conseils` : date, canal (web ou telegram), producteur (`utilisateur_id`), lieu, question, réponse, fournisseur et modèle du LLM, fiche en JSON.
- `public.utilisateurs` : nom, numéro (unique), ville, empreinte du mot de passe, identifiant Telegram relié.
- **Migrations** : chaque changement de tables est un fichier numéroté dans `supabase/migrations/`, à exécuter **dans l'ordre** dans le SQL Editor de Supabase (New query → coller → Run). On ne crée pas de table à la main.
  - `001_schema.sql` : table des conseils (exécutée) ;
  - `002_utilisateurs.sql` : comptes des producteurs. Tant qu'elle n'est pas exécutée, l'inscription répond « Les comptes sont momentanément indisponibles ».
- La RLS est activée, sans règle publique : seul le serveur, avec la clé `service_role`, lit et écrit. **Cette clé ne va jamais dans `web/`.**

---

## 8. Scripts utiles

À lancer depuis `server/` :

```bash
# Fiche chiffrée d'une ville (sans LLM)
npx tsx src/scripts/fiche.ts tchibanga

# Poser une question à l'agent ; --contexte affiche aussi tout ce qui est envoyé au LLM
npx tsx src/scripts/demander.ts tchibanga "Est-ce que je peux planter mon manioc cette semaine ?" --contexte

# Les 11 questions de test → docs/resultats-tests-AAAA-MM-JJ.md (cases à cocher pour la relecture)
npx tsx src/scripts/tester-agent.ts
```

À lancer depuis `web/` : `npm run lint` et `npm run build`.

---

## 9. Règles de l'équipe

1. **Secrets** : seulement dans `server/.env` et `web/.env.local` (fichiers ignorés par Git). Dans `web/`, uniquement des variables `NEXT_PUBLIC_*`, jamais de clé secrète. Les clés circulent **en message privé**.
2. **Un seul contrat d'API** : on modifie `server/src/types/api.ts`, puis on recopie le fichier à l'identique dans `web/src/lib/types.ts`.
3. **TypeScript strict**, pas de `any`. Toute donnée qui entre dans le serveur est validée avec **zod**.
4. **Commentaires et interface en français.**
5. **Ne jamais afficher de valeur inventée** : une donnée qui manque s'affiche « indisponible ».
6. **`server/src/context/`, `llm.ts` et `voice.ts` sont testés** : avant de les réécrire, on en parle à l'équipe.
7. **Pas de grosse dépendance** sans accord de l'équipe.
8. **Git** : `git pull` avant de commencer ; un commit clair par sujet ; on ne pousse que du code qui démarre (`npm run dev`) et passe `npm run lint`.

---

## 10. Travailler avec Claude Code

Le dépôt contient un fichier **[CLAUDE.md](CLAUDE.md)** à la racine. Claude Code le lit **automatiquement** à chaque session : il y trouve le projet, les commandes, les règles et les pièges. Il n'y a rien à faire de votre côté.

- **Pour bien démarrer une session :** « Lis le README et CLAUDE.md, puis… ».
- **Si vous découvrez un nouveau piège** (une erreur bizarre et sa solution), ajoutez-le à `CLAUDE.md` et poussez-le : toute l'équipe en profite.
- `web/AGENTS.md` est généré par Next.js (règles pour les agents IA sur Next 16). Ne le supprimez pas.
- Ne collez jamais une clé dans une conversation avec Claude : il la trouve dans `server/.env`.

---

## 11. Problèmes connus et solutions

| Problème | Solution |
|---|---|
| Le site affiche « Le serveur S'STACK ne répond pas » | Vérifier que le serveur tourne (http://localhost:3001/api/sante). Vérifier aussi `NEXT_PUBLIC_API_URL` dans `web/.env.local`. |
| Erreur bizarre après un `git pull` (« module factory is not available », erreur d'hydratation, CSS qui ne se met pas à jour) | Arrêter le site, **supprimer `web/.next`**, relancer `npm run dev`. |
| Ne jamais lancer `npm run build` pendant que `npm run dev` tourne | Ça casse le cache : même solution que ci-dessus. |
| La carte reste grise ou affiche « Worker failed to load » | Relancer `npm run dev` dans `web/` : il recopie le worker MapLibre. |
| Port 3000 ou 3001 déjà utilisé | Un ancien `npm run dev` tourne encore : le fermer (Ctrl+C), ou arrêter le processus `node`. |
| `[LLM] Groq indisponible (quota dépassé (429))` dans le journal | C'est normal quand on enchaîne les questions : Gemini prend le relais automatiquement. |
| `Could not find the table 'public.conseils'` ou `'public.utilisateurs'` | Exécuter les migrations de `supabase/migrations/` dans l'ordre (section 7). |
| L'agent répond « Connectez-vous pour utiliser l'agent » | Normal : il faut un compte. Se connecter (ou créer un compte), puis réessayer. |
| L'inscription répond « comptes momentanément indisponibles » | `JWT_SECRET` absent de `server/.env`, ou migration 002 pas exécutée : voir le journal du serveur. |
| `fetch failed` vers NASA POWER | Le serveur réessaie une fois tout seul. Si ça continue, vérifier la connexion Internet. |
| Bot Telegram : erreur 409 Conflict | Deux serveurs tournent avec le même jeton : en garder un seul. |

---

## 12. État du projet

**Fait**
- Calcul NASA POWER + SoilGrids, verdict de semis, fiche parcelle
- Agent climat (Groq, avec Gemini en secours) et garde-fous d'entrée et de sortie
- API complète, bot Telegram texte et voix, enregistrement Supabase
- Site responsive : landing, tableau de bord, carte, données, cultures, assistant, historique, agent flottant Mbolo
- Visite guidée et infobulles pour les producteurs

**En cours ou à faire**
- **Comptes** : terminé (inscription, connexion, espace agriculteur protégé, liaison Telegram, bot présenté sur le site). Reste : récupération du mot de passe oublié (aujourd'hui, l'équipe remet le compte à zéro à la main dans Supabase).
- Exécuter `002_utilisateurs.sql`, puis tester le bot Telegram de bout en bout
- Pages « à venir » du menu (météo, sols, rotation…), agents Rotation et Sols, superviseur
- Synthèse vocale des réponses, déploiement (Render pour le serveur, Vercel pour le site, webhook Telegram)

**Documents utiles :** `docs/BRIEF_CONTEXTE_SSTACK.md` (le brief), `docs/RESSOURCES_ET_CONTEXTE_SSTACK.md`, `docs/PROMPT_RELIER_FRONT_BACK.md`, `docs/resultats-tests-*.md`.
