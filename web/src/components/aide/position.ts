// Placement d'une bulle (infobulle, étape de visite) autour d'un élément, sans jamais sortir de l'écran.
export type Cote = 'haut' | 'bas' | 'droite'

type Rect = { top: number; bottom: number; left: number; right: number; width: number; height: number }

const MARGE = 12 // distance minimale aux bords de l'écran
const ECART = 10 // distance entre l'élément et la bulle

const borner = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))

/** Position (fixed) de la bulle : côté voulu si la place suffit, sinon le côté opposé, sinon collée en bas de l'écran. */
export function placer(ancre: Rect, bulle: { w: number; h: number }, cote: Cote = 'bas'): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (cote === 'droite' && ancre.right + ECART + bulle.w <= vw - MARGE) {
    return { left: ancre.right + ECART, top: borner(ancre.top + ancre.height / 2 - bulle.h / 2, MARGE, vh - bulle.h - MARGE) }
  }

  const left = borner(ancre.left + ancre.width / 2 - bulle.w / 2, MARGE, vw - bulle.w - MARGE)
  const enDessous = ancre.bottom + ECART
  const auDessus = ancre.top - ECART - bulle.h
  const tientDessous = enDessous + bulle.h <= vh - MARGE
  const tientDessus = auDessus >= MARGE

  if (cote === 'haut' && tientDessus) return { left, top: auDessus }
  if (tientDessous) return { left, top: enDessous }
  if (tientDessus) return { left, top: auDessus }
  // Élément trop grand (panneau entier sur téléphone) : la bulle se pose en bas de l'écran
  return { left, top: vh - bulle.h - MARGE }
}

/** Premier élément visible portant data-visite="cle" (la sidebar et la barre du bas en ont chacune un). */
export function trouverCible(cle: string): HTMLElement | null {
  const elements = document.querySelectorAll<HTMLElement>(`[data-visite="${cle}"]`)
  for (const el of elements) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

export const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
