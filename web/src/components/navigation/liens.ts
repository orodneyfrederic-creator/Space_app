// Raccourcis de la barre d'onglets (téléphone et tablette), dans l'ordre du parcours : décider, comprendre, agir.
// Le menu complet est dans menu.ts (sidebar).
import type { ComponentType } from 'react'
import { ChartIcon, ChatIcon, HomeIcon, SproutIcon } from '../icons'

export type Lien = {
  href: string
  label: string
  icone: ComponentType
  /** Chemins qui rendent ce lien actif */
  correspond: readonly string[]
}

export const LIENS: readonly Lien[] = [
  { href: '/tableau-de-bord', label: 'Dashboard', icone: HomeIcon, correspond: ['/tableau-de-bord'] },
  { href: '/graphiques', label: 'Graphiques', icone: ChartIcon, correspond: ['/graphiques', '/soil'] },
  { href: '/cultures', label: 'Cultures', icone: SproutIcon, correspond: ['/cultures'] },
  { href: '/assistant', label: 'Mbolo', icone: ChatIcon, correspond: ['/assistant', '/discuter', '/historique'] },
]

export function estActif(chemin: string, correspond: readonly string[]): boolean {
  return correspond.some((m) => (m === '/' ? chemin === '/' : chemin === m || chemin.startsWith(`${m}/`)))
}
