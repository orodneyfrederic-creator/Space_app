// Raccourcis de la barre d'onglets (téléphone et tablette). Le menu complet est dans menu.ts (sidebar).
import type { ComponentType } from 'react'
import { ChatIcon, HomeIcon, MapIcon, SproutIcon } from '../icons'

export type Lien = {
  href: string
  label: string
  icone: ComponentType
  /** Chemins qui rendent ce lien actif */
  correspond: readonly string[]
}

export const LIENS: readonly Lien[] = [
  { href: '/tableau-de-bord', label: 'Accueil', icone: HomeIcon, correspond: ['/tableau-de-bord'] },
  { href: '/carte', label: 'Carte', icone: MapIcon, correspond: ['/carte', '/parcelles'] },
  { href: '/cultures', label: 'Cultures', icone: SproutIcon, correspond: ['/cultures'] },
  { href: '/assistant', label: 'Agent', icone: ChatIcon, correspond: ['/assistant', '/discuter', '/historique'] },
]

export function estActif(chemin: string, correspond: readonly string[]): boolean {
  return correspond.some((m) => (m === '/' ? chemin === '/' : chemin === m || chemin.startsWith(`${m}/`)))
}
