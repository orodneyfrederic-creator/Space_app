'use client'
// La décision : un grand titre (d'après la règle retenue par le serveur) et UNE phrase d'action.
// C'est l'élément le plus visible de l'accueil du producteur.
import { TITRES_ACTION, TON_ACTION } from '@/lib/etat-sol'
import type { EtatSol } from '@/lib/types'
import { styleVerdict } from '@/lib/verdict'
import { Infobulle } from '../aide/Infobulle'

export default function CarteAction({ etat }: { etat: EtatSol }) {
  const style = styleVerdict(TON_ACTION[etat.codeAction])
  return (
    <section data-visite="action" aria-labelledby="titre-action" className={`flex flex-col gap-2 rounded-3xl px-5 py-5 sm:px-6 sm:py-6 ${style.badge}`}>
      <p className="m-0 text-[13px] font-semibold tracking-wide uppercase opacity-80">Cette semaine</p>
      <div className="flex items-start justify-between gap-3">
        <h2 id="titre-action" className="m-0 font-display text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[30px]">
          {TITRES_ACTION[etat.codeAction]}
        </h2>
        <Infobulle sujet="action" />
      </div>
      <p className="m-0 text-[17px] leading-[1.45] text-ink">{etat.action}</p>
    </section>
  )
}

/** Squelette à la forme de la carte d'action (pendant le chargement). */
export function SqueletteAction() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-3xl bg-line-soft px-5 py-6">
      <div className="h-8 w-3/4 rounded-lg bg-line" />
      <div className="h-4 w-full rounded bg-line" />
      <div className="h-4 w-2/3 rounded bg-line" />
    </div>
  )
}
