// Fiche parcelle : transforme les données NASA POWER d'un lieu en un court texte chiffré,
// prêt à être placé dans le contexte du LLM. Règle d'or : le code calcule, le modèle explique.
import { getClimatologie, getQuotidien, type Climatologie, type Jour } from './nasa-power.js'
import {
  codeMois,
  debutSaisonCourante,
  demarrageSaison,
  derniers,
  derniereValeur,
  ecartNormale,
  etatSol,
  evaluerFenetre,
  joursConnus,
  joursSecs,
  lectureEcart,
  moisLesPlusSecs,
  moyenne,
  normalePeriode,
  plusLongueSecheresse,
  pluieCumulee,
} from './indicateurs.js'
import { construireEtatSol, ligneContexteEtatSol } from './etat-sol.js'
import { solLePlusProche } from './sols.js'

export type OptionsFiche = {
  nomLieu?: string
  culture?: string
  /** Pour les tests : date du jour simulée */
  aujourdhui?: Date
}

export type FicheParcelle = {
  texte: string // à placer dans le contexte du LLM
  donnees: Record<string, unknown> // les mêmes chiffres, pour l'interface web ou les tests
}

const NOMS_MOIS: Record<string, string> = {
  JAN: 'janvier', FEB: 'février', MAR: 'mars', APR: 'avril', MAY: 'mai', JUN: 'juin',
  JUL: 'juillet', AUG: 'août', SEP: 'septembre', OCT: 'octobre', NOV: 'novembre', DEC: 'décembre',
}

const dateFr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
const fr = (n: number | null) => (n === null ? 'inconnue' : String(n).replace('.', ','))
const signe = (n: number) => (n > 0 ? `+${n}` : `${n}`)
const nbJours = (n: number) => `${n} jour${n > 1 ? "s" : ""}`

/** Construit la fiche parcelle à partir de données déjà chargées (utile pour les tests). */
export function construireFiche(lat: number, lon: number, donneesJour: Jour[], climato: Climatologie, options: OptionsFiche = {}): FicheParcelle {
  const aujourdhui = options.aujourdhui ?? new Date()
  const connus = joursConnus(donneesJour)
  const dernierJour = connus.at(-1)?.date
  if (!dernierJour) throw new Error('Aucune donnée NASA disponible pour ce lieu')

  const pluie30 = pluieCumulee(donneesJour, 30)
  const normale30 = normalePeriode(donneesJour, 30, climato)
  const ecart30 = ecartNormale(pluie30, normale30)
  const pluie7 = pluieCumulee(donneesJour, 7)
  const normale7 = normalePeriode(donneesJour, 7, climato)
  const ecart7 = ecartNormale(pluie7, normale7)
  const sol0_30 = solLePlusProche(lat, lon)
  const secs14 = joursSecs(donneesJour, 14)
  const secheresse14 = plusLongueSecheresse(derniers(donneesJour, 14))
  const sol = derniereValeur(donneesJour, 'solRacines')
  const solNormal = climato.solRacines[codeMois(dernierJour)]
  const etat = etatSol(sol)
  const tmax7 = moyenne(donneesJour, 7, 'tmax')
  const debutSaison = debutSaisonCourante(aujourdhui)
  const demarrage = demarrageSaison(donneesJour, debutSaison)
  const secs = moisLesPlusSecs(climato)
    .sort((a, b) => Object.keys(NOMS_MOIS).indexOf(a) - Object.keys(NOMS_MOIS).indexOf(b))
    .map((m) => NOMS_MOIS[m])
  const evaluation = evaluerFenetre(demarrage, etat, secs14, secheresse14)

  const manquantes: string[] = []
  if (sol === null) manquantes.push('humidité du sol')
  if (tmax7 === null) manquantes.push('température')
  if (sol0_30 === null) manquantes.push('sol (texture, pH)')

  const ligneSaison =
    demarrage.statut === 'demarree'
      ? `démarrée le ${dateFr(demarrage.date)}${demarrage.provisoire ? ' (provisoire : moins de 20 jours observés depuis)' : ''}`
      : `pas encore démarrée (observée depuis le ${dateFr(demarrage.depuis)})`

  const lignes = [
    `FICHE PARCELLE — calculée le ${dateFr(aujourdhui.toISOString().slice(0, 10))}, données NASA POWER jusqu'au ${dateFr(dernierJour)}`,
    `Lieu : ${options.nomLieu ?? 'parcelle du producteur'} (${lat}, ${lon})`,
    `Pluie des 30 derniers jours : ${fr(pluie30)} mm (normale pour la période : ${fr(normale30)} mm) → ${ecart30 === null ? 'écart non calculable' : `${signe(ecart30)} %`}, ${lectureEcart(ecart30)}`,
    `Pluie des 7 derniers jours : ${fr(pluie7)} mm (normale pour la période : ${fr(normale7)} mm) → ${ecart7 === null ? 'écart non calculable' : `${signe(ecart7)} %`}, ${lectureEcart(ecart7)}`,
    `Jours secs (moins de 1 mm) sur les 14 derniers jours : ${secs14} (plus longue suite sèche : ${nbJours(secheresse14)})`,
    // L'indice brut (0 à 1) reste dans `donnees` : le texte ne donne que l'état, compréhensible par le producteur.
    `Humidité du sol au niveau des racines : ${sol === null ? 'inconnue' : etat} (habituellement pour ce mois : ${etatSol(solNormal ?? null)})`,
    ligneContexteEtatSol(construireEtatSol(lat, lon, donneesJour, climato, aujourdhui)),
    `Température maximale moyenne (7 derniers jours) : ${fr(tmax7)} °C`,
    `Grande saison des pluies : ${ligneSaison}`,
    `Mois habituellement les plus secs ici (normales NASA) : ${secs.join(', ')} → sol nu à protéger`,
    `Évaluation de la fenêtre de semis (règles S'STACK, à valider) : ${evaluation.verdict}, car ${evaluation.raison}`,
    sol0_30
      ? `Sol (0–30 cm) : argile ${fr(sol0_30.argile)} %, sable ${fr(sol0_30.sable)} %, pH ${fr(sol0_30.ph)}, carbone organique ${fr(sol0_30.carbone)} g/kg (source SoilGrids, estimation à 250 m, site de référence : ${sol0_30.site}, à ${sol0_30.distanceKm} km)`
      : `Sol (texture, pH) : données non disponibles (aucun site SoilGrids connu à moins de 50 km)`,
    `Culture déclarée : ${options.culture ?? 'non renseignée'}`,
    `Données manquantes : ${manquantes.length ? manquantes.join(', ') : 'aucune'}`,
  ]

  return {
    texte: lignes.join('\n'),
    donnees: {
      dernierJour, pluie30, normale30, ecart30, pluie7, normale7, ecart7, solTexture: sol0_30, secs14, secheresse14, sol, etatSol: etat, solNormal,
      tmax7, demarrage, moisSecs: secs, evaluation,
    },
  }
}

/**
 * Fiche parcelle d'un lieu : télécharge les données NASA (avec cache) puis construit la fiche.
 * En cas d'échec de la NASA, renvoie une fiche qui le dit clairement (le serveur ne plante pas).
 */
export async function ficheParcelle(lat: number, lon: number, options: OptionsFiche = {}): Promise<FicheParcelle> {
  const aujourdhui = options.aujourdhui ?? new Date()
  // Depuis le 1er septembre de la saison (pour le démarrage), et au moins 60 jours en arrière
  const debutSaison = new Date(`${debutSaisonCourante(aujourdhui)}T00:00:00Z`)
  const ilYa60Jours = new Date(aujourdhui.getTime() - 60 * 24 * 3600 * 1000)
  const debut = debutSaison < ilYa60Jours ? debutSaison : ilYa60Jours

  try {
    const [jours, climato] = await Promise.all([getQuotidien(lat, lon, debut, aujourdhui), getClimatologie(lat, lon)])
    return construireFiche(lat, lon, jours, climato, { ...options, aujourdhui })
  } catch (erreur) {
    console.error('[fiche-parcelle]', erreur)
    return {
      texte: `FICHE PARCELLE — données NASA indisponibles pour le moment (${options.nomLieu ?? `${lat}, ${lon}`}). Donne uniquement un conseil prudent et général, et dis-le.`,
      donnees: { erreur: String(erreur) },
    }
  }
}
