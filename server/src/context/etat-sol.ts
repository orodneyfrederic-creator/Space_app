// État du sol à une position : 3 couches d'humidité (surface, racines, profondeur), température de surface,
// pluie, verdict et UNE phrase d'action. Tout est calculé ici par des règles ; le LLM ne fait qu'expliquer.
import type { CoucheSol, EtatSol, PointEtatSol, ResumeEtatSol, Site } from '../types/api.js'
import {
  codeAction,
  codeMois,
  ecartNormale,
  ecartNormaleIndice,
  niveauAlerte,
  normalePeriode,
  SEUIL_TENDANCE_PLUIE,
  TEXTES_ACTION,
  debutSaisonCourante,
  demarrageSaison,
  derniers,
  etatCouche,
  evaluerFenetre,
  joursSecs,
  moyenne,
  plusLongueSecheresse,
  pluieCumulee,
  SEUIL_TENDANCE_INDICE,
  SEUIL_TENDANCE_TEMP,
  tendance,
} from './indicateurs.js'
import { getClimatologie, getQuotidien, type Climatologie, type Jour } from './nasa-power.js'
import { siteLePlusProche } from './sites.js'

export const ECHELLE_NASA = 'Maille NASA POWER d\'environ 50 km'
const JOURS_SERIE = 30

const arrondi2 = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100)

/** Construit l'état du sol à partir de données déjà chargées (fonction pure, testable). */
export function construireEtatSol(lat: number, lon: number, jours: Jour[], climato: Climatologie, aujourdhui: Date): EtatSol {
  // On s'arrête au dernier jour réellement publié par la NASA (les derniers jours valent -999)
  const dernier = jours.findLastIndex((j) => j.solRacines !== null)
  const publies = jours.slice(0, dernier + 1)
  const dernierJour = publies.at(-1)?.date ?? null
  const base = { position: { lat, lon }, lieuProche: siteLePlusProche(lat, lon), echelle: ECHELLE_NASA, dernierJour }

  if (dernierJour === null) {
    const vide = (nom: CoucheSol['nom']): CoucheSol => ({ nom, indice: null, normale: null, etat: 'inconnu', tendance7j: null })
    return {
      ...base,
      couches: [vide('surface'), vide('racines'), vide('profondeur')],
      tempSurface: { actuelle: null, moyenne7j: null, normale: null, tendance7j: null },
      pluie7: null,
      ecartPluie7: null,
      pluie30: null,
      verdict: null,
      raison: 'Données NASA indisponibles',
      codeAction: 'indisponible',
      action: TEXTES_ACTION.indisponible,
      serie: [],
    }
  }

  const mois = codeMois(dernierJour)
  const couche = (nom: CoucheSol['nom'], champ: 'solSurface' | 'solRacines' | 'solProfond', normale: number | null): CoucheSol => {
    const indice = publies.at(-1)?.[champ] ?? null
    return {
      nom,
      indice,
      normale: arrondi2(normale),
      etat: etatCouche(indice),
      tendance7j: tendance(publies.map((j) => j[champ]), SEUIL_TENDANCE_INDICE),
    }
  }
  const couches = [
    couche('surface', 'solSurface', climato.solSurface[mois]),
    couche('racines', 'solRacines', climato.solRacines[mois]),
    couche('profondeur', 'solProfond', climato.solProfond[mois]),
  ] as const

  // Verdict : mêmes règles que la fiche parcelle (seuils.md)
  const demarrage = demarrageSaison(publies, debutSaisonCourante(aujourdhui))
  const evaluation = evaluerFenetre(demarrage, couches[1].etat, joursSecs(publies, 14), plusLongueSecheresse(derniers(publies, 14)))
  const pluie7 = pluieCumulee(publies, 7)
  const code = codeAction({
    verdict: evaluation.verdict,
    saisonDemarree: demarrage.statut === 'demarree',
    surface: couches[0].etat,
    racines: couches[1].etat,
    tendanceRacines: couches[1].tendance7j,
    pluie7,
  })

  const serie: PointEtatSol[] = publies.slice(-JOURS_SERIE).map((j) => ({
    date: j.date,
    surface: j.solSurface,
    racines: j.solRacines,
    profondeur: j.solProfond,
    tempSurface: j.tempSurface,
    tmax: j.tmax,
    pluie: j.pluie,
  }))

  return {
    ...base,
    couches: [...couches],
    tempSurface: {
      actuelle: publies.at(-1)?.tempSurface ?? null,
      moyenne7j: moyenne(publies, 7, 'tempSurface'),
      normale: arrondi2(climato.tempSurface[mois]),
      tendance7j: tendance(publies.map((j) => j.tempSurface), SEUIL_TENDANCE_TEMP),
    },
    pluie7,
    ecartPluie7: ecartNormale(pluie7, normalePeriode(publies, 7, climato)),
    pluie30: pluieCumulee(publies, 30),
    verdict: evaluation.verdict,
    raison: evaluation.raison,
    codeAction: code,
    action: TEXTES_ACTION[code],
    serie,
  }
}

/**
 * État du sol d'une position. Même période que la fiche parcelle (depuis le 1er septembre, au moins 60 jours) :
 * le démarrage de saison est calculable et les données viennent du même cache NASA.
 * Lève une erreur si la NASA est injoignable (la route répond alors 503).
 */
export async function etatSolPosition(lat: number, lon: number, aujourdhui = new Date()): Promise<EtatSol> {
  const debutSaison = new Date(`${debutSaisonCourante(aujourdhui)}T00:00:00Z`)
  const ilYa60Jours = new Date(aujourdhui.getTime() - 60 * 24 * 3600 * 1000)
  const debut = debutSaison < ilYa60Jours ? debutSaison : ilYa60Jours
  const [jours, climato] = await Promise.all([getQuotidien(lat, lon, debut, aujourdhui), getClimatologie(lat, lon)])
  return construireEtatSol(lat, lon, jours, climato, aujourdhui)
}

/** Résumé d'un site à partir de son état du sol (fonction pure). */
export function resumer(site: Site, e: EtatSol): ResumeEtatSol {
  const racines: CoucheSol = e.couches[1] ?? { nom: 'racines', indice: null, normale: null, etat: 'inconnu', tendance7j: null }
  const tendancePluie = tendance(e.serie.map((p) => p.pluie), SEUIL_TENDANCE_PLUIE)
  return {
    site,
    dernierJour: e.dernierJour,
    verdict: e.verdict,
    codeAction: e.codeAction,
    action: e.action,
    racines,
    ecartRacines: ecartNormaleIndice(racines.indice, racines.normale),
    tempSurface: e.tempSurface.actuelle,
    pluie7: e.pluie7,
    pluie30: e.pluie30,
    alerte: niveauAlerte(racines.etat, racines.tendance7j, tendancePluie),
  }
}

/** Résumé d'un site ; si la NASA ne répond pas pour ce site, un résumé « indisponible » (les autres sites répondent). */
export async function resumeSite(site: Site): Promise<ResumeEtatSol> {
  try {
    return resumer(site, await etatSolPosition(site.lat, site.lon))
  } catch (erreur) {
    console.error(`[etat-sol] résumé indisponible pour ${site.nom} :`, erreur)
    return {
      site,
      dernierJour: null,
      verdict: null,
      codeAction: 'indisponible',
      action: TEXTES_ACTION.indisponible,
      racines: { nom: 'racines', indice: null, normale: null, etat: 'inconnu', tendance7j: null },
      ecartRacines: null,
      tempSurface: null,
      pluie7: null,
      pluie30: null,
      alerte: 'vigilance',
    }
  }
}

// ── Textes (Telegram, contexte de l'agent) : les chiffres viennent de l'état calculé, rien n'est recalculé ──

const pct = (v: number | null) => (v === null ? 'non publiée' : `${Math.round(v * 100)} %`)
const nb = (v: number | null, unite: string) => (v === null ? 'non publiée' : `${(Math.round(v * 10) / 10).toString().replace('.', ',')} ${unite}`)
const jourMois = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const FLECHE = { hausse: '↑', baisse: '↓', stable: '→' } as const
const NOM_COUCHE = { surface: 'Surface', racines: 'Racines', profondeur: 'Profondeur' } as const

/** Réponse courte du bot Telegram à une position partagée. */
export function texteEtatSolTelegram(e: EtatSol): string {
  if (e.dernierJour === null) return `${e.action}`
  const pres = e.lieuProche ? (e.lieuProche.distanceKm < 1 ? `à ${e.lieuProche.site.nom.split(' (')[0]}` : `près de ${e.lieuProche.site.nom.split(' (')[0]} (${e.lieuProche.distanceKm} km)`) : 'votre position'
  const couches = e.couches.map((c) => `• ${NOM_COUCHE[c.nom]} : ${pct(c.indice)}${c.etat === 'inconnu' ? '' : ` (${c.etat}${c.tendance7j ? ` ${FLECHE[c.tendance7j]}` : ''})`}`)
  return [
    `📍 Position enregistrée, ${pres}.`,
    '',
    `État du sol (NASA, données du ${jourMois(e.dernierJour)}, zone d'environ 50 km) :`,
    ...couches,
    `🌡️ Surface du sol : ${nb(e.tempSurface.actuelle, '°C')} · 🌧️ Pluie 7 jours : ${nb(e.pluie7, 'mm')}`,
    '',
    `👉 ${e.action}`,
  ].join('\n')
}

/** Ligne factuelle pour la fiche parcelle (contexte du LLM) : 3 couches, température de surface, action par règles. */
export function ligneContexteEtatSol(e: EtatSol): string {
  if (e.dernierJour === null) return 'Humidité du sol par couche : données NASA non publiées'
  const couches = e.couches.map((c) => `${c.nom} ${pct(c.indice)} (${c.etat}${c.tendance7j ? `, ${c.tendance7j}` : ''})`).join(', ')
  return (
    `Humidité du sol par couche au ${jourMois(e.dernierJour)} (indice NASA en %, 0 = sec, 100 = saturé ; tendance sur 7 jours) : ${couches}. ` +
    `Température de surface du sol (TS, pas en profondeur) : ${nb(e.tempSurface.actuelle, '°C')}. ` +
    `Action recommandée par les règles S'STACK (à expliquer, ne pas changer) : ${e.action}`
  )
}
