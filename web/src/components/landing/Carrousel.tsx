'use client'
// Carrousel horizontal : défilement natif (doigt, molette, clavier) + flèches précédent / suivant.
import { useRef, type ReactNode } from 'react'
import { IcoFleche, IcoFlecheGauche } from './icones'

export function Fleches({ onPrecedent, onSuivant, etiquette }: { onPrecedent: () => void; onSuivant: () => void; etiquette: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrecedent}
        aria-label={`${etiquette} : précédent`}
        className="flex size-12 cursor-pointer items-center justify-center rounded-[10px] border border-cnx bg-transparent text-cnx transition-colors hover:bg-pale"
      >
        <IcoFlecheGauche />
      </button>
      <button
        type="button"
        onClick={onSuivant}
        aria-label={`${etiquette} : suivant`}
        className="flex size-12 cursor-pointer items-center justify-center rounded-[10px] border border-vif bg-vif text-white transition-colors hover:bg-vif-hover"
      >
        <IcoFleche />
      </button>
    </div>
  )
}

/**
 * `fleches` : « haut » les place à droite de l'en-tête, « bas » les centre sous la liste.
 * Les enfants doivent être des <li>.
 */
export default function Carrousel({
  etiquette,
  entete,
  fleches = 'haut',
  children,
}: {
  etiquette: string
  entete?: ReactNode
  fleches?: 'haut' | 'bas'
  children: ReactNode
}) {
  const piste = useRef<HTMLUListElement>(null)
  const defiler = (sens: 1 | -1) => {
    const el = piste.current
    if (!el) return
    el.scrollBy({ left: sens * Math.max(el.clientWidth * 0.8, 280), behavior: 'smooth' })
  }
  const boutons = <Fleches etiquette={etiquette} onPrecedent={() => defiler(-1)} onSuivant={() => defiler(1)} />

  return (
    <div className="flex flex-col gap-10">
      {fleches === 'haut' ? (
        <div className="flex flex-wrap items-end justify-between gap-6">
          {entete}
          {boutons}
        </div>
      ) : (
        entete
      )}
      <ul
        ref={piste}
        aria-label={etiquette}
        tabIndex={0}
        className="sans-barre m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth p-0"
      >
        {children}
      </ul>
      {fleches === 'bas' && <div className="flex justify-center">{boutons}</div>}
    </div>
  )
}
