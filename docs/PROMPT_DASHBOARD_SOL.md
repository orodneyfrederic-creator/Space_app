# PROMPT — Refonte du tableau de bord : « Mon sol, ici et maintenant »

> À coller tel quel dans Claude Code (VS Code), à la racine de `Space_app`.
> Travaille **phase par phase**. À la fin de chaque phase : `npm run build` dans `web/` et `npx tsc --noEmit` dans `server/`, puis montre-moi le résumé des fichiers modifiés et **attends mon « OK »** avant la phase suivante.

---

## 0. Contexte (lis avant de toucher au code)

S'STACK est un outil d'aide à la décision agricole pour le Gabon (NASA Space Apps 2026, défi *Field Shift*). Le serveur (`server/`, Hono + TypeScript) calcule les indicateurs à partir de **NASA POWER**. Le front-end (`web/`, Next.js 16, React 19, Tailwind 4, recharts, maplibre-gl) les affiche.

**Le problème à corriger :** le tableau de bord actuel (`web/src/components/vues/VueAccueil.tsx`) montre tout en même temps : le verdict, 4 tuiles, la saison des pluies, la mini-carte des 8 sites, la liste des 8 sites, la carte Telegram et deux boutons. L'utilisateur ne voit pas tout de suite la mission de l'application.

**La mission, en une phrase, qui doit guider chaque décision d'interface :**
> *« Là où je me trouve, dans quel état est mon sol, et que dois-je faire maintenant ? »*

**Principes de conception à respecter partout :**
1. **Hiérarchie de l'information** : 1 décision, puis 3 indicateurs, puis le détail. Le reste passe en *divulgation progressive* (repliable, ou sur une autre page).
2. **Segmentation par profil** : chaque profil professionnel voit seulement ce qui sert *son* travail.
3. **« Le code calcule, le modèle explique »** : tous les chiffres, seuils et verdicts sont calculés par des fonctions pures côté serveur. Le LLM ne produit jamais un chiffre.
4. **Honnêteté de la donnée** : on dit toujours d'où vient la donnée, de quelle date elle est, et à quelle échelle elle s'applique.

**Fichiers existants à lire en premier :**
- `web/src/components/vues/VueAccueil.tsx` (le tableau de bord actuel)
- `web/src/components/navigation/menu.ts` et `Sidebar.tsx` (le menu)
- `web/src/components/vues/VueSols.tsx`, `web/src/components/sols/GraphiqueHumidite.tsx`
- `web/src/lib/api.ts` (dont `getFicheParPosition`), `web/src/lib/session.ts`, `web/src/lib/site-choisi.ts`, `web/src/lib/types.ts`
- `server/src/context/nasa-power.ts`, `server/src/context/indicateurs.ts`, `server/src/context/fiche-parcelle.ts`, `server/src/context/sites.ts`
- `server/src/gateways/api.ts` (route `GET /api/fiche?lat&lon` déjà présente), `server/src/gateways/sols.ts`, `server/src/types/api.ts`
- `server/src/db/utilisateurs.ts`, `web/src/components/auth/FormInscription.tsx`
- `docs/IDENTITE_VISUELLE.md` (couleurs et polices de la charte)

**Ce qui ne doit pas casser :** les routes existantes (`/api/fiche/:siteId`, `/api/apercu`, `/api/conseil`, `/api/voix`, `/api/sols/*`), le bot Telegram, l'authentification, la landing page. `web/src/lib/types.ts` reste une **copie exacte** de `server/src/types/api.ts`.

**Priorités (le concours se termine aujourd'hui) :**
- **P0 (indispensable pour la démo)** : phases 1, 2, 3 et 4.
- **P1** : phases 5 et 6.
- **P2 (si le temps le permet)** : phase 7.

---

## Phase 1 — Données : enrichir NASA POWER avec les variables du sol (P0)

### 1.1 Nouvelles variables dans `server/src/context/nasa-power.ts`

Ajoute à `PARAMS_QUOTIDIEN` (communauté `AG`) :

| Code NASA POWER | Signification | Unité | Libellé affiché |
|---|---|---|---|
| `GWETTOP` | Humidité du sol en **surface** (0 à 5 cm environ) | indice 0–1 | « Surface » |
| `GWETROOT` | Humidité de la **zone racinaire** (déjà présent) | indice 0–1 | « Racines » |
| `GWETPROF` | Humidité du **profil complet** (sol profond) | indice 0–1 | « Profondeur » |
| `TS` | **Température de surface de la Terre** (*Earth skin temperature*) | °C | « Température de surface du sol » |

Ajoute `GWETTOP`, `GWETPROF` et `TS` à `PARAMS_CLIMATO` pour avoir leurs normales mensuelles.

**Règles strictes :**
- **Avant d'écrire le code**, fais un vrai appel de test (Tchibanga : lat −2.85, lon 11.02) et **vérifie dans la réponse JSON** que chaque paramètre est bien renvoyé, en quotidien et en climatologie. Montre-moi l'extrait. Si un paramètre est absent, dis-le et ne l'invente pas.
- `TS` est une **température de surface**, pas la température du sol à 10 cm. Ne l'appelle jamais « température du sol en profondeur ».
- Les indices GWET vont de 0 (sol sec) à 1 (sol saturé). À l'écran, on les affiche en pourcentage (`0,62` → « 62 % »), avec la légende « 0 % = sec, 100 % = saturé ».
- Étends le type `Jour` : `solSurface`, `solRacines`, `solProfond`, `tempSurface` (tous `number | null`, `-999` → `null`).
- Pour la climatologie, la lecture des **nouveaux** paramètres doit être *tolérante* : paramètre absent → `null`, sans lever d'exception. Le comportement actuel de `PRECTOTCORR` et `GWETROOT` ne change pas.
- Change la version de la clé de cache (par exemple un préfixe `v2:`), pour ne pas relire d'anciennes entrées sans les nouveaux champs.

### 1.2 Indicateurs (fonctions pures dans `server/src/context/indicateurs.ts`)

- `tendance(valeurs, jours = 7)` : renvoie `'hausse' | 'baisse' | 'stable'`, en comparant la moyenne des 7 derniers jours connus à celle des 7 jours d'avant. « Stable » si l'écart est inférieur à 0,03 point d'indice (humidité) ou à 0,5 °C (température).
- `etatCouche(indice)` : réutilise les seuils de `etatSol` (< 0,4 sec ; ≤ 0,7 correct ; sinon humide), pour chaque couche.
- `ecartNormaleIndice(actuel, normale)` : l'écart en points de pourcentage (et non en %), arrondi à l'entier.
- Ajoute des tests unitaires simples (ou un script `server/src/scripts/tester-indicateurs.ts`) avec des séries fabriquées à la main.

### 1.3 Nouvelle route : `GET /api/etat-sol?lat=…&lon=…`

Dans `server/src/gateways/api.ts`, validée par zod (même schéma que `RequetePosition`). Ajoute le type dans `server/src/types/api.ts`, puis recopie-le **à l'identique** dans `web/src/lib/types.ts` :

```ts
export type Tendance = 'hausse' | 'baisse' | 'stable'

export type CoucheSol = {
  nom: 'surface' | 'racines' | 'profondeur'
  indice: number | null        // 0–1, dernier jour connu
  normale: number | null       // normale du mois (climatologie NASA)
  etat: 'sec' | 'correct' | 'humide' | 'inconnu'
  tendance7j: Tendance | null
}

export type PointEtatSol = {
  date: string                 // AAAA-MM-JJ
  surface: number | null
  racines: number | null
  profondeur: number | null
  tempSurface: number | null   // °C
  tmax: number | null          // °C, air à 2 m
  pluie: number | null         // mm/jour
}

export type EtatSol = {
  position: { lat: number; lon: number }
  lieuProche: { site: Site; distanceKm: number } | null   // site S'STACK le plus proche (haversine)
  echelle: string              // « Maille NASA POWER d'environ 50 km »
  dernierJour: string | null
  couches: CoucheSol[]         // toujours dans l'ordre surface, racines, profondeur
  tempSurface: { actuelle: number | null; moyenne7j: number | null; normale: number | null; tendance7j: Tendance | null }
  pluie7: number | null
  pluie30: number | null
  verdict: Verdict | null
  raison: string
  action: string               // UNE phrase d'action, calculée par règles (voir 1.4)
  serie: PointEtatSol[]        // les 30 derniers jours connus
}
```

- Coupe la série au **dernier jour réellement publié** par la NASA (même logique que `/sols/humidite` : `findLastIndex`). Demande 45 jours pour absorber le retard de publication.
- `lieuProche` est calculé **hors ligne** avec la formule de haversine sur `SITES`. Aucune API de géocodage externe.
- Si la NASA est injoignable : réponse `503` avec un message clair en français, comme les autres routes.
- Les routes existantes ne changent pas.

### 1.4 Phrase d'action, calculée par règles (pas par le LLM)

Fonction pure `actionRecommandee(etat)` dans `server/src/context/indicateurs.ts`. Exemples de règles, à affiner avec les seuils existants :
- verdict `favorable` et racines « correct » ou « humide » → « Conditions réunies : vous pouvez semer ou bouturer cette semaine. »
- surface « sec » et pluie7 < 10 mm → « Sol sec en surface : attendez une pluie d'au moins 20 mm sur 3 jours avant de bouturer. »
- racines « humide », tendance en hausse et pluie7 élevée → « Sol gorgé d'eau : évitez de travailler la terre, risque de pourriture des boutures. »
- données manquantes → « Données NASA indisponibles pour l'instant : réessayez plus tard. »

Chaque règle a un test. Le LLM (Mbolo) peut **expliquer** cette phrase quand on le lui demande, mais il ne la remplace pas.

**Critère d'acceptation de la phase 1 :** `curl "http://localhost:3001/api/etat-sol?lat=-2.85&lon=11.02"` renvoie un `EtatSol` complet, avec 3 couches non nulles et une série de 30 points. Montre-moi la réponse.

---

## Phase 2 — Géolocalisation de l'utilisateur (P0)

### 2.1 Ce qu'il faut comprendre (et écrire honnêtement dans l'interface)

- La position vient du **GPS du téléphone**, c'est-à-dire des satellites de positionnement (GNSS), via l'**API Geolocation du navigateur**.
- Les données du sol viennent des **satellites et modèles NASA** (NASA POWER), sur une **maille d'environ 50 km**.
- La position choisit donc **la bonne zone** NASA. Elle ne mesure pas le champ au mètre près. L'interface doit le dire en une ligne, sans jargon : *« Données satellite NASA pour votre zone (environ 50 km autour de vous). »*

### 2.2 Hook `web/src/lib/use-position.ts`

- `navigator.geolocation.getCurrentPosition` avec `{ enableHighAccuracy: true, timeout: 10_000, maximumAge: 600_000 }`.
- **Déclenché par un geste de l'utilisateur** (bouton « 📍 Me localiser »), jamais automatiquement au chargement : c'est une bonne pratique de permission, et les navigateurs pénalisent les demandes non sollicitées.
- États exposés : `'inactif' | 'recherche' | 'trouve' | 'refuse' | 'indisponible' | 'delai'`, plus `{ lat, lon, precisionM }`.
- La dernière position est gardée dans `localStorage` (clé `sstack:position`, avec la date). Au retour de l'utilisateur, on la réutilise et on affiche « Position du JJ/MM ». Elle reste sur l'appareil et n'est **jamais** envoyée à Supabase (pas de donnée personnelle stockée).
- **Solutions de repli**, dans cet ordre :
  1. permission refusée ou GPS indisponible → **toucher la carte** pour placer un point (maplibre, déjà installé) ;
  2. sinon → choisir l'une des 8 villes (`SelecteurSite` existant) ;
  3. si l'utilisateur a un `siteId` dans son profil → on l'utilise par défaut.
- Messages d'erreur en français simple, par exemple : « La localisation est bloquée. Autorisez-la dans les réglages du navigateur, ou touchez la carte pour placer votre champ. »
- ⚠️ L'API Geolocation exige **HTTPS** (ou `localhost`). Note-le dans `docs/FRONTEND.md` : pour tester sur un téléphone, utiliser l'URL déployée en HTTPS ou un tunnel, pas `http://192.168.x.x`.

### 2.3 Fonction API côté web

Dans `web/src/lib/api.ts` : `getEtatSol(lat, lon)` → `EtatSol`, avec la même gestion d'erreurs que les autres appels.

**Critère d'acceptation :** sur `localhost`, un clic sur « Me localiser » demande la permission, puis affiche « Près de Libreville (3 km) ». Si on refuse, la carte s'ouvre pour placer un point.

---

## Phase 3 — Segmentation par profil professionnel (P0)

### 3.1 Les trois profils

| Profil (`profil`) | Qui | Sa question principale | Ce qu'il voit en premier |
|---|---|---|---|
| `producteur` *(par défaut)* | Agricultrice, agriculteur | « Que faire sur **mon** champ cette semaine ? » | Une parcelle, un verdict, une action, la coupe de sol |
| `conseiller` | Technicien, agent de vulgarisation, encadreur d'ONG | « Quelles **zones** de mon secteur demandent une visite ? » | La liste de ses zones, triée par urgence, puis le détail d'une zone |
| `organisation` | Responsable de coopérative, décideur local | « Quelle est la **tendance** sur l'ensemble des sites ? » | Une synthèse par verdict, la carte des sites, un tableau comparatif exportable |

### 3.2 Modèle de données

- Ajoute `profil: 'producteur' | 'conseiller' | 'organisation'` au type `Utilisateur` (serveur puis copie web).
- Migration Supabase : colonne `profil text not null default 'producteur' check (profil in ('producteur','conseiller','organisation'))`. Écris le SQL dans `server/supabase/` (ou à l'endroit où se trouvent les migrations existantes) et dis-moi de l'exécuter dans l'éditeur SQL de Supabase. **N'utilise pas** la clé `service_role` côté web.
- Inscription (`FormInscription.tsx`) : ajoute un choix « Vous êtes : Producteur·rice / Conseiller·ère agricole / Coopérative ou organisation », sous forme de 3 cartes cliquables (pas une liste déroulante).
- `PATCH /api/moi` (compte exigé) pour changer de profil depuis Paramètres. Mets à jour la session avec `majUtilisateur`.
- `MODE_SANS_COMPTE` : ajoute un sélecteur de profil visible **uniquement en développement**, pour la démo.

### 3.3 Menu filtré par profil

Dans `menu.ts`, ajoute à chaque entrée un champ `profils?: Profil[]` (absent = visible par tous). Pour le profil `producteur` :
- garder : Accueil, Demander à Mbolo, Mon sol, Mes cultures, Mes conseils, Paramètres ;
- **masquer toutes les pages « à venir »** (`aVenir: true`) : elles encombrent sans servir.

Les profils `conseiller` et `organisation` gardent en plus la Carte des sites et l'Historique climatique.

**Critère d'acceptation :** en changeant de profil, le menu et la page d'accueil changent immédiatement, sans rechargement.

---

## Phase 4 — Nouveau tableau de bord du producteur, plus la coupe de sol (P0)

### 4.1 Architecture des composants

`VueAccueil.tsx` devient un simple **aiguillage** :

```
VueAccueil
 ├─ AccueilProducteur      (components/accueil/AccueilProducteur.tsx)
 ├─ AccueilConseiller      (phase 5)
 └─ AccueilOrganisation    (phase 5)
```

Composants nouveaux dans `web/src/components/sol/` :
- `CoupeSol.tsx` : la visualisation 2D (voir 4.3) ;
- `JaugeCouche.tsx` : une couche (libellé, %, état, flèche de tendance) ;
- `CarteAction.tsx` : le verdict et la phrase d'action ;
- `BandeauPosition.tsx` : lieu, précision, date des données, bouton « Me localiser » ;
- `EvolutionSol.tsx` : les graphiques 30 jours (voir 4.4).

### 4.2 Disposition de `AccueilProducteur` (de haut en bas)

1. **`BandeauPosition`** : « 📍 Près de Tchibanga (4 km) · Données NASA du 11/11 · Zone d'environ 50 km », avec le bouton « Me localiser » / « Changer de lieu ».
2. **`CarteAction`** : grand titre du verdict (« Bon moment pour bouturer »), puis la phrase `action`. C'est l'élément le plus visible de la page.
3. **`CoupeSol`** : la coupe du sol illustrée (voir 4.3). À droite sur ordinateur, sous la carte d'action sur mobile.
4. **Trois indicateurs clés seulement** :
   - « Eau au niveau des racines » : 62 %, ↑ en hausse, +8 pts vs normale ;
   - « Température de surface du sol » : 31 °C, → stable ;
   - « Pluie sur 7 jours » : 24 mm, −40 % vs normale.
5. **« Voir l'évolution sur 30 jours »** : section **repliée par défaut** (`<details>` ou accordéon accessible), qui contient `EvolutionSol`.
6. Un seul bouton d'action secondaire : « Demander à Mbolo pourquoi », qui ouvre l'assistant avec une question pré-remplie et les coordonnées.

**Ce qui sort de la page d'accueil du producteur :**
- la liste des 8 sites et la mini-carte (elles vont sur la page Carte et dans les profils conseiller / organisation) ;
- la carte Telegram : elle devient un **petit bandeau** affiché seulement si `telegramLie === false`, refermable (mémorisé dans `localStorage`) ;
- le bouton « Que planter cette saison ? » (déjà dans le menu « Mes cultures »).

### 4.3 La coupe de sol (`CoupeSol.tsx`) : visualisation 2D en SVG

**Choix technique : SVG 2D natif, sans nouvelle dépendance** (pas de three.js). Raisons : rapide sur les téléphones d'entrée de gamme, accessible, et réalisable aujourd'hui. Variante « relief » en option (voir plus bas).

**Composition verticale (viewBox d'environ 360 × 420) :**

1. **Ciel (en haut)** : une icône météo déduite des données, sans chiffre inventé :
   - pluie7 ≥ 20 mm → nuage avec gouttes ;
   - pluie7 < 5 mm et `tempSurface` > 30 °C → soleil marqué ;
   - sinon → soleil et nuage.
2. **Ligne du sol**, avec une bouture de manioc stylisée (tige et 2 feuilles) qui pousse de la surface.
3. **Trois couches empilées**, de haut en bas :
   - **Surface** (`GWETTOP`), bande fine ;
   - **Zone des racines** (`GWETROOT`), bande la plus haute, traversée par les racines de la bouture ;
   - **Profondeur** (`GWETPROF`), bande du bas.
4. **Remplissage selon l'humidité** : échelle *séquentielle* continue, interpolée en espace OKLab (ou à défaut entre 5 paliers fixes), **du sec vers l'humide** :
   `#B4532A` (Terre Latérite, sec) → `#C98B5E` → `#E9E2CF` (Pierre de Mbigou) → `#7FA6D6` → `#3A75C4` (Bleu Océan, saturé).
   En plus de la couleur, place des **gouttes d'eau** dans chaque couche, en nombre proportionnel à l'indice (0 à 8 gouttes). L'information ne repose donc pas sur la couleur seule.
5. **Étiquettes directes** à droite de chaque couche : « Surface · 41 % · sec ↓ ». Pas de légende séparée.
6. **Thermomètre** fin à gauche de la surface : `tempSurface` en °C, rempli de `#FCD116` (Jaune Soleil, utilisé ici comme couleur de remplissage, **jamais comme texte sur fond clair**) jusqu'à `#B4532A` au-delà de 35 °C.
7. **Repère de normale** : un petit trait pointillé sur chaque jauge, à la valeur normale du mois.

**Animation dans le temps (« Rejouer le mois ») :**
- Un curseur (`<input type="range">`) sur les 30 jours de `serie`, plus un bouton lecture/pause.
- En lecture : un jour toutes les 300 ms. Les couleurs changent avec une transition CSS sur `fill`, et les gouttes apparaissent ou disparaissent avec `opacity`. On n'anime que `fill`, `opacity` et `transform`.
- La date du jour affiché est visible au-dessus (« 28 oct. »).
- `prefers-reduced-motion: reduce` → pas de lecture automatique, transitions coupées, le curseur fonctionne quand même.

**Accessibilité :**
- `<svg role="img" aria-labelledby="titre desc">`, avec un `<title>` et une `<desc>` générés : « Sol en surface sec (41 %), zone des racines correcte (62 %), profondeur humide (78 %). Température de surface 31 °C. »
- Un bouton « Voir en tableau » affiche les mêmes valeurs dans un `<table>`.
- Contraste des étiquettes ≥ 4,5:1 (texte en `#111A14` sur les couches claires, en blanc sur les couches foncées : choisis automatiquement selon la luminance).

**Option « relief » (seulement si les phases 1 à 6 sont terminées)** : un bloc de sol en **perspective isométrique** (faces avant et dessus, obtenues par transformations SVG `skewY` / `scale`), avec un léger effet de parallaxe au survol. Toujours sans three.js.

### 4.4 Graphiques d'évolution (`EvolutionSol.tsx`, recharts)

Bonnes pratiques de visualisation à appliquer :
- **Petits multiples plutôt que double axe** : un graphique par grandeur, alignés sur le même axe des dates.
  1. « Humidité du sol (%) » : 3 lignes (surface, racines, profondeur), étiquetées **directement en bout de ligne**, plus une bande pointillée pour la normale des racines.
  2. « Température (°C) » : `tempSurface` et `tmax` (air), 2 lignes.
  3. « Pluie (mm/jour) » : barres.
- Axe Y de l'humidité fixé de 0 à 100 %. Unités dans le titre de chaque graphique.
- Couleurs des séries : surface `#B4532A`, racines `#0B5D3B`, profondeur `#3A75C4`, tmax `#535B53`, pluie `#3A75C4`.
- Infobulle au survol et au toucher, avec la date en français et les valeurs avec virgule décimale.
- Source sous chaque graphique : « Source : NASA POWER (GWETTOP, GWETROOT, GWETPROF, TS) — maille d'environ 50 km ».
- Réutilise ou remplace `GraphiqueHumidite.tsx` ; ne garde pas deux composants qui font la même chose.

**Critère d'acceptation de la phase 4 :** sur un écran de 390 px et sur un écran de 1440 px, la carte d'action est visible **sans défiler**, la coupe de sol reflète les vraies valeurs de l'API, et le curseur rejoue les 30 jours. Fais des captures Playwright des deux tailles, avant et après.

---

## Phase 5 — Accueil Conseiller et Accueil Organisation (P1)

### `AccueilConseiller`
- **« Mes zones »** : par défaut les 8 sites S'STACK, plus les points ajoutés par l'utilisateur (gardés en `localStorage` pour l'instant).
- Chaque zone affiche : nom, verdict, mini-jauge des racines, tendance, et un **niveau d'alerte** calculé par une fonction pure : `alerte` si racines « sec » avec une tendance à la baisse, ou « humide » avec la pluie en hausse ; `vigilance` ; `ok`.
- **Tri par urgence** (alertes en premier). Un clic ouvre le détail, qui réutilise les composants du producteur (`CarteAction`, `CoupeSol`, `EvolutionSol`).
- Pour éviter 8 appels séparés : ajoute `GET /api/etat-sol/sites`, qui renvoie un résumé léger par site et réutilise le cache NASA.

### `AccueilOrganisation`
- **Bandeau de synthèse** : « 3 sites favorables · 4 risqués · 1 défavorable ».
- La carte des sites (`CarteParcelles` existante), colorée par verdict.
- Un tableau comparatif triable (site, racines %, écart à la normale, pluie 30 j, tempSurface, verdict).
- Un bouton **« Exporter en CSV »** (généré côté client, séparateur `;`, virgule décimale, UTF-8 avec BOM pour Excel).

---

## Phase 6 — Finitions UX (P1)

- **États de chargement** : squelettes (*skeletons*) qui ont la forme finale de la carte d'action et de la coupe, jamais un écran vide.
- **États vides et erreurs** : un message qui dit quoi faire (« Réessayer », « Placer mon champ sur la carte »).
- **Fraîcheur des données** : si `dernierJour` date de plus de 5 jours, petit badge « Données du JJ/MM : la NASA publie avec quelques jours de retard ».
- **Microcopie** : vocabulaire de terrain (« bouturer », « champ », « pluie »), pas de jargon (« GWETROOT » apparaît seulement dans la source et les infobulles).
- **Infobulles** (`Infobulle` existant) pour : humidité de surface, des racines, de profondeur ; température de surface ; maille de 50 km.
- Respect de la charte : polices Outfit et JetBrains Mono (chiffres), couleurs de `docs/IDENTITE_VISUELLE.md`.
- La **visite guidée** (`VisiteGuidee.tsx`) est mise à jour pour pointer les nouveaux éléments (`data-visite="position"`, `"action"`, `"coupe"`, `"indicateurs"`).

---

## Phase 7 — Telegram et l'agent (P2)

- Bot Telegram : ajoute un bouton « 📍 Envoyer ma position » (`KeyboardButton` avec `request_location: true`). À la réception de la position, le bot appelle la même logique que `/api/etat-sol` et répond avec le verdict, la phrase d'action et l'état des 3 couches, en texte court.
- Contexte de l'agent (`construire-contexte.ts` / `fiche-parcelle.ts`) : ajoute les 3 couches et la température de surface à la fiche, sous forme de lignes factuelles, avec leur date. L'agent explique ; il ne recalcule rien.

---

## Règles générales (valables pour toutes les phases)

- **Aucune nouvelle dépendance** sans me demander (la coupe de sol se fait en SVG et CSS).
- TypeScript strict, pas de `any`. Imports `.js` côté serveur (NodeNext ESM).
- Aucune donnée inventée : si une valeur NASA est `null`, on affiche « — » avec une infobulle « donnée non publiée ».
- Aucun secret dans le code ni dans les logs. Aucune position GPS envoyée à Supabase.
- Textes de l'interface en français, nombres au format français (`62 %`, `24,5 mm`, `31 °C`).
- Mets à jour `docs/FRONTEND.md` (nouveaux composants, route `/api/etat-sol`, profils, HTTPS pour la géolocalisation).
- Messages de commit clairs, un commit par phase.

**Commence par la phase 1, étape 1.1 : fais l'appel de test NASA POWER et montre-moi les paramètres réellement renvoyés.**
