# PROMPT POUR CLAUDE CODE — Relier le front-end au back-end et refaire l'interface responsive (S'STACK)

> **Comment l'utiliser :** ce fichier est dans `docs/PROMPT_RELIER_FRONT_BACK.md`. Dans Claude Code, écrire :
> *« Lis docs/PROMPT_RELIER_FRONT_BACK.md en entier, puis réalise uniquement la PHASE 1. Arrête-toi à la fin de la phase et montre-moi le résultat du critère de fin. »*
> Puis, phase par phase : *« Phase 1 validée. Réalise la PHASE 2. »*, et ainsi de suite.

---

## 0. Rôle et règles de travail

Tu es le développeur principal de S'STACK pendant le NASA Space Apps Challenge 2026 (défi *Field Shift*). Il reste peu de temps : vise ce qui marche pour la démo, proprement, sans sur-ingénierie.

Règles **obligatoires** :
1. **Une phase à la fois.** À la fin de chaque phase, arrête-toi, montre le résultat du « critère de fin » et attends ma validation.
2. **Ne casse pas ce qui marche.** `server/src/context/*` (NASA POWER, fiche parcelle, contexte) et `server/src/gateways/llm.ts` / `voice.ts` sont testés : réutilise-les, ne les réécris pas. Si tu dois les modifier, explique pourquoi avant.
3. **Un seul contrat d'API** : il est défini en partie 2 ci-dessous. Le serveur et le front-end le respectent tous les deux, au champ près.
4. TypeScript strict, pas de `any`, validation des entrées avec **zod** côté serveur.
5. Commentaires, messages d'erreur et textes de l'interface en **français simple**.
6. **Secrets** : uniquement dans `server/.env` (et `web/.env.local` pour les variables publiques `NEXT_PUBLIC_*`). La clé Supabase `service_role` reste **côté serveur**, jamais dans `web/`.
7. Aucune nouvelle dépendance lourde sans me demander. Autorisées si besoin : `hono/cors` (déjà inclus dans hono).
8. Ne laisse **aucune valeur inventée** affichée comme si elle était réelle : soit la vraie donnée NASA, soit un état « chargement » ou « indisponible ».
9. Si une information te manque, **demande** au lieu d'inventer.

---

## 1. État des lieux (au 14/11/2026, 18 h)

### Ce qui marche côté serveur (`server/`)
- `src/context/nasa-power.ts`, `indicateurs.ts`, `fiche-parcelle.ts`, `sites.ts`, `sols.ts` : données NASA POWER, calculs, fiche parcelle `{ texte, donnees }`. Testé avec `npx tsx src/scripts/fiche.ts`.
- `src/context/knowledge.ts` + `construire-contexte.ts` : assemblage skill + fiches + fiche parcelle + question. Testé avec `npx tsx src/scripts/demander.ts`.
- `src/gateways/llm.ts` : `demanderLLM()` (Groq, secours Gemini). `src/gateways/voice.ts` : `transcrire()` (Whisper Groq).

### Ce qui est vide ou absent côté serveur
- `src/index.ts` n'expose qu'une route `/` : **aucune route `/api/...` n'existe.** C'est pour ça que le front-end n'est relié à rien.
- Fichiers vides : `gateways/api.ts`, `gateways/guardrails.ts`, `gateways/data.ts`, `gateways/tools.ts`, `gateways/notifications.ts`, `agents/climat.ts`, `agents/rotation.ts`, `agents/sols.ts`, `agents/supervisor.ts`, `bot/telegram.ts`, `db/supabase.ts`, `supabase/migrations/001_schema.sql`.

### Côté front-end (`web/`, Next.js 16 + Tailwind 4)
- `src/lib/api.ts` appelle `/api/conseil`, `/api/voix`, `/api/conseils`, mais ces routes n'existent pas.
- Toutes les pages utilisent `src/lib/donnees-demo.ts` (données de démonstration, parfois inventées) ou des valeurs écrites en dur dans le code. Exemples à supprimer : l'accueil affiche « Libreville » avec des chiffres d'exemple, « Ensoleillement 4,8 kWh/m² » (non calculé par le serveur), « Pluie au-dessus du 75e percentile » (non calculé).
- **Problème de mise en page :** `globals.css` enferme toute l'application dans un cadre de téléphone de 390 px (`.screen`), centré avec des coins arrondis sur grand écran. Sur un ordinateur (jury, coopératives, conseillers), on voit un petit téléphone au milieu de l'écran. Ça ne correspond ni à l'usage web prévu, ni au reste du projet (pitch, carte, tableau de bord).

---

## 2. Le contrat d'API (source unique de vérité)

Crée `server/src/types/api.ts` avec ces types, et **copie exactement les mêmes** dans `web/src/lib/types.ts` (en remplaçant les types actuels qui ne correspondent plus).

Base : `http://localhost:3001` en local (variable `NEXT_PUBLIC_API_URL` côté web). Toutes les réponses sont en JSON. En cas d'erreur : statut HTTP adapté et corps `{ "erreur": "message clair en français" }`.

| Méthode et route | Entrée | Sortie | Rôle |
|---|---|---|---|
| `GET /api/sante` | — | `{ ok: true, version: string }` | Vérifier que le serveur tourne |
| `GET /api/sites` | — | `Site[]` | Les 8 sites connus |
| `GET /api/apercu` | — | `ApercuSite[]` | Le résumé des 8 sites (pour l'accueil et la carte) |
| `GET /api/fiche/:siteId` | `siteId` = un id de `Site` | `FicheComplete` | La fiche détaillée d'un site + la série de pluie |
| `GET /api/fiche?lat=…&lon=…&nom=…` | coordonnées libres | `FicheComplete` | Même chose pour une position quelconque |
| `POST /api/conseil` | `DemandeConseil` (JSON) | `ReponseAgent` | Poser une question écrite à l'agent |
| `POST /api/voix` | formulaire multipart : `audio` (fichier), `lat`, `lon`, `nomLieu?`, `culture?` | `ReponseAgent` (avec `transcription`) | Poser une question par message vocal |
| `GET /api/conseils?limit=20` | — | `Conseil[]` (du plus récent au plus ancien) | L'historique des conseils |

```ts
export type Site = { id: string; nom: string; lat: number; lon: number }

export type Verdict = 'favorable' | 'risquée' | 'défavorable'

export type ApercuSite = {
  site: Site
  verdict: Verdict | null          // null si les données NASA sont indisponibles
  raison: string
  pluie30: number | null           // mm
  ecart30: number | null           // % par rapport à la normale
  etatSol: 'sec' | 'correct' | 'humide' | 'inconnu'
  dernierJour: string | null       // AAAA-MM-JJ, dernière date de données NASA
}

export type PointPluie = { date: string; pluie: number; normale: number } // mm/jour

export type FicheComplete = {
  site: Site
  fiche: { texte: string; donnees: Record<string, unknown> } // sortie de ficheParcelle()
  serie: PointPluie[]   // les 30 derniers jours connus, avec la normale du jour (moyenne mensuelle NASA)
}

export type DemandeConseil = {
  lat: number
  lon: number
  nomLieu?: string
  culture?: string
  question: string      // 1 à 1000 caractères
  canal?: 'web' | 'telegram'
}

export type ReponseAgent = {
  texte: string
  fournisseur: 'groq' | 'gemini'
  modele: string
  fiche: { texte: string; donnees: Record<string, unknown> }
  transcription?: string
  conseilId?: string    // id enregistré dans Supabase, si l'enregistrement a réussi
}

export type Conseil = {
  id: string
  date: string          // ISO
  canal: 'web' | 'telegram'
  nomLieu: string | null
  question: string
  reponse: string
  fournisseur: string
}
```

Les `id` des sites : `tchibanga`, `mouila`, `lambarene`, `libreville`, `oyem`, `makokou`, `koulamoutou`, `franceville`. Ajoute un champ `id` dans `server/src/context/sites.ts`, sans changer le reste du fichier.

---

## PHASE 1 — Le serveur expose l'API (lecture des données NASA)

1. **`server/src/gateways/api.ts`** : crée un routeur Hono (`new Hono()`) avec `GET /api/sante`, `GET /api/sites`, `GET /api/apercu`, `GET /api/fiche/:siteId` et `GET /api/fiche` (lat/lon/nom validés avec zod).
2. **Série de pluie** : pour `FicheComplete.serie`, réutilise `getQuotidien()` et `getClimatologie()` de `nasa-power.ts` (ils ont déjà un cache de 6 h). Ne garde que les jours dont la pluie est connue (pas les `-999`), les 30 derniers.
3. **`/api/apercu`** : calcule les 8 fiches **en parallèle** (`Promise.all`). Si un site échoue, renvoie quand même les autres, avec `verdict: null` et `raison: "Données NASA indisponibles"`. Pas d'échec global.
4. **CORS** : autorise l'origine du front-end (`FRONTEND_URL` dans `server/.env`, par défaut `http://localhost:3000`) avec `hono/cors`.
5. **`server/src/index.ts`** : monte le routeur, garde `import 'dotenv/config'` en première ligne, et ajoute un gestionnaire d'erreurs global qui renvoie `{ erreur }` en JSON (jamais de pile d'erreur au client).
6. Ajoute `FRONTEND_URL=http://localhost:3000` dans `.env.example`.

**Critère de fin :** `npm run dev` dans `server/`, puis montre-moi les réponses de :
- `curl http://localhost:3001/api/sante`
- `curl http://localhost:3001/api/apercu` (8 sites avec un verdict)
- `curl http://localhost:3001/api/fiche/tchibanga` (fiche + 30 points de pluie)

---

## PHASE 2 — L'agent répond par l'API (texte et voix) et garde-fous

1. **`server/src/agents/climat.ts`** : exporte `repondreClimat(demande: DemandeConseil): Promise<ReponseAgent>`. Il appelle `construireContexte()`, puis `demanderLLM(messages, { temperature: 0.2 })`, puis passe la réponse dans les garde-fous.
2. **`server/src/gateways/guardrails.ts`**, en version simple et efficace :
   - **entrée** : question de 1 à 1000 caractères, coordonnées dans le Gabon (latitude entre -4,5 et 2,5, longitude entre 8,5 et 14,8 ; sinon erreur 400 claire) ;
   - **limite d'appels** : au maximum 10 questions par minute et par adresse IP (compteur en mémoire), sinon erreur 429 « Trop de questions, réessayez dans une minute » ;
   - **sortie** : si la réponse contient une dose de produit chimique (motif du type nombre + `kg/ha`, `g/l`, `ml/l` près de « engrais », « pesticide », « herbicide »), remplace la phrase par « Pour les doses de produits, demandez conseil à un agronome. ».
3. **`POST /api/conseil`** : valide `DemandeConseil` avec zod, appelle `repondreClimat`, renvoie `ReponseAgent`.
4. **`POST /api/voix`** : lit le formulaire avec `c.req.parseBody()`, refuse les fichiers de plus de 10 Mo, appelle `transcrire()` de `gateways/voice.ts` (le nom du fichier doit garder son extension : `.webm` pour le navigateur, `.ogg` pour Telegram), puis `repondreClimat` avec le texte transcrit. Renvoie `ReponseAgent` avec `transcription`.

**Critère de fin :** montre-moi la réponse de
`curl -X POST http://localhost:3001/api/conseil -H "content-type: application/json" -d "{\"lat\":-2.85,\"lon\":11.02,\"nomLieu\":\"Tchibanga (Nyanga)\",\"culture\":\"manioc\",\"question\":\"Est-ce que je peux planter mon manioc cette semaine ?\"}"`
La réponse doit citer au moins 2 chiffres de la fiche. Montre aussi l'erreur 400 obtenue avec une latitude de 48.

---

## PHASE 3 — L'historique dans Supabase

1. **`supabase/migrations/001_schema.sql`** :
   ```sql
   create table if not exists public.conseils (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     canal text not null check (canal in ('web', 'telegram')),
     nom_lieu text,
     lat double precision not null,
     lon double precision not null,
     culture text,
     question text not null,
     reponse text not null,
     fournisseur text not null,
     modele text not null,
     fiche jsonb not null
   );
   alter table public.conseils enable row level security;
   -- Aucune politique publique : seul le serveur (clé service_role) lit et écrit.
   create index if not exists conseils_created_at_idx on public.conseils (created_at desc);
   ```
   Je l'exécuterai moi-même dans le **SQL Editor** de Supabase. Dis-moi quand le faire.
2. **`server/src/db/supabase.ts`** : client serveur créé avec `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (`auth: { persistSession: false }`).
3. **Enregistrement** : après chaque réponse de `/api/conseil` et `/api/voix`, enregistre le conseil. **Si Supabase échoue, la réponse part quand même** : on journalise l'erreur, sans la renvoyer au client.
4. **`GET /api/conseils?limit=20`** (limite de 1 à 50) : lit la table, renvoie `Conseil[]` en camelCase.
5. **Ne stocke aucune donnée personnelle** au-delà de ce tableau : pas de nom, pas de numéro de téléphone.

**Critère de fin :** pose 2 questions par `/api/conseil`, puis montre-moi `curl http://localhost:3001/api/conseils` (2 conseils, le plus récent en premier).

---

## PHASE 4 — Brancher le front-end sur l'API (fin des données de démo)

1. **`web/.env.local`** (non commité) : `NEXT_PUBLIC_API_URL=http://localhost:3001`. Crée `web/.env.example` avec la même ligne.
2. **`web/src/lib/types.ts`** : remplace par les types du contrat (partie 2).
3. **`web/src/lib/api.ts`** : une fonction par route du contrat (`getSites`, `getApercu`, `getFiche`, `getFicheParPosition`, `demanderConseil`, `envoyerVocal`, `listerConseils`). Délai maximum de 30 s ; un message d'erreur clair si le serveur est éteint (« Le serveur S'STACK ne répond pas. Vérifiez qu'il est lancé. »).
4. **Pages**, avec un état de **chargement** et un état d'**erreur** pour chacune :
   - **Accueil (`app/page.tsx`)** : le site choisi (par défaut Tchibanga, mémorisé dans `localStorage` avec `try/catch`) affiche ses vrais chiffres via `/api/fiche/:siteId`. La liste « Parcelles suivies » vient de `/api/apercu`, avec un badge de verdict coloré. Supprime « Ensoleillement » et le message « 75e percentile ». Le bandeau d'alerte reprend l'évaluation réelle de la fiche (`verdict` + `raison`).
   - **Carte (`components/carte/CarteParcelles.tsx`)** : les 8 sites viennent de `/api/apercu`. Couleur du marqueur selon le verdict : favorable = Vert Gabon `#009E60`, risquée = Jaune Soleil `#FCD116` avec un contour foncé, défavorable = Terre Latérite `#B4532A`, inconnu = gris. Un clic ouvre la page du site.
   - **Page d'un site (`app/parcelles/[id]/page.tsx`)** : la vraie fiche et le vrai graphique (pluie quotidienne en barres + normale en ligne) via `/api/fiche/:siteId`. Cette page doit être rendue dynamiquement : pas de données figées au moment du build.
   - **Agent (`components/discussion/FenetreDiscussion.tsx`)** : l'envoi appelle `demanderConseil()`. Le micro (`BoutonMicro`) enregistre avec `MediaRecorder` au format webm et appelle `envoyerVocal()`. On affiche la transcription, puis la réponse. Pendant l'attente : « S'STACK consulte les données NASA… ».
   - **Historique** : `listerConseils()`.
   - **Données (`app/donnees/page.tsx`)** : uniquement des chiffres calculés par le serveur (pluie 7 et 30 jours, normale, écart, jours secs, humidité du sol, température, démarrage de la saison, mois secs).
5. **`web/src/lib/donnees-demo.ts`** : supprime-le s'il n'est plus importé nulle part. Sinon, garde-le uniquement pour les tests et marque-le clairement comme tel.

**Critère de fin :** serveur et front-end lancés (`npm run dev` dans les deux dossiers). Montre-moi que :
1. l'accueil affiche les vraies valeurs de Tchibanga (330 mm environ sur 30 jours le 14/11) ;
2. la carte affiche 8 marqueurs colorés ;
3. une question écrite reçoit une vraie réponse ;
4. le serveur éteint, l'interface affiche le message d'erreur clair au lieu de planter.
Lance aussi `npm run build` dans `web/` : aucune erreur.

---

## PHASE 5 — Interface responsive : mobile ET ordinateur

**Le problème :** l'application est enfermée dans un cadre de téléphone de 390 px. Sur ordinateur, ça fait maquette, pas produit.

**La cible :**
- **Téléphone** (moins de 768 px) : on garde l'expérience actuelle : une colonne, la barre d'onglets en bas.
- **Tablette et ordinateur** (768 px et plus) : une vraie application web. Barre de navigation **latérale à gauche** (logo S'STACK, mêmes 5 entrées), contenu large et aéré, sans cadre de téléphone ni coins arrondis autour de l'écran.

**À faire :**
1. **`globals.css`** : supprime le cadre `.screen` (largeur maximale de 390 px, hauteur 844 px, coins arrondis, ombre). La page occupe toute la fenêtre. Fond Pierre de Mbigou `#E9E2CF`.
2. **`app/layout.tsx`** : structure en deux zones. Sous 768 px : contenu puis `TabBar` en bas, fixe. À partir de 768 px : `NavLaterale` à gauche (environ 240 px de large), contenu à droite, largeur maximale d'environ 1200 px, centré.
3. **`components/NavLaterale.tsx`** (nouveau) : mêmes liens et icônes que `TabBar` (garde un tableau de liens commun, partagé entre les deux composants), logo S'STACK en haut, lien actif en Vert Forêt.
4. **Mises en page sur ordinateur :**
   - **Accueil** : grille de 2 colonnes. À gauche, « Conditions actuelles » + l'évaluation. À droite, une mini-carte + « Parcelles suivies ».
   - **Carte** : carte en grand (au moins 70 % de la hauteur de l'écran), liste des sites à droite avec leur verdict.
   - **Page d'un site** : fiche à gauche, graphique de pluie à droite.
   - **Agent** : fenêtre de discussion centrée (environ 720 px de large), historique dans une colonne à droite sur grand écran.
5. **Charte S'STACK, à respecter partout** : polices Outfit (textes) et JetBrains Mono (chiffres). Couleurs : Vert Forêt `#0B5D3B` (principal), Vert Gabon `#009E60`, Bleu Océan `#3A75C4` (données NASA, pluie), Terre Latérite `#B4532A` (risque), Jaune Soleil `#FCD116` **jamais en texte sur fond clair** (accent ou fond seulement), Noir Ébène `#111A14` (texte). Les variables de `globals.css` existent déjà : réutilise-les.
6. **Accessibilité** : contraste suffisant, zones cliquables d'au moins 44 px, `aria-current` sur le lien actif, tout utilisable au clavier.

**Critère de fin :** dans les outils de développement du navigateur, montre-moi l'accueil, la carte et l'agent à **390 px** (téléphone) et à **1440 px** (ordinateur), soit 6 captures ou descriptions. Plus aucun cadre de téléphone sur ordinateur. `npm run build` sans erreur.

---

## PHASE 6 — Le bot Telegram

1. **`server/src/bot/telegram.ts`** avec grammY (`TELEGRAM_BOT_TOKEN`) :
   - `/start` : message d'accueil court en français + bouton « 📍 Partager ma position » (clavier avec `request_location`) + boutons des 8 villes ;
   - **position reçue** ou **ville choisie** : mémorisée pour cet utilisateur (en mémoire, dans une `Map` par `chat.id` ; pas de stockage du numéro ni du nom) ;
   - **message texte** : appelle `repondreClimat()` avec la position mémorisée et `canal: 'telegram'`. Sans position, il redemande la position ;
   - **message vocal** : télécharge le fichier OGG de Telegram, `transcrire()` (nom de fichier `vocal.ogg`), puis `repondreClimat()`. Répond d'abord « 🎙️ J'ai compris : "…" », puis le conseil ;
   - **pendant le calcul** : action « en train d'écrire » ;
   - **erreurs** : un message poli, jamais de détail technique.
2. **Lancement** : en développement, en long polling, démarré depuis `src/index.ts` seulement si `TELEGRAM_BOT_TOKEN` existe. Si le bot ne démarre pas, le serveur web continue de tourner.
3. Les conseils Telegram sont enregistrés dans Supabase comme ceux du web (Phase 3).

**Critère de fin :** sur Telegram, avec le bot : `/start` → partager la position (ou choisir Tchibanga) → « Est-ce que je peux planter mon manioc cette semaine ? » → vraie réponse. Puis un message vocal → transcription + réponse. Le conseil apparaît dans `GET /api/conseils` avec `canal: "telegram"`.

---

## PHASE 7 — Tests de qualité des réponses

1. Crée `knowledge/tests/questions-test.md` avec les 10 questions de l'annexe B de `docs/BRIEF_CONTEXTE_SSTACK.md`, plus : « Compare trois rotations pour ma parcelle, dont ma rotation actuelle manioc puis manioc. »
2. Crée `server/src/scripts/tester-agent.ts` : il pose toutes les questions pour Tchibanga (directement via `repondreClimat`, sans enregistrer dans Supabase) et écrit `docs/resultats-tests-AAAA-MM-JJ.md` avec, pour chaque question : la question, la réponse, le fournisseur, et 4 cases à cocher pour l'humain (réponse directe en premier / au moins 2 chiffres de la fiche / action concrète / aucun chiffre inventé).
3. Respecte les quotas gratuits : une pause de 3 secondes entre deux questions.

**Critère de fin :** le fichier de résultats existe avec 11 réponses. Signale-moi les réponses qui semblent enfreindre le skill (rendement promis, dose de produit, règle ignorée).

---

## Après les 7 phases (seulement si je le demande)

- Synthèse vocale de la réponse (TTS) pour Telegram.
- Agent Rotation séparé et superviseur LangGraph (`agents/rotation.ts`, `agents/supervisor.ts`).
- Mise en ligne : serveur sur Render, front-end sur Vercel, webhook Telegram au lieu du long polling.
- RAG sur des guides (pgvector).
