# CLAUDE.md : S'STACK (NASA Space Apps 2026, défi « Field Shift »)

Lu automatiquement par Claude Code. Le guide complet pour les humains est dans `README.md`.

## Le projet en bref
Agent conseiller pour les producteurs gabonais (manioc, plantain) : **quand semer**, à partir de NASA POWER + SoilGrids.
Canaux : site web (`web/`) et bot Telegram (`server/src/bot/`), en texte et en voix. Zone pilote : Tchibanga (Nyanga), 8 villes en tout.
Équipe en hackathon (48 h) : privilégier ce qui marche pour la démo, et livrer des changements petits et vérifiés.

**Règle d'or : « le code calcule, le modèle explique ».** Chiffres et verdict = code TypeScript (`server/src/context/`). Le LLM ne fait qu'expliquer. Aucun entraînement de modèle.

## Commandes
```bash
cd server && npm run dev     # API + bot Telegram → http://localhost:3001 (santé : /api/sante)
cd web && npm run dev        # site → http://localhost:3000 (landing /, espace agriculteur /tableau-de-bord)
cd web && npm run lint       # lint du site
cd server && npx tsc --noEmit
cd server && npx tsx src/scripts/demander.ts tchibanga "question" [--contexte]
cd server && npx tsx src/scripts/tester-agent.ts   # 11 questions → docs/resultats-tests-*.md
```

## Architecture (l'essentiel)
- `server/src/types/api.ts` : **contrat d'API unique**, copié À L'IDENTIQUE dans `web/src/lib/types.ts`. On modifie les deux ensemble.
- `server/src/gateways/api.ts` : routes Hono (`/api/sante`, `/sites`, `/apercu`, `/fiche/:id`, `/fiche?lat&lon`, `/etat-sol?lat&lon` (3 couches de sol, verdict, phrase d'action : `context/etat-sol.ts`), `POST /conseil`, `POST /voix`, `/conseils`). Sols : `gateways/sols.ts` monté sur `/api/sols` (`/humidite/:siteId` libre ; `/analyses` et `/amendements` en GET/POST avec compte).
- `server/src/gateways/auth.ts` : comptes (`POST /api/auth/inscription`, `POST /api/auth/connexion`, `GET /api/auth/moi`), jeton JWT HS256 de 30 jours (`JWT_SECRET`), middleware `exigerCompte` sur `/conseil`, `/voix`, `/conseils`. Mots de passe scrypt (`auth/mot-de-passe.ts`), numéros normalisés en `+2410XXXXXXXX` (`auth/telephone.ts`). Telegram : compte relié par « Partager mon numéro ». Côté site : `web/src/lib/session.ts` + `inscrire`/`connecter` dans `lib/api.ts`.
- `server/src/gateways/llm.ts` : Groq (`openai/gpt-oss-120b`, `reasoning_effort` low) puis Gemini (`gemini-3.1-flash-lite`) sur 429, délai dépassé ou réponse vide. Les deux passent par le SDK `openai`.
- `server/src/gateways/guardrails.ts` : zod (bornes du Gabon), 10 questions par minute et par IP, `filtrerSortie` (texte simple, pas de dose, pas de promesse de rendement, 5 phrases au maximum).
- `server/src/context/construire-contexte.ts` : UN SEUL message système (skill + fiches + fiche parcelle), puis le rappel des règles et la question dans `<question_producteur>`.
- `knowledge/` : comportement de l'agent en Markdown (`skills/climat/SKILL.md`, `fiches/`). On le modifie avant de toucher au code.
- `server/src/db/` : tables `public.conseils`, `public.utilisateurs` et, pour la page `/soil`, `soil_*` (`db/sols.ts`, bucket privé `sols-documents`) (migrations numérotées dans `supabase/migrations/`, exécutées à la main dans le SQL Editor), clé service_role côté serveur seulement.
- `web/` : Next.js 16 + Tailwind 4, guide détaillé dans `web/FRONTEND.md`. Pages de l'espace agriculteur dans `app/(app)/`. Agent flottant Mbolo dans `components/agent/`. Visite guidée et infobulles dans `components/aide/` (cibles `data-visite="…"`, textes dans `lib/explications.ts`).

## Règles (obligatoires)
1. **Secrets** uniquement dans `server/.env` et `web/.env.local` (ignorés par Git). Dans `web/`, seulement des `NEXT_PUBLIC_*`. **Jamais** de clé dans le code, un commit, un log ou un message. Ne jamais lire ni afficher le contenu de `.env` sans nécessité.
2. **Ne pas réécrire** `server/src/context/*`, `llm.ts` ni `voice.ts` (testés) sans expliquer d'abord pourquoi et obtenir l'accord.
3. TypeScript **strict**, **pas de `any`**, **zod** pour toute entrée du serveur.
4. Commentaires, messages d'erreur et interface **en français** (vouvoiement côté producteur, français facile).
5. **Ne jamais afficher de valeur inventée** : une donnée qui manque s'affiche « indisponible ».
6. Pas de dépendance lourde sans demander. Préférer ce qui existe déjà (Hono, zod, grammY, recharts, maplibre-gl).
7. **Ne pas casser l'existant** : la landing (`web/src/app/page.tsx`, `components/landing/`) et le travail des coéquipiers ne se modifient que si c'est demandé.
8. Git : commit ou push seulement si l'utilisateur le demande ; `git pull` avant de travailler ; vérifier qu'aucun `.env` n'est indexé avant chaque commit.
9. Charte : Jaune Soleil `#FCD116` jamais en texte sur fond clair ; tokens de couleur dans `web/src/app/globals.css`.

## Pièges déjà rencontrés
- **Gemini (API compatible OpenAI) ne garde que le DERNIER message système** : tout le contexte doit tenir dans un seul.
- **Next.js 16** : ce n'est pas le Next que vous connaissez ; lire `web/node_modules/next/dist/docs/`. `params` est une Promise. `usePathname`/`useSearchParams` doivent être sous `<Suspense>` (cacheComponents). Lint React : pas de `setState` synchrone dans un effet (le faire dans un callback ou un `requestAnimationFrame`).
- **Cache `web/.next` périmé** après un `git pull` ou un `next build` lancé pendant `next dev` : arrêter le site, supprimer `web/.next`, relancer.
- **MapLibre sous Turbopack** : le worker est copié dans `public/maplibre/` (`scripts/copier-worker-maplibre.mjs`) et chargé avec `setWorkerUrl`. Tuiles OSM raster (CARTO demande une clé ; OpenFreeMap restait gris).
- **recharts** : `isAnimationActive={false}`, sinon le graphique est vide dans les captures.
- **Groq gratuit** : environ 2 300 jetons de contexte par question, donc des 429 quand on enchaîne les questions. C'est normal : Gemini prend le relais.
- **NASA POWER** : les derniers jours valent -999 (publiés avec retard) ; `fetch failed` ponctuel au premier appel (une nouvelle tentative est déjà en place).
- **Windows** : les chemins `/tmp` ne marchent pas avec Node. Un seul serveur à la fois avec le même jeton Telegram (sinon erreur 409).

## En cours
- Comptes : fait (formulaires branchés, `/bienvenue`, `GardeSession` sur `app/(app)/`, carte Telegram). Pas encore de récupération du mot de passe oublié.
- Migrations à exécuter dans Supabase : `004_sols.sql`, `005_profil.sql` (profil du compte ; sans elle, tout le monde est « producteur » et le changement de profil répond 503).
- Accueil par profil (producteur, conseiller, organisation) et coupe du sol : voir `web/FRONTEND.md`. Telegram : « 📍 Envoyer ma position » répond avec l'état du sol.
