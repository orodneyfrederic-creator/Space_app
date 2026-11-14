// Lecture sûre des chiffres de la fiche parcelle (`fiche.donnees` est un objet libre dans le contrat).
// Chaque valeur absente ou mal formée devient null : l'interface affiche alors « indisponible », jamais un chiffre inventé.
import type { Verdict } from './types'

export type EtatSol = 'sec' | 'correct' | 'humide' | 'inconnu'

export type Demarrage =
  | { statut: 'demarree'; date: string; provisoire: boolean }
  | { statut: 'pas_encore'; depuis: string }

export type FicheLue = {
  dernierJour: string | null
  pluie30: number | null
  normale30: number | null
  ecart30: number | null
  pluie7: number | null
  normale7: number | null
  ecart7: number | null
  secs14: number | null
  secheresse14: number | null
  etatSol: EtatSol
  solNormal: EtatSol
  tmax7: number | null
  demarrage: Demarrage | null
  moisSecs: string[]
  verdict: Verdict | null
  raison: string | null
  sol: { site: string; ph: number; argile: number; sable: number; carbone: number } | null
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const nombre = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const texte = (v: unknown) => (typeof v === 'string' ? v : null)
const ETATS: readonly EtatSol[] = ['sec', 'correct', 'humide', 'inconnu']
const VERDICTS: readonly Verdict[] = ['favorable', 'risquée', 'défavorable']

/** L'état du sol à partir de l'indice NASA (mêmes seuils que le serveur, indicateurs.ts). */
function etatDepuisIndice(v: unknown): EtatSol {
  const n = nombre(v)
  if (n === null) return 'inconnu'
  if (n < 0.4) return 'sec'
  if (n <= 0.7) return 'correct'
  return 'humide'
}

function lireDemarrage(v: unknown): Demarrage | null {
  if (!estObjet(v)) return null
  if (v.statut === 'demarree' && typeof v.date === 'string') return { statut: 'demarree', date: v.date, provisoire: v.provisoire === true }
  if (v.statut === 'pas_encore' && typeof v.depuis === 'string') return { statut: 'pas_encore', depuis: v.depuis }
  return null
}

function lireSol(v: unknown): FicheLue['sol'] {
  if (!estObjet(v)) return null
  const [ph, argile, sable, carbone] = [nombre(v.ph), nombre(v.argile), nombre(v.sable), nombre(v.carbone)]
  const site = texte(v.site)
  if (ph === null || argile === null || sable === null || carbone === null || site === null) return null
  return { site, ph, argile, sable, carbone }
}

export function lireFiche(donnees: Record<string, unknown>): FicheLue {
  const evaluation = estObjet(donnees.evaluation) ? donnees.evaluation : {}
  const verdict = VERDICTS.find((v) => v === evaluation.verdict) ?? null
  const etat = ETATS.find((e) => e === donnees.etatSol) ?? 'inconnu'
  return {
    dernierJour: texte(donnees.dernierJour),
    pluie30: nombre(donnees.pluie30),
    normale30: nombre(donnees.normale30),
    ecart30: nombre(donnees.ecart30),
    pluie7: nombre(donnees.pluie7),
    normale7: nombre(donnees.normale7),
    ecart7: nombre(donnees.ecart7),
    secs14: nombre(donnees.secs14),
    secheresse14: nombre(donnees.secheresse14),
    etatSol: etat,
    solNormal: etatDepuisIndice(donnees.solNormal),
    tmax7: nombre(donnees.tmax7),
    demarrage: lireDemarrage(donnees.demarrage),
    moisSecs: Array.isArray(donnees.moisSecs) ? donnees.moisSecs.filter((m): m is string => typeof m === 'string') : [],
    verdict,
    raison: texte(evaluation.raison),
    sol: lireSol(donnees.solTexture),
  }
}

// ── Mise en forme française ──
export const nombreFr = (n: number | null, decimales = 1) =>
  n === null ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: decimales })

export const ecartFr = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${n} %`)

export const dateFr = (iso: string | null) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'

export const LIBELLE_SOL: Record<EtatSol, string> = {
  sec: 'Sol sec',
  correct: 'Sol assez humide',
  humide: 'Sol humide',
  inconnu: 'Humidité inconnue',
}
