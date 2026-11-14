# Guide du front-end S'STACK

Ce dossier `web/` appartient au **front-end**. Les autres membres de l'équipe n'y touchent pas, et le front-end ne touche pas à `server/` : on évite ainsi de modifier les mêmes fichiers en même temps.

## Démarrer

```bash
cd web
npm install
cp .env.example .env.local   # puis remplir les valeurs (demander l'URL et la clé publique Supabase en privé)
npm run dev                  # → http://localhost:3000
```

> ⚠️ Next.js 16 : certaines habitudes des anciennes versions ne marchent plus. En cas de doute, lire la doc installée dans `node_modules/next/dist/docs/`. Exemple : dans une page, `params` est une promesse (`const { id } = await params`).

## Ce qu'il faut construire (roadmap, objectif H+42)

« Carte des parcelles et historique des conseils affichés. » Par ordre de priorité :

| Priorité | Où | Quoi |
|---|---|---|
| 1 | `src/components/carte/CarteParcelles.tsx` | Carte MapLibre du Gabon avec un marqueur par parcelle |
| 2 | `src/components/discussion/FenetreDiscussion.tsx` | Discussion écrite avec l'agent (« Je réfléchis… » pendant l'attente) |
| 3 | `src/components/historique/ListeConseils.tsx` | Historique des conseils (web + Telegram) |
| 4 | `src/components/climat/` | Fiche de la parcelle (verdict de semis) et graphique de pluie (recharts) |
| 5 | `src/components/discussion/BoutonMicro.tsx` | Bouton micro (enregistrement dans le navigateur) |
| 6 | `src/app/layout.tsx` et `globals.css` | Charte S'STACK : polices Outfit / JetBrains Mono, couleurs vert, jaune, bleu |

Chaque fichier contient des `TODO (front-end)` qui expliquent quoi faire.

## Organisation

```
web/src/
  app/                       ← les pages (une page = un dossier avec page.tsx)
    page.tsx                 /                  accueil / tableau de bord
    carte/page.tsx           /carte             carte des parcelles
    discuter/page.tsx        /discuter          parler à l'agent (texte + micro)
    historique/page.tsx      /historique        conseils donnés
    parcelles/[id]/page.tsx  /parcelles/tchibanga   fiche d'une parcelle
  components/                ← les morceaux d'interface, rangés par thème
    carte/  discussion/  climat/  historique/  ui/
  lib/
    types.ts                 ← formats des données (alignés sur le serveur)
    api.ts                   ← appels au serveur
    supabase.ts              ← client Supabase (clé publique uniquement)
    donnees-demo.ts          ← données de démonstration pour avancer sans le serveur
```

Règles :
- **Server Components par défaut.** Ajouter `'use client'` en tête de fichier seulement si le composant utilise `useState`, `useEffect`, un clic, le micro ou MapLibre.
- Les pages utilisent pour l'instant `lib/donnees-demo.ts`. Quand le serveur expose une route, on remplace par l'appel de `lib/api.ts`.
- Jamais de clé secrète dans `web/` : seulement les variables `NEXT_PUBLIC_…` de `.env.example`.

## Le contrat avec le serveur

Ces routes **n'existent pas encore** : le back-end les crée. Les formats sont dans `src/lib/types.ts`.

| Route | Envoi | Réponse |
|---|---|---|
| `POST /api/conseil` | JSON `{ lat, lon, nomLieu?, culture?, question }` | `ReponseAgent` : `{ texte, fournisseur, fiche: { texte, donnees } }` |
| `POST /api/voix` | Formulaire : `audio` (webm), `lat`, `lon`, `nomLieu?` | `ReponseAgent` + `transcription` |
| `GET /api/conseils` | — | `Conseil[]` |

Si un format doit changer, en parler au back-end et mettre à jour `types.ts` des deux côtés.
