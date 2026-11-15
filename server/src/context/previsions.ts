// Prévisions météo à 7 jours (Open-Meteo, https://open-meteo.com) : gratuit, sans clé ni compte.
// NASA POWER ne donne que le passé (avec quelques jours de retard) : les prévisions viennent donc d'ici,
// à partir des modèles météo (ECMWF, GFS…). L'interface le dit : « Prévisions Open-Meteo ».
import { z } from 'zod'
import type { PrevisionJour } from '../types/api.js'

const URL_PREVISIONS = 'https://api.open-meteo.com/v1/forecast'
const DELAI_MS = 15_000
const TROIS_HEURES = 3 * 60 * 60 * 1000
export const SOURCE_PREVISIONS = 'Prévisions Open-Meteo (modèles météo), 7 jours'

const nombres = z.array(z.number().nullable())
const schemaReponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    precipitation_sum: nombres,
    precipitation_probability_max: nombres,
    temperature_2m_max: nombres,
    temperature_2m_min: nombres,
  }),
})

const cache = new Map<string, { expire: number; jours: PrevisionJour[] }>()
const arrondi = (x: number) => Math.round(x * 100) / 100

async function telecharger(url: string): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(DELAI_MS) })
  } catch (erreur) {
    if (erreur instanceof DOMException && erreur.name === 'TimeoutError') throw erreur
    await new Promise((r) => setTimeout(r, 1000)) // une nouvelle tentative après une erreur réseau ponctuelle
    return fetch(url, { signal: AbortSignal.timeout(DELAI_MS) })
  }
}

/** Les 7 prochains jours (aujourd'hui compris). Lève une erreur si Open-Meteo ne répond pas. */
export async function getPrevisions(lat: number, lon: number): Promise<PrevisionJour[]> {
  const la = arrondi(lat)
  const lo = arrondi(lon)
  const cle = `${la}:${lo}`
  const enCache = cache.get(cle)
  if (enCache && enCache.expire > Date.now()) return enCache.jours

  const url =
    `${URL_PREVISIONS}?latitude=${la}&longitude=${lo}` +
    '&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min' +
    '&timezone=Africa%2FLibreville&forecast_days=7'
  const reponse = await telecharger(url)
  if (!reponse.ok) throw new Error(`Open-Meteo a répondu ${reponse.status}`)
  const d = schemaReponse.parse(await reponse.json()).daily
  const jours = d.time.map((date, i) => ({
    date,
    pluie: d.precipitation_sum[i] ?? null,
    probaPluie: d.precipitation_probability_max[i] ?? null,
    tmax: d.temperature_2m_max[i] ?? null,
    tmin: d.temperature_2m_min[i] ?? null,
  }))
  cache.set(cle, { expire: Date.now() + TROIS_HEURES, jours })
  return jours
}
