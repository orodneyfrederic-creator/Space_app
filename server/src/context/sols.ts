// Données de sol pré-téléchargées depuis SoilGrids (knowledge/data/soilgrids-sites.json).
// On prend le site connu le plus proche de la parcelle et on calcule la moyenne sur 0–30 cm
// (la couche où poussent les racines du manioc et de la banane).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const FICHIER = fileURLToPath(new URL('../../../knowledge/data/soilgrids-sites.json', import.meta.url))

/** Au-delà de cette distance, le sol du site connu ne dit plus rien de la parcelle. */
const DISTANCE_MAX_KM = 50

const Profondeurs = z.object({ '0-5cm': z.number(), '5-15cm': z.number(), '15-30cm': z.number() })
const FichierSols = z.object({
  sites: z.array(
    z.object({
      nom: z.string(),
      lat: z.number(),
      lon: z.number(),
      valeurs: z.object({ phh2o: Profondeurs, clay: Profondeurs, sand: Profondeurs, soc: Profondeurs }),
    }),
  ),
})

export type Sol = {
  site: string
  distanceKm: number
  ph: number
  argile: number // %
  sable: number // %
  carbone: number // g/kg
}

/** Moyenne 0–30 cm pondérée par l'épaisseur des couches (5, 10 et 15 cm), convertie (÷ 10), arrondie à 0,1. */
function moyenne030(p: z.infer<typeof Profondeurs>): number {
  const brute = (p['0-5cm'] * 5 + p['5-15cm'] * 10 + p['15-30cm'] * 15) / 30
  return Math.round(brute) / 10
}

/** Distance à vol d'oiseau en km (formule de haversine). */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

/** Sol du site connu le plus proche, ou null si aucun site n'est à moins de 50 km (ou si le fichier manque). */
export function solLePlusProche(lat: number, lon: number): Sol | null {
  let fichier: z.infer<typeof FichierSols>
  try {
    fichier = FichierSols.parse(JSON.parse(readFileSync(FICHIER, 'utf8')))
  } catch (erreur) {
    console.error('[sols] fichier SoilGrids illisible :', erreur)
    return null
  }
  const plusProche = fichier.sites
    .map((s) => ({ s, d: distanceKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.d - b.d)[0]
  if (!plusProche || plusProche.d > DISTANCE_MAX_KM) return null

  const { s, d } = plusProche
  return {
    site: s.nom,
    distanceKm: Math.round(d),
    ph: moyenne030(s.valeurs.phh2o),
    argile: moyenne030(s.valeurs.clay),
    sable: moyenne030(s.valeurs.sand),
    carbone: moyenne030(s.valeurs.soc),
  }
}
