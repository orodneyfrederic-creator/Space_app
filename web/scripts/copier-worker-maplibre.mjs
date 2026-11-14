// Copie le worker de MapLibre (et son module partagé) dans public/maplibre/.
// Turbopack ne sert pas ce fichier tout seul : sans lui, la carte ne s'affiche pas.
// Lancé automatiquement avant `npm run dev` et `npm run build` (scripts predev / prebuild).
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('../node_modules/maplibre-gl/dist/', import.meta.url))
const cible = fileURLToPath(new URL('../public/maplibre/', import.meta.url))
mkdirSync(cible, { recursive: true })
for (const fichier of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(source + fichier, cible + fichier)
}
console.log('Worker MapLibre copié dans public/maplibre/')
