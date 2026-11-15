// Menu de l'espace agriculteur (sidebar « Farm Intelligence »), source unique pour :
// - la sidebar (ordinateur) et le tiroir de menu (téléphone) ;
// - les pages « à venir » générées par app/(app)/[rubrique]/[page] et app/(app)/aide.
// Une entrée avec `aVenir` n'a pas encore de contenu : elle affiche une page d'attente.
// Les autres pointent vers les pages déjà construites (tableau de bord, carte, données, cultures, agent, historique).
// La sidebar présente ces pages en 4 étapes (ETAPES_PARCOURS), puis « Bientôt disponible » (BIENTOT).
// RUBRIQUES reste la source complète (adresses des pages à venir et suggestions « Déjà disponible »).
import type { ComponentType } from 'react'
import type { Profil } from '@/lib/types'
import { NOM_AGENT } from '../agent/questions'
import {
  IcoAide,
  IcoBulle,
  IcoCarte,
  IcoCouches,
  IcoGraine,
  IcoGraphique,
  IcoHorloge,
  IcoNuage,
  IcoPiece,
  IcoPresse,
  IcoReglages,
  IcoTableau,
} from '../landing/icones'

export type PageMenu = {
  titre: string
  href: string
  /** Ce que la page contiendra (affiché sur la page d'attente). */
  description: string
  aVenir?: boolean
  /** Chemins qui rendent l'entrée active (par défaut : son href et ses sous-pages). */
  correspond?: readonly string[]
  /** Profils qui voient l'entrée (absent : tous les profils). */
  profils?: readonly Profil[]
}

export type Rubrique = {
  id: string
  titre: string
  icone: ComponentType<{ taille?: number }>
  pages: readonly PageMenu[]
}

/** Ouvre le menu en tiroir (téléphone), depuis l'onglet « Menu » de la barre du bas. */
export const EVENEMENT_OUVRIR_MENU = 'sstack:ouvrir-menu'

const aVenir = (titre: string, href: string, description: string): PageMenu => ({ titre, href, description, aVenir: true })

export const VUE_ENSEMBLE: PageMenu = {
  titre: 'Dashboard',
  href: '/tableau-de-bord',
  description: 'Le verdict de semis et les conditions du site choisi.',
}

/** Entrée affichée directement (sans rubrique à déplier), avec son icône. */
export type EntreeDirecte = PageMenu & { icone: Rubrique['icone']; miseEnAvant?: boolean }

// ── Le parcours du producteur, en 4 étapes ──
// 1. Aujourd'hui : que faire cette semaine (la décision)
// 2. Comprendre  : pourquoi (les données NASA, puis ses propres mesures de terre)
// 3. Agir        : que planter, et poser une question précise
// 4. Mon suivi   : ce qui a déjà été conseillé
// Chaque page se termine par une carte « Étape suivante » (navigation/EtapeSuivante.tsx).

export type EtapeParcours = {
  numero: 1 | 2 | 3 | 4
  titre: string
  /** La question à laquelle répond l'étape (affichée au survol et sous le titre) */
  question: string
  entrees: readonly EntreeDirecte[]
}

const DASHBOARD: EntreeDirecte = { ...VUE_ENSEMBLE, icone: IcoTableau }
const MBOLO: EntreeDirecte = {
  titre: `Demander à ${NOM_AGENT}`,
  href: '/assistant',
  description: 'Une question précise sur votre culture ou votre champ, à l’écrit ou à la voix.',
  correspond: ['/assistant', '/discuter'],
  icone: IcoBulle,
  miseEnAvant: true,
}

export const ETAPES_PARCOURS: readonly EtapeParcours[] = [
  { numero: 1, titre: 'Aujourd’hui', question: 'Que faire cette semaine ?', entrees: [DASHBOARD] },
  {
    numero: 2,
    titre: 'Comprendre',
    question: 'Pourquoi ? Les chiffres NASA',
    entrees: [
      { titre: 'Mes graphiques', href: '/graphiques', description: 'La pluie, l’eau dans la terre et la chaleur des 30 derniers jours, expliquées simplement.', icone: IcoGraphique },
      { titre: 'Mon sol', href: '/soil', description: 'Vos analyses de terre, l’humidité suivie par la NASA et ce que vous avez apporté au sol.', correspond: ['/soil'], icone: IcoCouches },
      { titre: 'Carte des sites', href: '/carte', description: 'Les sites suivis et leur verdict de semis, en 2D ou en 3D.', correspond: ['/carte', '/parcelles'], icone: IcoCarte, profils: ['conseiller', 'organisation'] },
      { titre: 'Historique climatique', href: '/donnees', description: 'Les 30 derniers jours de pluie NASA, comparés à la normale.', icone: IcoNuage, profils: ['conseiller', 'organisation'] },
    ],
  },
  {
    numero: 3,
    titre: 'Agir',
    question: 'Planter au bon moment',
    entrees: [{ titre: 'Mes cultures', href: '/cultures', description: 'Que planter, et quand : repères et questions par culture.', icone: IcoGraine }, MBOLO],
  },
  { numero: 4, titre: 'Mon suivi', question: 'Ce qui vous a été conseillé', entrees: [{ titre: 'Mes conseils', href: '/historique', description: 'Les conseils déjà donnés, sur le site et sur Telegram.', icone: IcoHorloge }] },
]

/** Toutes les entrées directes du parcours (pour exclure ces pages de « Bientôt disponible »). */
export const QUOTIDIEN: readonly EntreeDirecte[] = ETAPES_PARCOURS.flatMap((e) => e.entrees)

export const RUBRIQUES: readonly Rubrique[] = [
  {
    id: 'exploitations',
    titre: 'Mes exploitations',
    icone: IcoCarte,
    pages: [
      aVenir('Mes parcelles', '/exploitations/parcelles', 'La liste de vos parcelles : surface, culture en place et site suivi le plus proche.'),
      { titre: 'Cartographie agricole', href: '/carte', description: 'Les sites suivis et leur verdict de semis.', correspond: ['/carte', '/parcelles'] },
      aVenir('Analyse satellitaire', '/exploitations/analyse-satellitaire', 'Les indices satellites de vos parcelles : végétation, humidité, évolution dans le temps.'),
      aVenir('Historique des parcelles', '/exploitations/historique', 'Ce qui a été semé, traité et récolté sur chaque parcelle, saison après saison.'),
    ],
  },
  {
    id: 'climat',
    titre: 'Intelligence climatique',
    icone: IcoNuage,
    pages: [
      aVenir('Météo agricole', '/climat/meteo', 'Pluie, température et humidité au jour le jour, pour votre site.'),
      aVenir('Prévisions climatiques', '/climat/previsions', 'Les tendances des prochains jours et de la saison à venir.'),
      aVenir('Alertes et risques', '/climat/alertes', 'Sécheresse, fortes pluies, chaleur : les alertes qui concernent vos parcelles.'),
      { titre: 'Historique climatique', href: '/donnees', description: 'Les 30 derniers jours de pluie NASA, comparés à la normale.' },
    ],
  },
  {
    id: 'sols',
    titre: 'Intelligence des sols',
    icone: IcoCouches,
    pages: [
      { titre: 'Analyse des sols', href: '/soil', description: 'Vos analyses de sol, leur comparaison dans le temps et le bilan des données.', correspond: ['/soil'] },
      aVenir('Fertilité des sols', '/sols/fertilite', 'Ce que votre sol peut nourrir, et comment l’enrichir.'),
      // Rubriques de la même page /soil : jamais « actives » seules (la page l'est déjà par « Analyse des sols »)
      { titre: 'Humidité', href: '/soil?onglet=humidite', description: 'L’humidité de la zone des racines, suivie par la NASA.', correspond: [] },
      { titre: 'Amendements', href: '/soil?onglet=amendements', description: 'Chaux, compost, fumier, engrais : ce que vous avez apporté au sol.', correspond: [] },
      aVenir('Recommandations', '/sols/recommandations', 'Les gestes conseillés pour protéger et améliorer votre sol.'),
    ],
  },
  {
    id: 'cultures',
    titre: 'Gestion des cultures',
    icone: IcoGraine,
    pages: [
      { titre: 'Mes cultures', href: '/cultures', description: 'Repères et questions par culture.' },
      aVenir('Calendrier agricole', '/gestion-cultures/calendrier', 'Quand semer, entretenir et récolter, mois par mois.'),
      aVenir('Rotation des cultures', '/gestion-cultures/rotation', 'Quelle culture après laquelle, pour reposer la terre.'),
      aVenir('Recommandations de plantation', '/gestion-cultures/plantation', 'Les cultures adaptées à votre site et à la saison.'),
      aVenir('Suivi de croissance', '/gestion-cultures/croissance', 'L’évolution de vos cultures, de la levée à la récolte.'),
    ],
  },
  {
    id: 'assistant',
    titre: 'Assistant intelligent',
    icone: IcoBulle,
    pages: [
      { titre: 'Assistant agricole IA', href: '/assistant', description: 'Posez vos questions à l’agent, à l’écrit, à la voix ou avec une photo.', correspond: ['/assistant', '/discuter'] },
      aVenir('Diagnostic des cultures', '/assistant-ia/diagnostic', 'Décrivez ou photographiez un problème sur une culture pour obtenir un diagnostic.'),
      aVenir('Conseils personnalisés', '/assistant-ia/conseils', 'Les conseils de l’agent pour vos parcelles et vos cultures.'),
      { titre: 'Historique des conversations', href: '/historique', description: 'Les conseils déjà donnés, sur le web et Telegram.' },
    ],
  },
  {
    id: 'performance',
    titre: 'Performance agricole',
    icone: IcoGraphique,
    pages: [
      aVenir('Prévision des récoltes', '/performance/previsions', 'Une estimation de vos récoltes à venir.'),
      aVenir('Suivi des rendements', '/performance/rendements', 'Vos rendements par parcelle et par saison.'),
      aVenir('Analyse des performances', '/performance/analyse', 'Ce qui a bien marché, et ce qui peut être amélioré.'),
      aVenir('Rapports agricoles', '/performance/rapports', 'Des rapports à télécharger et à partager.'),
    ],
  },
  {
    id: 'economie',
    titre: 'Gestion économique',
    icone: IcoPiece,
    pages: [
      aVenir('Dépenses agricoles', '/economie/depenses', 'Semences, engrais, main-d’œuvre : vos dépenses par saison.'),
      aVenir('Revenus', '/economie/revenus', 'Vos ventes et vos revenus agricoles.'),
      aVenir('Rentabilité', '/economie/rentabilite', 'Ce que rapporte chaque culture, une fois les dépenses déduites.'),
      aVenir('Prix des marchés', '/economie/prix', 'Les prix des produits agricoles sur les marchés.'),
    ],
  },
  {
    id: 'activites',
    titre: 'Activités',
    icone: IcoPresse,
    pages: [
      aVenir('Planification des tâches', '/activites/taches', 'Les travaux à faire, semaine par semaine.'),
      aVenir('Journal agricole', '/activites/journal', 'Ce qui a été fait sur l’exploitation, jour après jour.'),
      aVenir('Observations terrain', '/activites/observations', 'Vos notes et photos prises dans les champs.'),
      aVenir('Notifications', '/activites/notifications', 'Les alertes et rappels qui vous concernent.'),
    ],
  },
]

export const PARAMETRES: Rubrique = {
  id: 'parametres',
  titre: 'Paramètres',
  icone: IcoReglages,
  pages: [
    { titre: 'Mon profil', href: '/parametres/profil', description: 'Votre nom, votre numéro et votre profil (producteur, conseiller, organisation).' },
    aVenir('Mon exploitation', '/parametres/exploitation', 'Le nom, la localisation et les parcelles de votre exploitation.'),
    aVenir('Préférences', '/parametres/preferences', 'Langue, unités et notifications.'),
  ],
}

export const CENTRE_AIDE: PageMenu & { icone: Rubrique['icone'] } = {
  ...aVenir('Centre d’aide', '/aide', 'Les guides d’utilisation de S’STACK et les réponses aux questions fréquentes.'),
  icone: IcoAide,
}

/** Toutes les rubriques (source des pages « à venir » et de leurs suggestions). */
export const TOUTES_RUBRIQUES: readonly Rubrique[] = [...RUBRIQUES, PARAMETRES]

// ── Présentation de la sidebar ──
// Chaque page apparaît une seule fois : « Au quotidien », « Mes données » ou « Bientôt disponible ».

const hrefsQuotidien = new Set(QUOTIDIEN.map((e) => e.href))

/** « Bientôt disponible » : les pages en préparation, regroupées par rubrique. */
export const BIENTOT: readonly Rubrique[] = RUBRIQUES.map((r) => ({ ...r, pages: r.pages.filter((p) => p.aVenir && !hrefsQuotidien.has(p.href)) })).filter(
  (r) => r.pages.length > 0,
)

/** L'entrée correspond-elle au chemin courant ? */
export function estPageActive(chemin: string, page: PageMenu): boolean {
  const chemins = page.correspond ?? [page.href]
  return chemins.some((c) => chemin === c || chemin.startsWith(`${c}/`))
}

/** Page « à venir » d'une adresse /rubrique/page (null si l'adresse n'en est pas une). */
export function pageAVenir(rubriqueId: string, pageId: string): { rubrique: Rubrique; page: PageMenu } | null {
  for (const rubrique of TOUTES_RUBRIQUES) {
    const page = rubrique.pages.find((p) => p.aVenir && p.href === `/${rubriqueId}/${pageId}`)
    if (page) return { rubrique, page }
  }
  return null
}

/** Toutes les adresses /rubrique/page à générer (pour generateStaticParams). */
export function adressesAVenir(): { rubrique: string; page: string }[] {
  return TOUTES_RUBRIQUES.flatMap((r) => r.pages)
    .filter((p) => p.aVenir)
    .map((p) => p.href.split('/').filter(Boolean))
    .filter((segments): segments is [string, string] => segments.length === 2)
    .map(([rubrique, page]) => ({ rubrique, page }))
}

// ── Menu selon le profil ──

const visible = (profil: Profil) => (p: PageMenu) => !p.profils || p.profils.includes(profil)

export type MenuProfil = {
  etapes: readonly EtapeParcours[]
  bientot: readonly Rubrique[]
  parametres: Rubrique
  aide: (PageMenu & { icone: Rubrique['icone'] }) | null
}

/**
 * Les 4 étapes du parcours, filtrées selon le profil.
 * Producteur : seulement ses pages (aucune page « à venir »). Conseiller et organisation : en plus la carte des sites,
 * l'historique climatique, le centre d'aide et les pages en préparation.
 */
export function menuPour(profil: Profil): MenuProfil {
  const etapes = ETAPES_PARCOURS.map((e) => ({ ...e, entrees: e.entrees.filter(visible(profil)) })).filter((e) => e.entrees.length > 0)
  if (profil === 'producteur') {
    return { etapes, bientot: [], parametres: { ...PARAMETRES, pages: PARAMETRES.pages.filter((p) => !p.aVenir) }, aide: null }
  }
  return { etapes, bientot: BIENTOT, parametres: PARAMETRES, aide: CENTRE_AIDE }
}
