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

- **Téléphone (< 768 px)** : une colonne, barre d'onglets fixe en bas (`components/TabBar.tsx`).
- **Tablette et ordinateur (≥ 768 px)** : barre latérale à gauche (`components/navigation/NavLaterale.tsx`), contenu jusqu'à 1200 px, grilles à 2 ou 3 colonnes.
- Les deux barres partagent la même liste de liens : `components/navigation/liens.ts`.

## Organisation

```
web/src/
  app/                        ← les pages, chacune affiche une « vue »
    page.tsx                  /                     tableau de bord
    carte/                    /carte                carte MapLibre des 8 sites
    parcelles/[id]/           /parcelles/tchibanga  fiche d'un site (rendue dynamiquement)
    donnees/                  /donnees              chiffres NASA du site choisi
    cultures/                 /cultures             repères et questions par culture
    discuter/                 /discuter             parler à l'agent (texte + micro)
    historique/               /historique           conseils donnés (web + Telegram)
  components/
    vues/                     ← une vue par page (chargement, erreur, mise en page)
    carte/  climat/  discussion/  historique/  navigation/  ui/
  lib/
    types.ts                  ← contrat d'API : copie EXACTE de server/src/types/api.ts
    api.ts                    ← une fonction par route (délai 30 s, messages d'erreur clairs)
    use-api.ts                ← hook useApi() : chargement / erreur / prêt + « Réessayer »
    fiche.ts                  ← lecture sûre des chiffres de la fiche + mise en forme française
    site-choisi.ts            ← site choisi, mémorisé dans le navigateur (Tchibanga par défaut)
    verdict.ts                ← couleurs des verdicts (charte S'STACK)
```

Règles :
- Ne jamais afficher une valeur inventée : soit la donnée du serveur, soit « chargement » ou « indisponible ».
- Chaque vue gère ses trois états : chargement, erreur (avec « Réessayer »), prêt.
- Jamais de clé secrète dans `web/` : seulement `NEXT_PUBLIC_API_URL`.
- Charte : Outfit (textes), JetBrains Mono (chiffres) ; le Jaune Soleil n'est jamais du texte sur fond clair.

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
