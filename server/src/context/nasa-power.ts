// Accès aux données NASA POWER (https://power.larc.nasa.gov) : aucune clé ni compte nécessaire.
// Deux services :
//  - getQuotidien()     : la météo jour par jour d'un point (pluie, températures, humidité du sol…)
//  - getClimatologie()  : les normales mensuelles de long terme (pour dire « plus sec que d'habitude »)
import { z } from 'zod'

const URL_QUOTIDIEN = 'https://power.larc.nasa.gov/api/temporal/daily/point'
const URL_CLIMATO = 'https://power.larc.nasa.gov/api/temporal/climatology/point'
const DELAI_MS = 20_000
const VALEUR_MANQUANTE = -999 // NASA POWER écrit -999 quand une donnée manque

// Paramètres NASA demandés (community=AG : agriculture)
//  PRECTOTCORR : pluie (mm/jour)             T2M_MAX / T2M_MIN : température max / min (°C)
//  RH2M : humidité de l'air (%)              GWETROOT : humidité du sol au niveau des racines (0 = sec, 1 = saturé)
const PARAMS_QUOTIDIEN = ['PRECTOTCORR', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'GWETROOT'] as const
const PARAMS_CLIMATO = ['PRECTOTCORR', 'GWETROOT'] as const

export const MOIS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const
export type CodeMois = (typeof MOIS)[number]

/** Une journée de données. `null` = donnée manquante chez la NASA. */
export type Jour = {
  date: string // AAAA-MM-JJ
  pluie: number | null
  tmax: number | null
  tmin: number | null
  humiditeAir: number | null
  solRacines: number | null
}

/** Normales mensuelles : pluie en mm/jour et humidité du sol, pour chaque mois. */
export type Climatologie = {
  pluieMmParJour: Record<CodeMois, number>
  solRacines: Record<CodeMois, number>
}

// --- Validation de la réponse NASA (on ne fait jamais confiance aveuglément à une API externe) ---
const serie = z.record(z.string(), z.number())
const schemaReponse = z.object({
  properties: z.object({ parameter: z.record(z.string(), serie) }),
})

// --- Cache en mémoire : évite de rappeler la NASA à chaque question ---
const SIX_HEURES = 6 * 60 * 60 * 1000
const TRENTE_JOURS = 30 * 24 * 60 * 60 * 1000
const cache = new Map<string, { expire: number; valeur: unknown }>()

async function avecCache<T>(cle: string, dureeMs: number, charger: () => Promise<T>): Promise<T> {
  const enCache = cache.get(cle)
  if (enCache && enCache.expire > Date.now()) return enCache.valeur as T
  const valeur = await charger()
  cache.set(cle, { expire: Date.now() + dureeMs, valeur })
  return valeur
}

/**
 * Requête vers NASA POWER avec UNE nouvelle tentative après 1,5 s en cas d'erreur réseau
 * (des « fetch failed » ponctuels ont été observés au premier appel d'un processus).
 * Un délai dépassé n'est pas retenté : on ne fait pas attendre le producteur 40 s.
 */
async function telecharger(url: string): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(DELAI_MS) })
  } catch (erreur) {
    if (erreur instanceof DOMException && erreur.name === 'TimeoutError') throw erreur
    console.warn('[nasa-power] erreur réseau, nouvelle tentative dans 1,5 s :', String(erreur))
    await new Promise((r) => setTimeout(r, 1500))
    return fetch(url, { signal: AbortSignal.timeout(DELAI_MS) })
  }
}

async function appelerNasa(url: string): Promise<Record<string, Record<string, number>>> {
  let reponse: Response
  try {
    reponse = await telecharger(url)
  } catch (erreur) {
    throw new Error(`NASA POWER injoignable (réseau ou délai dépassé) : ${String(erreur)}`)
  }
  if (!reponse.ok) throw new Error(`NASA POWER a répondu ${reponse.status} pour ${url}`)
  const json: unknown = await reponse.json()
  return schemaReponse.parse(json).properties.parameter
}

const versNombre = (v: number | undefined): number | null =>
  v === undefined || v === VALEUR_MANQUANTE ? null : v

/** AAAAMMJJ, format attendu par NASA POWER */
const formatNasa = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '')

/** Coordonnées arrondies à 2 décimales (~1 km) : la clé de cache et l'appel restent stables */
const arrondi = (x: number) => Math.round(x * 100) / 100

/**
 * Données quotidiennes entre deux dates (incluses).
 * Les derniers jours sont souvent manquants (-999) : la NASA publie avec quelques jours de retard.
 */
export async function getQuotidien(lat: number, lon: number, debut: Date, fin: Date): Promise<Jour[]> {
  const la = arrondi(lat)
  const lo = arrondi(lon)
  const url =
    `${URL_QUOTIDIEN}?parameters=${PARAMS_QUOTIDIEN.join(',')}&community=AG` +
    `&latitude=${la}&longitude=${lo}&start=${formatNasa(debut)}&end=${formatNasa(fin)}&format=JSON`

  return avecCache(`q:${la}:${lo}:${formatNasa(debut)}:${formatNasa(fin)}`, SIX_HEURES, async () => {
    const p = await appelerNasa(url)
    const dates = Object.keys(p.PRECTOTCORR ?? {}).sort()
    return dates.map((d) => ({
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      pluie: versNombre(p.PRECTOTCORR?.[d]),
      tmax: versNombre(p.T2M_MAX?.[d]),
      tmin: versNombre(p.T2M_MIN?.[d]),
      humiditeAir: versNombre(p.RH2M?.[d]),
      solRacines: versNombre(p.GWETROOT?.[d]),
    }))
  })
}

/** Normales mensuelles de long terme pour un point. */
export async function getClimatologie(lat: number, lon: number): Promise<Climatologie> {
  const la = arrondi(lat)
  const lo = arrondi(lon)
  const url =
    `${URL_CLIMATO}?parameters=${PARAMS_CLIMATO.join(',')}&community=AG` +
    `&latitude=${la}&longitude=${lo}&format=JSON`

  return avecCache(`c:${la}:${lo}`, TRENTE_JOURS, async () => {
    const p = await appelerNasa(url)
    const lire = (nom: string) => {
      const s = p[nom]
      if (!s) throw new Error(`Climatologie NASA : paramètre ${nom} absent`)
      return Object.fromEntries(MOIS.map((m) => [m, s[m] ?? 0])) as Record<CodeMois, number>
    }
    return { pluieMmParJour: lire('PRECTOTCORR'), solRacines: lire('GWETROOT') }
  })
}
