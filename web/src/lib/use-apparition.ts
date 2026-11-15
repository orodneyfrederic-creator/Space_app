'use client'
// Apparitions au défilement (landing) : un seul IntersectionObserver pour toute la page.
// - [data-apparait] : l'élément reçoit data-visible="true" quand il entre à 15 % dans l'écran, une seule fois.
// - [data-cascade] : ses enfants directs apparaissent l'un après l'autre (120 ms d'écart, 6 au maximum).
// La classe js-anime posée sur <html> active l'état caché de départ (globals.css) : sans JavaScript,
// ou si le visiteur a demandé moins d'animations, tout reste visible.
import { useEffect } from 'react'

const ECART_MS = 120
const MAX_CASCADE = 6

export function useApparition(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    // Cascade : chaque enfant devient un élément à faire apparaître, avec son délai
    document.querySelectorAll<HTMLElement>('[data-cascade]').forEach((parent) => {
      Array.from(parent.children).forEach((enfant, i) => {
        if (!(enfant instanceof HTMLElement)) return
        enfant.dataset.apparait = ''
        enfant.style.setProperty('--delai', `${Math.min(i, MAX_CASCADE - 1) * ECART_MS}ms`)
      })
    })

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-apparait]'))
    // Ce qui est déjà à l'écran au démarrage reste visible (aucun clignotement)
    const hauteur = window.innerHeight
    for (const el of elements) {
      const r = el.getBoundingClientRect()
      if (r.top < hauteur * 0.85 && r.bottom > 0) el.dataset.visible = 'true'
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          el.dataset.visible = 'true'
          observateur.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    for (const el of elements) if (el.dataset.visible !== 'true') observateur.observe(el)
    document.documentElement.classList.add('js-anime')

    return () => {
      observateur.disconnect()
      document.documentElement.classList.remove('js-anime')
    }
  }, [])
}
