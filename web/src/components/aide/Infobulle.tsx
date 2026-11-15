'use client'
// Aides au survol :
// - <Infobulle sujet="…" /> : petit bouton « i » à côté d'un mot difficile. S'ouvre au survol (souris),
//   au toucher (téléphone) ou au clavier ; se ferme avec Échap ou en touchant ailleurs.
// - <Survol texte="…"> : bulle courte au survol ou au focus clavier d'un lien (menu de la sidebar).
// Les bulles sont rendues dans <body> (portail) : aucun conteneur à défilement ne peut les couper.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { EXPLICATIONS, type SujetExplication } from '@/lib/explications'
import { placer, type Cote } from './position'

const peutSurvoler = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Suit la position de l'élément pendant que la bulle est ouverte (défilement, redimensionnement). */
function usePosition(ouvert: boolean, ancre: React.RefObject<HTMLElement | null>, bulle: React.RefObject<HTMLElement | null>, cote: Cote) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!ouvert) return
    let image = 0
    const recalculer = () => {
      cancelAnimationFrame(image)
      image = requestAnimationFrame(() => {
        if (!ancre.current || !bulle.current) return
        const b = bulle.current.getBoundingClientRect()
        setPos(placer(ancre.current.getBoundingClientRect(), { w: b.width, h: b.height }, cote))
      })
    }
    recalculer()
    window.addEventListener('scroll', recalculer, true)
    window.addEventListener('resize', recalculer)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('scroll', recalculer, true)
      window.removeEventListener('resize', recalculer)
    }
  }, [ouvert, ancre, bulle, cote])

  return pos
}

function IcoInfo() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
    </svg>
  )
}

export function Infobulle({ sujet, cote = 'bas' }: { sujet: SujetExplication; cote?: Cote }) {
  const { titre, texte } = EXPLICATIONS[sujet]
  const id = useId()
  // 'epingle' : ouverte par un toucher ou un clic, reste ouverte jusqu'à Échap ou un toucher ailleurs
  const [etat, setEtat] = useState<'ferme' | 'survol' | 'epingle'>('ferme')
  const bouton = useRef<HTMLButtonElement>(null)
  const bulle = useRef<HTMLDivElement>(null)
  const minuteur = useRef<number | undefined>(undefined)
  const ouvert = etat !== 'ferme'
  const pos = usePosition(ouvert, bouton, bulle, cote)

  useEffect(() => {
    if (!ouvert) return
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setEtat('ferme')
      bouton.current?.focus()
    }
    const surPointeur = (e: PointerEvent) => {
      const cible = e.target as Node
      if (!bouton.current?.contains(cible) && !bulle.current?.contains(cible)) setEtat('ferme')
    }
    document.addEventListener('keydown', surTouche)
    document.addEventListener('pointerdown', surPointeur)
    return () => {
      document.removeEventListener('keydown', surTouche)
      document.removeEventListener('pointerdown', surPointeur)
    }
  }, [ouvert])

  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  const entrer = () => {
    if (!peutSurvoler()) return
    window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(() => setEtat((e) => (e === 'ferme' ? 'survol' : e)), 120)
  }
  const sortir = () => {
    window.clearTimeout(minuteur.current)
    // petit délai : la souris peut passer du bouton à la bulle sans la fermer
    minuteur.current = window.setTimeout(() => setEtat((e) => (e === 'survol' ? 'ferme' : e)), 180)
  }

  return (
    <>
      <button
        ref={bouton}
        type="button"
        aria-label={`Explication : ${titre}`}
        aria-expanded={ouvert}
        aria-describedby={ouvert ? id : undefined}
        onClick={() => setEtat((e) => (e === 'epingle' ? 'ferme' : 'epingle'))}
        onMouseEnter={entrer}
        onMouseLeave={sortir}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && setEtat((s) => (s === 'ferme' ? 'survol' : s))}
        onBlur={() => setEtat((e) => (e === 'survol' ? 'ferme' : e))}
        className={`relative inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 align-middle transition-colors before:absolute before:-inset-2.5 before:content-[''] ${
          ouvert ? 'bg-accent text-white' : 'bg-transparent text-muted hover:bg-accent-soft hover:text-accent'
        }`}
      >
        <IcoInfo />
      </button>
      {ouvert &&
        createPortal(
          <div
            ref={bulle}
            id={id}
            role="tooltip"
            onMouseEnter={() => window.clearTimeout(minuteur.current)}
            onMouseLeave={sortir}
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            className="bulle-apparition fixed z-[95] w-[min(300px,calc(100vw-24px))] rounded-2xl bg-ink px-4 py-3.5 text-left font-sans shadow-[0_14px_36px_-10px_rgba(17,26,20,0.55)]"
          >
            <p className="m-0 mb-1 text-[13px] font-semibold text-sun">{titre}</p>
            <p className="m-0 text-[15px] leading-[1.5] text-white">{texte}</p>
          </div>,
          document.body,
        )}
    </>
  )
}

/** Bulle courte au survol (souris) ou au focus clavier. `children` reçoit l'id à mettre dans aria-describedby. */
export function Survol({ texte, cote = 'droite', children }: { texte: string; cote?: Cote; children: (idDescription: string) => ReactNode }) {
  const id = useId()
  const [ouvert, setOuvert] = useState(false)
  const ancre = useRef<HTMLSpanElement>(null)
  const bulle = useRef<HTMLDivElement>(null)
  const minuteur = useRef<number | undefined>(undefined)
  const pos = usePosition(ouvert, ancre, bulle, cote)

  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  return (
    <span
      ref={ancre}
      className="block"
      onMouseEnter={() => {
        if (!peutSurvoler()) return
        window.clearTimeout(minuteur.current)
        minuteur.current = window.setTimeout(() => setOuvert(true), 350)
      }}
      onMouseLeave={() => {
        window.clearTimeout(minuteur.current)
        setOuvert(false)
      }}
      onFocus={(e) => (e.target as HTMLElement).matches(':focus-visible') && setOuvert(true)}
      onBlur={() => setOuvert(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOuvert(false)}
    >
      {children(id)}
      {/* Toujours présent (caché) pour les lecteurs d'écran */}
      <span id={id} hidden>
        {texte}
      </span>
      {ouvert &&
        createPortal(
          <div
            ref={bulle}
            aria-hidden="true"
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            className="bulle-apparition pointer-events-none fixed z-[95] w-max max-w-[260px] rounded-xl bg-ink px-3.5 py-2.5 font-sans text-[14px] leading-[1.45] text-white shadow-[0_12px_30px_-10px_rgba(17,26,20,0.55)]"
          >
            {texte}
          </div>,
          document.body,
        )}
    </span>
  )
}
