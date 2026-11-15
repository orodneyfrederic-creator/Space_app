# Guide du front-end S'STACK

Ce dossier `web/` contient le site (Next.js 16 + Tailwind 4). Il lit toutes ses données sur le serveur S'STACK (`server/`) : aucune valeur n'est écrite en dur.

## Démarrer

```bash
# 1. Le serveur (dans un premier terminal)
cd server && npm run dev        # → http://localhost:3001

# 2. Le site (dans un second terminal)
cd web
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev                     # → http://localhost:3000
```

`npm run dev` et `npm run build` copient d'abord le worker de MapLibre dans `public/maplibre/` (script `scripts/copier-worker-maplibre.mjs`) : sans lui, la carte ne s'affiche pas.

> ⚠️ Next.js 16 : certaines habitudes des anciennes versions ne marchent plus. En cas de doute, lire la doc installée dans `node_modules/next/dist/docs/`. Deux pièges déjà rencontrés : `params` est une promesse (`await params`), et `usePathname()` / `useSearchParams()` doivent être sous une limite `<Suspense>`.

## Mise en page responsive

- **Landing (`/`)** : pleine largeur, sans barre latérale (`app/page.tsx`, composants dans `components/landing/`). Les pages de l'application sont dans le groupe `app/(app)/`, dont le layout ajoute la navigation.
- **Téléphone (< 768 px)** : une colonne, barre d'onglets fixe en bas (`components/TabBar.tsx`).
- **Ordinateur (≥ 1024 px)** : sidebar « Farm Intelligence » fixe à gauche (`components/navigation/Sidebar.tsx`, menu dans `menu.ts`), contenu jusqu'à 1200 px, grilles à 2 ou 3 colonnes. Sous 1024 px, la sidebar s'ouvre en tiroir depuis l'onglet « Menu ».
- Les deux barres partagent la même liste de liens : `components/navigation/liens.ts`.

## Organisation

```
web/src/
  app/                        ← les pages, chacune affiche une « vue »
    page.tsx                  /                     landing (présentation, pleine largeur, en-tête fixe)
    connexion/                /connexion            connexion (auth pas encore branchée : ouvre /tableau-de-bord)
    inscription/              /inscription          inscription (garde le site choisi, puis ouvre /tableau-de-bord)
    (app)/layout.tsx          ← barre latérale + barre d'onglets des pages ci-dessous
    (app)/tableau-de-bord/    /tableau-de-bord      tableau de bord
    (app)/carte/              /carte                carte MapLibre des 8 sites
    (app)/parcelles/[id]/     /parcelles/tchibanga  fiche d'un site (rendue dynamiquement)
    (app)/donnees/            /donnees              chiffres NASA du site choisi
    (app)/cultures/           /cultures             repères et questions par culture
    (app)/assistant/          /assistant            MODULE 06 assistant intelligent (texte, micro, photo, actions à confirmer)
    (app)/discuter/           /discuter             parler à l'agent (texte + micro)
    (app)/soil/               /soil                 intelligence des sols (?onglet=bilan|analyses|humidite|amendements)
    (app)/historique/         /historique           conseils donnés (web + Telegram)
  components/
    agent/                    ← Mbolo, l'agent flottant de toutes les pages (sur le modèle de Linky, CNX LINK) :
                                questions rapides par page (questions.ts), sinon POST /api/conseil avec le site choisi ;
                                ouvrirAgent(question) l'ouvre depuis n'importe quel bouton
    auth/                     ← cadre et formulaires de connexion / inscription
    aide/                     ← visite guidée du tableau de bord (cibles data-visite="…", étapes dans VisiteGuidee.tsx)
                                et infobulles « i » / survol (textes en français facile dans lib/explications.ts)
    navigation/menu.ts        ← menu « Farm Intelligence » (sidebar + tiroir mobile) ; les entrées « aVenir »
                                sont servies par app/(app)/[rubrique]/[page] (page d'attente)
    landing/                  ← en-tête fixe, hero, sections, carrousel ; photos Unsplash dans public/landing/ (crédits : photos.ts)
    assistant/                ← module 06 : FenetreAssistant, BulleMessage, CarteAction, HistoriqueAssistant
    vues/                     ← une vue par page (chargement, erreur, mise en page)
    carte/  climat/  discussion/  historique/  navigation/  ui/
  lib/
    types.ts                  ← contrat d'API : copie EXACTE de server/src/types/api.ts
    api.ts                    ← une fonction par route (délai 30 s, messages d'erreur clairs)
    use-api.ts                ← hook useApi() : chargement / erreur / prêt + « Réessayer »
    fiche.ts                  ← lecture sûre des chiffres de la fiche + mise en forme française
    site-choisi.ts            ← site choisi, mémorisé dans le navigateur (Tchibanga par défaut)
    verdict.ts                ← couleurs des verdicts (charte S'STACK)
    cultures.ts               ← repères et questions par culture (page /cultures et landing)
    assistant.ts              ← module 06 : sources consultées, actions proposées, journal des actions
    sols.ts                   ← /soil : libellés, unités, comparaison des analyses, bilan des données manquantes
```

## Intelligence des sols (`/soil`)

- **Bilan** : croise les analyses saisies, l'estimation SoilGrids, l'humidité et la pluie NASA, les amendements ; signale ce qui manque (`bilanSol` dans `lib/sols.ts`). Bouton vers l'assistant avec une question qui contient seulement les valeurs mesurées.
- **Analyses** : formulaire (parcelle libre, type de sol, date, méthode, pH, M.O., N, P, K avec unités, rapport de laboratoire) et tableau de comparaison dans le temps.
- **Humidité** : graphique NASA POWER GWETROOT + normale du mois. NASA SMAP : à venir.
- **Amendements** : formulaire et liste.
- Règle : le pH et les nutriments viennent **uniquement** des analyses saisies ; SoilGrids est toujours affiché comme une estimation ; rien n'est déduit d'une image satellite.
- Base : `supabase/migrations/004_sols.sql` (à exécuter après 002). PostGIS : prévu quand les parcelles auront un contour.

## Module 06 — Assistant intelligent (`/assistant`)

Le producteur pose sa question (texte, micro, ou photo + description) ; le **vrai agent** répond (`POST /api/conseil`, `/api/voix`) avec les données du site choisi.

- **Données consultées** : sous chaque réponse, ce que l'agent a réellement lu, tiré de la fiche renvoyée (date NASA, verdict calculé, pluie 30 j, sol SoilGrids, modèle). Rien d'inventé.
- **Pièce jointe** : photo (JPEG/PNG/WebP) ou PDF, 10 Mo max, avec aperçu. ⚠️ Le serveur n'analyse pas encore les images : la photo reste dans le navigateur et la réponse se base sur la description, ce qui est dit au producteur.
- **Diagnostic** : photo jointe ou symptômes décrits (taches, jaunissement…) → badge « hypothèse à vérifier sur le terrain ».
- **Action proposée** : après une question de semis, selon le verdict calculé par le serveur → « Rappel : semer » (favorable) ou « Revérifier le verdict » (risquée, défavorable). Aperçu, puis Confirmer / Annuler.
- **Historique** : onglet avec le journal des actions et les dernières conversations (`GET /api/conseils`).
- **Journal des actions** : gardé dans le navigateur (`localStorage`, `lib/assistant.ts`) en attendant le serveur.

Côté base : `supabase/migrations/003_assistant_ia.sql` prépare les tables `ai_*` (`ai_agents`, `ai_agent_permissions`, `ai_knowledge_sources`, `ai_conversations`, `ai_messages`, `ai_tool_calls`, `ai_recommendations`, `ai_action_logs`) et le bucket privé `ai-pieces-jointes`. Reste à faire côté serveur : analyse des photos, routes `/api/assistant/*` (pièces jointes, actions, journal), appel d'outils par le LLM.

Règles :
- Ne jamais afficher une valeur inventée : soit la donnée du serveur, soit « chargement » ou « indisponible ».
- Chaque vue gère ses trois états : chargement, erreur (avec « Réessayer »), prêt.
- Jamais de clé secrète dans `web/` : seulement `NEXT_PUBLIC_API_URL`.
- Charte : Outfit (textes), JetBrains Mono (chiffres) ; le Jaune Soleil n'est jamais du texte sur fond clair.
- Identité visuelle (logos, couleurs, polices, favicon, image de partage) : voir **`IDENTITE_VISUELLE.md`**. Le nom, le slogan et les couleurs se prennent dans `src/lib/marque.ts`, les logos via le composant `Logo`.

## Le contrat avec le serveur

Source unique : `server/src/types/api.ts` (recopié dans `src/lib/types.ts`). Erreurs : `{ "erreur": "message en français" }`.

| Route | Rôle |
|---|---|
| `GET /api/sante` | Le serveur tourne-t-il ? |
| `GET /api/sites` | Les 8 sites connus |
| `GET /api/apercu` | Verdict de semis et pluie des 8 sites |
| `GET /api/fiche/:siteId` | Fiche détaillée + 30 jours de pluie |
| `GET /api/fiche?lat=…&lon=…&nom=…` | Même chose pour une position libre |
| `POST /api/conseil` | Question écrite à l'agent |
| `POST /api/voix` | Question vocale (`audio` webm, `lat`, `lon`, `nomLieu?`) |
| `GET /api/conseils?limit=20` | Historique (Supabase) |
| `GET /api/sols/humidite/:siteId` | Humidité du sol NASA POWER (GWETROOT), 60 jours, accès libre |
| `GET /api/sols/analyses?siteId=` · `POST` (multipart) | Analyses de sol du producteur (+ rapport PDF/JPEG/PNG) |
| `GET /api/sols/amendements?siteId=` · `POST` (JSON) | Amendements apportés (chaux, compost…) |

## Mouvements et survols (landing)

Tout est en CSS (`src/app/globals.css`) + un petit hook ; **aucune bibliothèque d'animation**.

**Jetons** (dans `:root`) : courbes `--ease-sortie` (la courbe « premium ») et `--ease-standard` ; durées `--duree-rapide` (240 ms, couleurs), `--duree` (450 ms, survols), `--duree-lente` (800 ms, en-tête), `--duree-apparition` (1,1 s, apparitions, avec `--ecart-apparition` de 24 px et un léger flou qui se dissipe) ; ombres teintées `--ombre-1`, `--ombre-2`, `--ombre-3`. En Tailwind : `duration-(--duree)`, `ease-(--ease-sortie)`, `shadow-(--ombre-2)`.

**Classes utilitaires :**

| Classe | Effet |
|---|---|
| `.bouton-plein` | monte de 1 px et ombre plus forte au survol, se compresse (0,98) au clic |
| `.bouton-contour` | fond et bordure en fondu (couleurs via `hover:` Tailwind) |
| `.carte` | bordure Noir Ébène 6 % + `--ombre-1` |
| `.carte-interactive` | monte de 4 px, `--ombre-3`, bordure Vert Forêt 20 % ; une image `.photo-zoom` à l'intérieur zoome à 105 % |
| `.fleche-glisse` / `.fleche-diagonale` | flèche qui glisse dans sa direction (parent `.group`) |
| `.pastille-icone` | pastille d'icône qui tourne de −6° (parent `.group`) |
| `.lien-souligne` | soulignement qui se dessine de gauche à droite |
| `.verre` | verre dépoli clair (en-tête défilé, menu mobile), repli opaque sans `backdrop-filter` |
| `.fond-foret` | dégradé Vert Forêt + halo Vert Gabon (sections Méthode et Appel) |
| `.fond-sombre` | sur une zone sombre : le focus clavier passe en Jaune Soleil (sinon Vert Forêt, via `.landing`) |

**Apparitions au défilement :** `useApparition` (`src/lib/use-apparition.ts`, monté par `components/landing/Apparitions.tsx`). Mettre `data-apparait` sur un élément (fondu, 24 px et flou qui se dissipe à l'entrée dans l'écran, une seule fois) ou `data-cascade` sur une liste (enfants décalés de 120 ms, 6 au maximum). Le hook pose `js-anime` sur `<html>` : sans JavaScript, tout reste visible. Hero : `.hero-zoom` (photo) et `.hero-cascade` (cartes vitrées, avec `--i`) ; chiffres du bandeau : `components/landing/Compteur.tsx`.

**Règles :**
- n'animer que `transform` et `opacity` (plus couleurs, bordures, ombres, `clip-path` pour les survols courts), jamais `width`, `height`, `top`, `left` ;
- le titre et la photo du hero ne sont **jamais** cachés au chargement ;
- `prefers-reduced-motion: reduce` : apparitions visibles tout de suite, pas de zoom ni de déplacement, compteurs affichés directement ;
- effets de survol seulement sur les appareils avec souris (`@media (hover: hover)`), toujours doublés d'un `focus-visible`.

## Position du champ et état du sol

- `lib/use-position.ts` : GPS du téléphone (API Geolocation), demandé **seulement après un clic** sur « Me localiser ». États : `inactif`, `recherche`, `trouve`, `refuse`, `indisponible`, `delai`. La dernière position reste sur l'appareil (`localStorage`, clé `sstack:position`) et n'est **jamais** envoyée à Supabase.
- `lib/use-lieu-sol.ts` : lieu actif = position (GPS ou point placé sur la carte), sinon ville choisie (sinon la ville du compte), puis `getEtatSol(lat, lon)` → `GET /api/etat-sol`.
- `components/sol/BandeauPosition.tsx` : lieu (« Près de Libreville (3 km) »), date des données NASA, échelle (maille d'environ 50 km). Si le GPS est refusé ou impossible, le panneau « Changer de lieu » s'ouvre : toucher la carte (`CartePointeur.tsx`) ou choisir une des 8 villes.
- ⚠️ **L'API Geolocation exige HTTPS** (ou `localhost`). Pour tester sur un téléphone, utiliser l'URL déployée en HTTPS ou un tunnel HTTPS, pas `http://192.168.x.x` : le navigateur refuserait la localisation.

## Accueil selon le profil (« Mon sol, ici et maintenant »)

- `components/vues/VueAccueil.tsx` n'est plus qu'un **aiguillage** selon `useProfil()` (`lib/profil.ts`) :
  - `accueil/AccueilProducteur.tsx` : lieu (`BandeauPosition`), **décision** (`sol/CarteAction.tsx` : titre d'après `codeAction`, phrase `action` du serveur), **coupe du sol** (`sol/CoupeSol.tsx`, SVG sans dépendance, « Rejouer le mois »), 3 indicateurs, évolution 30 jours repliée (`sol/EvolutionSol.tsx`, petits multiples recharts), bandeau Telegram refermable ;
  - `accueil/AccueilConseiller.tsx` : zones triées par urgence (`alerte` calculée par le serveur), points ajoutés gardés sur l'appareil (`sstack:zones`), détail d'une zone avec les composants du producteur ;
  - `accueil/AccueilOrganisation.tsx` : synthèse par verdict, carte des sites, tableau triable, export CSV (`;`, virgule décimale, UTF-8 avec BOM).
- Routes : `GET /api/etat-sol?lat&lon` (état complet), `GET /api/etat-sol/sites` (résumé des 8 sites), `GET /api/etat-sol/resume?lat&lon&nom` (résumé d'un point).
- Profils : `producteur` (défaut), `conseiller`, `organisation`. Choix à l'inscription (`auth/ChoixProfil.tsx`), changement dans Paramètres > Mon profil (`PATCH /api/auth/moi`). Menu filtré par `menuPour(profil)` dans `navigation/menu.ts` (le producteur ne voit aucune page « à venir »). En mode local sans compte : sélecteur « Profil (démo) » sur l'accueil.
- Couleurs de l'humidité : `couleurHumidite()` dans `lib/etat-sol.ts` (Terre Latérite → Pierre de Mbigou → Bleu Océan, interpolé en OKLab). Gouttes d'eau en plus de la couleur.
- `sols/GraphiqueHumidite.tsx` (page /soil, travail d'un coéquipier) est laissé tel quel : il montre 60 jours de la seule zone des racines.
