// Intelligence des sols : libellés, unités et bilan des données disponibles.
// Règles :
//  - Les valeurs chimiques (pH, matière organique, N, P, K) viennent UNIQUEMENT des analyses saisies.
//    L'estimation SoilGrids est affichée à part, toujours nommée « estimation ».
//  - Le bilan croise ce qui est connu et dit ce qui MANQUE ; il n'invente aucune valeur.
//  - Seuils repris de knowledge/fiches/sols-gabon.md et seuils.md (encore « à valider »).
import type { FicheLue } from './fiche'
import { dateFr, nombreFr } from './fiche'
import type { Amendement, AnalyseSol, HumiditeSol, MethodeAnalyse, ProprieteSol, TypeAmendement, TypeSol, UniteSol } from './types'

export const TYPES_SOL: { valeur: TypeSol; libelle: string }[] = [
  { valeur: 'sableux', libelle: 'Sableux' },
  { valeur: 'sablo_argileux', libelle: 'Sablo-argileux' },
  { valeur: 'argilo_sableux', libelle: 'Argilo-sableux' },
  { valeur: 'argileux', libelle: 'Argileux' },
  { valeur: 'limoneux', libelle: 'Limoneux' },
  { valeur: 'lateritique', libelle: 'Latéritique (terre rouge)' },
  { valeur: 'hydromorphe', libelle: 'Hydromorphe (bas-fond)' },
  { valeur: 'autre', libelle: 'Autre / je ne sais pas' },
]
export const libelleTypeSol = (t: TypeSol | null) => TYPES_SOL.find((x) => x.valeur === t)?.libelle ?? 'Non précisé'

export const METHODES: { valeur: MethodeAnalyse; libelle: string }[] = [
  { valeur: 'laboratoire', libelle: 'Laboratoire' },
  { valeur: 'kit_terrain', libelle: 'Kit de terrain' },
  { valeur: 'autre', libelle: 'Autre' },
]
export const libelleMethode = (m: MethodeAnalyse) => METHODES.find((x) => x.valeur === m)?.libelle ?? m

/** Les propriétés suivies, leurs unités acceptées (la première est proposée par défaut) et un pas de saisie. */
export const PROPRIETES: { valeur: ProprieteSol; libelle: string; court: string; unites: UniteSol[]; pas: string }[] = [
  { valeur: 'ph', libelle: 'pH (eau)', court: 'pH', unites: ['pH'], pas: '0.1' },
  { valeur: 'matiere_organique', libelle: 'Matière organique', court: 'M.O.', unites: ['%', 'g/kg'], pas: '0.01' },
  { valeur: 'azote', libelle: 'Azote (N)', court: 'N', unites: ['%', 'g/kg', 'mg/kg'], pas: '0.01' },
  { valeur: 'phosphore', libelle: 'Phosphore (P)', court: 'P', unites: ['mg/kg', 'ppm'], pas: '0.1' },
  { valeur: 'potassium', libelle: 'Potassium (K)', court: 'K', unites: ['cmol/kg', 'mg/kg', 'ppm'], pas: '0.01' },
]
export const libellePropriete = (p: ProprieteSol) => PROPRIETES.find((x) => x.valeur === p)?.libelle ?? p

export const TYPES_AMENDEMENT: { valeur: TypeAmendement; libelle: string }[] = [
  { valeur: 'chaux', libelle: 'Chaux (corriger l’acidité)' },
  { valeur: 'compost', libelle: 'Compost' },
  { valeur: 'fumier', libelle: 'Fumier' },
  { valeur: 'engrais_mineral', libelle: 'Engrais minéral (NPK, urée…)' },
  { valeur: 'cendres', libelle: 'Cendres' },
  { valeur: 'paillage', libelle: 'Paillage' },
  { valeur: 'autre', libelle: 'Autre' },
]
export const libelleAmendement = (t: TypeAmendement) => TYPES_AMENDEMENT.find((x) => x.valeur === t)?.libelle ?? t

/** Valeur d'une propriété dans une analyse (null si elle n'a pas été mesurée). */
export const mesure = (a: AnalyseSol, p: ProprieteSol) => a.mesures.find((m) => m.propriete === p) ?? null

export const valeurFr = (a: AnalyseSol, p: ProprieteSol) => {
  const m = mesure(a, p)
  if (!m) return '—'
  return m.unite === 'pH' ? nombreFr(m.valeur, 2) : `${nombreFr(m.valeur, 2)} ${m.unite}`
}

/** Écart avec l'analyse précédente, seulement si la même propriété a été mesurée dans la même unité. */
export function evolution(recente: AnalyseSol, ancienne: AnalyseSol | undefined, p: ProprieteSol): string | null {
  const a = mesure(recente, p)
  const b = ancienne ? mesure(ancienne, p) : null
  if (!a || !b || a.unite !== b.unite) return null
  const d = a.valeur - b.valeur
  if (Math.abs(d) < 1e-9) return '='
  return `${d > 0 ? '+' : '−'}${nombreFr(Math.abs(d), 2)}`
}

const ANNEES_AVANT_ANCIENNE = 3
const SEUIL_PH_ACIDE = 5.5 // knowledge/fiches/sols-gabon.md [À VALIDER]

export type Constat = { niveau: 'info' | 'attention' | 'manque'; texte: string }

/**
 * Bilan du site : croise les analyses saisies, l'estimation SoilGrids, l'humidité NASA, la pluie et les amendements.
 * Chaque constat cite sa source. Les « manque » disent quelles données il faudrait ajouter.
 */
export function bilanSol(params: {
  analyses: AnalyseSol[] | null // null : le carnet n'a pas pu être lu (on ne conclut rien)
  amendements: Amendement[] | null
  fiche: FicheLue | null
  humidite: HumiditeSol | null
  aujourdhui?: Date
}): Constat[] {
  const { analyses, amendements, fiche, humidite } = params
  const maintenant = params.aujourdhui ?? new Date()
  const constats: Constat[] = []
  const derniere = analyses?.[0] // triées de la plus récente à la plus ancienne

  // 1. Analyses
  if (analyses === null) {
    constats.push({ niveau: 'manque', texte: 'Vos analyses n’ont pas pu être lues : impossible de vérifier le pH et les nutriments pour le moment.' })
  } else if (!derniere) {
    constats.push({
      niveau: 'manque',
      texte: 'Aucune analyse de sol enregistrée : le pH, la matière organique, l’azote, le phosphore et le potassium de votre parcelle sont inconnus.',
    })
  } else {
    const age = (maintenant.getTime() - new Date(`${derniere.dateAnalyse}T12:00:00Z`).getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age > ANNEES_AVANT_ANCIENNE) {
      constats.push({
        niveau: 'attention',
        texte: `La dernière analyse date du ${dateFr(derniere.dateAnalyse)} ${derniere.dateAnalyse.slice(0, 4)} (plus de ${ANNEES_AVANT_ANCIENNE} ans) : elle ne reflète peut-être plus votre sol.`,
      })
    }
    const manquantes = PROPRIETES.filter((p) => !mesure(derniere, p.valeur)).map((p) => p.libelle)
    if (manquantes.length) {
      constats.push({ niveau: 'manque', texte: `Non mesuré dans la dernière analyse : ${manquantes.join(', ')}.` })
    }
    const ph = mesure(derniere, 'ph')
    if (ph) {
      constats.push({
        niveau: ph.valeur < SEUIL_PH_ACIDE ? 'attention' : 'info',
        texte:
          ph.valeur < SEUIL_PH_ACIDE
            ? `pH mesuré : ${nombreFr(ph.valeur, 2)}. Sol acide (moins de ${nombreFr(SEUIL_PH_ACIDE)}, repère à valider).`
            : `pH mesuré : ${nombreFr(ph.valeur, 2)} (pas acide selon le repère de ${nombreFr(SEUIL_PH_ACIDE)}, à valider).`,
      })
    }
    if (!derniere.typeSol) constats.push({ niveau: 'manque', texte: 'Le type de sol n’est pas renseigné dans la dernière analyse.' })
  }

  // 2. Estimation SoilGrids (jamais présentée comme une mesure)
  if (fiche?.sol) {
    constats.push({
      niveau: 'info',
      texte: `Estimation SoilGrids (environ 250 m, pas votre parcelle exacte) : pH ${nombreFr(fiche.sol.ph)}, argile ${nombreFr(fiche.sol.argile, 0)} %, sable ${nombreFr(fiche.sol.sable, 0)} %. Une analyse locale reste la référence.`,
    })
  } else {
    constats.push({ niveau: 'manque', texte: 'Pas d’estimation SoilGrids pour ce site.' })
  }

  // 3. Humidité et pluie (NASA)
  const dernierPoint = humidite?.points.findLast((p) => p.racines !== null)
  if (dernierPoint?.racines != null) {
    const v = dernierPoint.racines
    const etat = v < 0.4 ? 'sec' : v <= 0.7 ? 'correct' : 'humide'
    const normale = dernierPoint.normale
    constats.push({
      niveau: etat === 'sec' ? 'attention' : 'info',
      texte:
        `Humidité de la zone des racines le ${dateFr(dernierPoint.date)} : ${nombreFr(v, 2)} (sol ${etat}, seuils à valider)` +
        (normale !== null ? `, habituellement ${nombreFr(normale, 2)} ce mois-ci.` : '.') +
        ' Source : NASA POWER, modèle à environ 50 km.',
    })
  } else {
    constats.push({ niveau: 'manque', texte: 'Humidité du sol NASA indisponible pour le moment.' })
  }
  if (fiche?.pluie30 != null) {
    constats.push({ niveau: 'info', texte: `Pluie des 30 derniers jours : ${nombreFr(fiche.pluie30)} mm (NASA POWER).` })
  }

  // 4. Amendements
  if (amendements === null) {
    constats.push({ niveau: 'manque', texte: 'Vos amendements n’ont pas pu être lus pour le moment.' })
  } else if (amendements.length === 0) {
    constats.push({ niveau: 'manque', texte: 'Aucun amendement enregistré (chaux, compost, fumier, engrais…).' })
  } else if (derniere) {
    const apres = amendements.filter((a) => a.date > derniere.dateAnalyse)
    if (apres.length) {
      constats.push({
        niveau: 'info',
        texte: `${apres.length} amendement(s) apporté(s) depuis la dernière analyse : une nouvelle analyse montrerait leur effet.`,
      })
    }
  }

  constats.push({
    niveau: 'info',
    texte: 'Les images satellites ne mesurent pas la chimie du sol : le pH et les nutriments ne viennent que de vos analyses.',
  })
  return constats
}

/** Question préparée pour l'assistant : uniquement des valeurs saisies ou mesurées, avec ce qui manque. */
export function questionPourAgent(analyse: AnalyseSol | undefined, amendements: Amendement[], culture = 'manioc'): string {
  if (!analyse) {
    return `Je n'ai pas encore d'analyse de sol pour ma parcelle. Quelles analyses faire faire avant de planter du ${culture}, et que dois-je surveiller en attendant ?`
  }
  const valeurs = analyse.mesures.map((m) => `${libellePropriete(m.propriete)} ${nombreFr(m.valeur, 2)}${m.unite === 'pH' ? '' : ` ${m.unite}`}`)
  const manquent = PROPRIETES.filter((p) => !mesure(analyse, p.valeur)).map((p) => p.court)
  const apports = amendements.slice(0, 3).map((a) => `${libelleAmendement(a.type).split(' (')[0]} le ${a.date}`)
  return [
    `Mon analyse de sol du ${analyse.dateAnalyse} (${libelleMethode(analyse.methode).toLowerCase()}) : ${valeurs.join(', ') || 'aucune mesure chimique'}.`,
    analyse.typeSol ? `Type de sol : ${libelleTypeSol(analyse.typeSol).toLowerCase()}.` : '',
    manquent.length ? `Non mesuré : ${manquent.join(', ')}.` : '',
    apports.length ? `Apports déjà faits : ${apports.join(', ')}.` : '',
    `Que me conseillez-vous pour le ${culture} ? Dites-moi aussi ce qu'il manque pour décider.`,
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 1000)
}
