// Calculs agro-climatiques à partir des données NASA POWER.
// Fonctions « pures » : pas d'appel réseau, faciles à tester avec des données inventées.
// Les seuils viennent de knowledge/fiches/seuils.md et restent [À VALIDER] par un agronome.
import { MOIS, type Climatologie, type CodeMois, type Jour } from './nasa-power.js'

export const SEUIL_JOUR_SEC_MM = 1 // un jour avec moins de 1 mm de pluie est un « jour sec »

/** Ne garde que les jours dont la pluie est connue, jusqu'au dernier jour disponible. */
export function joursConnus(jours: Jour[]): Jour[] {
  return jours.filter((j) => j.pluie !== null)
}

/** Les n derniers jours (parmi les jours connus). */
export const derniers = (jours: Jour[], n: number) => joursConnus(jours).slice(-n)

/** Somme de la pluie des n derniers jours connus (mm). */
export function pluieCumulee(jours: Jour[], n: number): number {
  return arrondi1(derniers(jours, n).reduce((s, j) => s + (j.pluie ?? 0), 0))
}

/** Nombre de jours secs (< 1 mm) sur les n derniers jours connus. */
export function joursSecs(jours: Jour[], n: number): number {
  return derniers(jours, n).filter((j) => (j.pluie ?? 0) < SEUIL_JOUR_SEC_MM).length
}

/** Plus longue suite de jours secs consécutifs dans une liste de jours. */
export function plusLongueSecheresse(jours: Jour[]): number {
  let max = 0
  let courant = 0
  for (const j of jours) {
    courant = (j.pluie ?? 0) < SEUIL_JOUR_SEC_MM ? courant + 1 : 0
    max = Math.max(max, courant)
  }
  return max
}

/** Moyenne d'un champ sur les n derniers jours (valeurs manquantes ignorées). */
export function moyenne(jours: Jour[], n: number, champ: 'tmax' | 'tmin' | 'humiditeAir' | 'solRacines'): number | null {
  const valeurs = derniers(jours, n).map((j) => j[champ]).filter((v): v is number => v !== null)
  if (valeurs.length === 0) return null
  return arrondi1(valeurs.reduce((s, v) => s + v, 0) / valeurs.length)
}

/** Dernière valeur connue d'un champ. */
export function derniereValeur(jours: Jour[], champ: 'solRacines' | 'tmax'): number | null {
  for (let i = jours.length - 1; i >= 0; i--) {
    const v = jours[i]?.[champ]
    if (v !== null && v !== undefined) return v
  }
  return null
}

/** Code NASA du mois d'une date AAAA-MM-JJ */
export const codeMois = (date: string): CodeMois => MOIS[Number(date.slice(5, 7)) - 1] ?? 'JAN'

/**
 * Pluie « normale » pour la même période : somme, jour par jour, de la moyenne mensuelle NASA.
 * Exemple : 30 derniers jours à cheval sur octobre et novembre → jours d'octobre × normale d'octobre + jours de novembre × normale de novembre.
 */
export function normalePeriode(jours: Jour[], n: number, climato: Climatologie): number {
  return arrondi1(derniers(jours, n).reduce((s, j) => s + climato.pluieMmParJour[codeMois(j.date)], 0))
}

/** Écart à la normale en %, arrondi (ex. -56 = 56 % de pluie en moins que d'habitude). */
export function ecartNormale(observe: number, normale: number): number | null {
  if (normale <= 0) return null
  return Math.round(((observe - normale) / normale) * 100)
}

/** Lecture de l'écart, d'après seuils.md */
export function lectureEcart(ecart: number | null): string {
  if (ecart === null) return 'normale non calculable'
  if (ecart < -30) return 'nettement plus sec que d\'habitude'
  if (ecart > 30) return 'nettement plus humide que d\'habitude'
  return 'proche de la normale'
}

/** État du sol d'après l'indice NASA GWETROOT (0 à 1). [À VALIDER] */
export function etatSol(gwetroot: number | null): 'sec' | 'correct' | 'humide' | 'inconnu' {
  if (gwetroot === null) return 'inconnu'
  if (gwetroot < 0.4) return 'sec'
  if (gwetroot <= 0.7) return 'correct'
  return 'humide'
}

/** Les 3 mois habituellement les plus secs (pluie normale la plus faible) : périodes de sol nu à protéger. */
export function moisLesPlusSecs(climato: Climatologie, combien = 3): CodeMois[] {
  return [...MOIS].sort((a, b) => climato.pluieMmParJour[a] - climato.pluieMmParJour[b]).slice(0, combien)
}

export type Demarrage =
  | { statut: 'demarree'; date: string; provisoire: boolean }
  | { statut: 'pas_encore'; depuis: string }

/**
 * Démarrage de la grande saison des pluies (règle agronomique classique, seuils.md) :
 * à partir du 1er septembre, premier jour J où il tombe au moins 20 mm en 3 jours (J, J+1, J+2),
 * SANS suite de 7 jours secs dans les 20 jours suivants (J+3 à J+22).
 * Si moins de 20 jours ont été observés après J, le démarrage est « provisoire ».
 */
export function demarrageSaison(jours: Jour[], debutSaison: string): Demarrage {
  const connus = joursConnus(jours).filter((j) => j.date >= debutSaison)
  for (let i = 0; i + 2 < connus.length; i++) {
    const troisJours = connus.slice(i, i + 3).reduce((s, j) => s + (j.pluie ?? 0), 0)
    if (troisJours < 20) continue
    const suite = connus.slice(i + 3, i + 23)
    if (plusLongueSecheresse(suite) >= 7) continue
    const debut = connus[i]
    if (debut) return { statut: 'demarree', date: debut.date, provisoire: suite.length < 20 }
  }
  return { statut: 'pas_encore', depuis: debutSaison }
}

/** 1er septembre de la saison en cours : cette année à partir de septembre, sinon l'année précédente. */
export function debutSaisonCourante(aujourdhui: Date): string {
  const annee = aujourdhui.getUTCMonth() >= 8 ? aujourdhui.getUTCFullYear() : aujourdhui.getUTCFullYear() - 1
  return `${annee}-09-01`
}

export type Evaluation = { verdict: 'favorable' | 'risquée' | 'défavorable'; raison: string }

/**
 * Évaluation de la fenêtre de semis selon les règles de seuils.md [À VALIDER] :
 * - défavorable : saison pas encore démarrée OU sol sec
 * - risquée     : saison démarrée mais une suite d'au moins 7 jours secs dans les 14 derniers jours
 * - favorable   : saison démarrée, sol correct ou humide, moins de 5 jours secs sur 14
 * - sinon       : risquée
 */
export function evaluerFenetre(demarrage: Demarrage, sol: ReturnType<typeof etatSol>, secs14: number, secheresse14: number): Evaluation {
  if (demarrage.statut === 'pas_encore') return { verdict: 'défavorable', raison: 'la saison des pluies n\'a pas encore démarré' }
  if (sol === 'sec') return { verdict: 'défavorable', raison: 'le sol est sec' }
  if (secheresse14 >= 7) return { verdict: 'risquée', raison: `une période de ${secheresse14} jours secs d'affilée vient d'avoir lieu` }
  if (sol !== 'inconnu' && secs14 < 5) return { verdict: 'favorable', raison: 'saison démarrée, sol suffisamment humide et pluies régulières' }
  return { verdict: 'risquée', raison: `${secs14} jours secs sur les 14 derniers jours` }
}

const arrondi1 = (x: number) => Math.round(x * 10) / 10
