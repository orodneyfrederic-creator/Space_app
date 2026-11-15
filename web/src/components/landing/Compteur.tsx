'use client'
// Nombre qui compte de 0 à sa valeur en 1,6 s quand il devient visible (bandeau des chiffres du hero).
// Le rendu serveur affiche déjà la vraie valeur : sans JavaScript ou avec « réduire les animations », rien ne bouge.
// Le texte est écrit dans le nœud texte existant (nodeValue), sans état React à chaque image ni casser le DOM de React.
import { useEffect, useRef } from 'react'

const DUREE_MS = 1600

export default function Compteur({ valeur, suffixe = '' }: { valeur: number; suffixe?: string }) {
  const noeud = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = noeud.current?.firstChild
    if (!el || el.nodeType !== Node.TEXT_NODE || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    let image = 0
    const compter = () => {
      const debut = performance.now()
      const pas = (t: number) => {
        const p = Math.min(1, (t - debut) / DUREE_MS)
        const adouci = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) // exponentielle : rapide au début, se pose doucement
        el.nodeValue = `${Math.round(valeur * adouci)}${suffixe}`
        if (p < 1) image = requestAnimationFrame(pas)
      }
      image = requestAnimationFrame(pas)
    }
    const observateur = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        observateur.disconnect()
        compter()
      },
      { threshold: 0.6 },
    )
    if (noeud.current) observateur.observe(noeud.current)
    return () => {
      observateur.disconnect()
      cancelAnimationFrame(image)
      el.nodeValue = `${valeur}${suffixe}`
    }
  }, [valeur, suffixe])

  return (
    <span ref={noeud} className="tabular-nums">
      {`${valeur}${suffixe}`}
    </span>
  )
}
