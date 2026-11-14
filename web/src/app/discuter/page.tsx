// Page /discuter : poser une question à l'agent, à l'écrit ou au micro.
// TODO (front-end) : permettre de choisir la parcelle (liste ou clic sur la carte).
import Link from 'next/link'
import { ClockIcon } from '@/components/icons'
import FenetreDiscussion from '@/components/discussion/FenetreDiscussion'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

export default function PageDiscuter() {
  const parcelle = PARCELLES_DEMO[0]
  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line-soft px-5 pt-14 pb-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.4px]">Parler à l&apos;agent</h1>
          <span className="text-[13px] text-muted">Parcelle : {parcelle.nom}</span>
        </div>
        <Link
          href="/historique"
          aria-label="Historique des conseils"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent"
        >
          <ClockIcon />
        </Link>
      </header>
      <FenetreDiscussion parcelle={parcelle} />
    </>
  )
}
