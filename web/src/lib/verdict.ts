// Couleurs et libellés des verdicts de semis, selon la charte S'STACK.
// Le Jaune Soleil n'est jamais utilisé en texte sur fond clair : il sert de fond, avec un contour foncé.
import type { Verdict } from './types'

type Style = {
  libelle: string
  badge: string // classes Tailwind du badge
  marqueur: string // couleur de fond du marqueur sur la carte
  contour: string // couleur du contour du marqueur
}

export const STYLES_VERDICT: Record<Verdict | 'inconnu', Style> = {
  favorable: { libelle: 'Favorable', badge: 'bg-accent-soft text-accent', marqueur: '#009E60', contour: '#0B5D3B' },
  risquée: { libelle: 'Risquée', badge: 'bg-warn-bg text-warn-ink', marqueur: '#FCD116', contour: '#5A4600' },
  défavorable: { libelle: 'Défavorable', badge: 'bg-risk-bg text-risk', marqueur: '#B4532A', contour: '#8E3F1E' },
  inconnu: { libelle: 'Indisponible', badge: 'bg-line-soft text-muted-2', marqueur: '#9AA09A', contour: '#535B53' },
}

export const styleVerdict = (v: Verdict | null) => STYLES_VERDICT[v ?? 'inconnu']
