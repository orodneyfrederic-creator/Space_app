// Petits composants communs : en-tête de page, panneau, badge de verdict, états chargement / erreur.
import type { ReactNode } from 'react'
import type { Verdict } from '@/lib/types'
import { styleVerdict } from '@/lib/verdict'

export function EnTetePage({ titre, sousTitre, actions }: { titre: string; sousTitre?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 font-display text-[28px] leading-tight font-bold tracking-[-0.5px] md:text-[34px]">{titre}</h1>
        {sousTitre && <p className="m-0 text-sm text-muted md:text-[15px]">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Panneau({
  titre,
  etiquette,
  children,
  className = '',
}: {
  titre?: string
  etiquette?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-4 rounded-[20px] bg-surface p-5 md:p-6 ${className}`}>
      {(titre || etiquette) && (
        <div className="flex items-center justify-between gap-3">
          {titre && <h2 className="m-0 font-display text-lg font-semibold">{titre}</h2>}
          {etiquette}
        </div>
      )}
      {children}
    </section>
  )
}

export function EtiquetteNasa({ texte = 'NASA POWER' }: { texte?: string }) {
  return <span className="shrink-0 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold text-info-ink">{texte}</span>
}

export function BadgeVerdict({ verdict, taille = 'normale' }: { verdict: Verdict | null; taille?: 'normale' | 'grande' }) {
  const s = styleVerdict(verdict)
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap ${s.badge} ${
        taille === 'grande' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {s.libelle}
    </span>
  )
}

export function Chargement({ texte = 'Chargement des données NASA…', hauteur = 'h-40' }: { texte?: string; hauteur?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex ${hauteur} flex-col items-center justify-center gap-3 rounded-[20px] bg-surface p-6`}>
      <span aria-hidden="true" className="size-7 animate-spin rounded-full border-[3px] border-line border-t-accent" />
      <span className="text-sm text-muted">{texte}</span>
    </div>
  )
}

export function Erreur({ message, onReessayer }: { message: string; onReessayer?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] border border-risk-bg bg-surface p-5">
      <p className="m-0 font-display text-base font-semibold text-risk">Impossible d&apos;afficher ces données</p>
      <p className="m-0 text-sm text-muted-2">{message}</p>
      {onReessayer && (
        <button
          type="button"
          onClick={onReessayer}
          className="min-h-11 cursor-pointer rounded-xl border-none bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

/** Une valeur chiffrée avec son libellé (chiffres en JetBrains Mono, comme le veut la charte). */
export function Tuile({ libelle, valeur, unite, detail }: { libelle: string; valeur: string; unite?: string; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[14px] bg-paper p-3.5">
      <span className="text-xs text-muted">{libelle}</span>
      <span className="font-mono text-2xl font-bold">
        {valeur}
        {unite && <span className="ml-1 text-[13px] font-normal">{unite}</span>}
      </span>
      {detail && <span className="text-xs text-muted">{detail}</span>}
    </div>
  )
}
