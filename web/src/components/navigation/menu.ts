// Menu de l'espace agriculteur (sidebar « Farm Intelligence »), source unique pour :
// - la sidebar (ordinateur) et le tiroir de menu (téléphone) ;
// - les pages « à venir » générées par app/(app)/[rubrique]/[page] et app/(app)/aide.
// Une entrée avec `aVenir` n'a pas encore de contenu : elle affiche une page d'attente.
// Les autres pointent vers les pages déjà construites (tableau de bord, carte, données, cultures, agent, historique).
import type { ComponentType } from 'react'
import {
  IcoAide,
  IcoBulle,
  IcoCarte,
  IcoCouches,
  IcoGraine,
  IcoGraphique,
  IcoNuage,
  IcoPiece,
  IcoPresse,
  IcoReglages,
} from '../landing/icones'

export type PageMenu = {
  titre: string
  href: string
  /** Ce que la page contiendra (affiché sur la page d'attente). */
  description: string
  aVenir?: boolean
  /** Chemins qui rendent l'entrée active (par défaut : son href et ses sous-pages). */
  correspond?: readonly string[]
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
      aVenir('Analyse des sols', '/sols/analyse', 'Texture, acidité et matière organique de votre terre (SoilGrids).'),
      aVenir('Fertilité des sols', '/sols/fertilite', 'Ce que votre sol peut nourrir, et comment l’enrichir.'),
      aVenir('Humidité', '/sols/humidite', 'L’humidité de la zone des racines, suivie par la NASA.'),
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
      { titre: 'Assistant agricole IA', href: '/discuter', description: 'Posez vos questions à l’agent, à l’écrit ou à la voix.', correspond: ['/discuter', '/assistant'] },
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
    aVenir('Mon profil', '/parametres/profil', 'Votre nom, vos coordonnées et votre mot de passe.'),
    aVenir('Mon exploitation', '/parametres/exploitation', 'Le nom, la localisation et les parcelles de votre exploitation.'),
    aVenir('Préférences', '/parametres/preferences', 'Langue, unités et notifications.'),
  ],
}

export const CENTRE_AIDE: PageMenu & { icone: Rubrique['icone'] } = {
  ...aVenir('Centre d’aide', '/aide', 'Les guides d’utilisation de S’STACK et les réponses aux questions fréquentes.'),
  icone: IcoAide,
}

/** Toutes les rubriques dépliables, dans l'ordre de la sidebar. */
export const TOUTES_RUBRIQUES: readonly Rubrique[] = [...RUBRIQUES, PARAMETRES]

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
