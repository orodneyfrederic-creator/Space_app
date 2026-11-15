// Aperçu d'une action proposée par l'assistant : rien n'est enregistré sans « Confirmer ».
import type { ActionProposee, StatutAction } from '@/lib/assistant'
import { IcoCoche, IcoFermer } from '../landing/icones'

export const STATUTS: Record<StatutAction, { label: string; classe: string }> = {
  proposee: { label: 'En attente', classe: 'bg-warn-bg text-warn-ink' },
  enregistree: { label: 'Enregistrée', classe: 'bg-accent-soft text-accent' },
  annulee: { label: 'Annulée', classe: 'bg-line-soft text-muted-2' },
}

type Props = { action: ActionProposee; onDecision: (decision: 'confirmer' | 'annuler') => void }

export default function CarteAction({ action, onDecision }: Props) {
  const statut = STATUTS[action.statut]
  return (
    <section aria-label={`Action proposée : ${action.titre}`} className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 font-display text-[15px] font-semibold">{action.titre}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statut.classe}`}>{statut.label}</span>
      </div>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        {action.details.map((d) => (
          <div key={d.label} className="contents">
            <dt className="text-muted">{d.label}</dt>
            <dd className="m-0 font-medium">{d.valeur}</dd>
          </div>
        ))}
      </dl>
      {action.statut === 'proposee' && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDecision('confirmer')}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none bg-accent text-sm font-semibold text-white hover:bg-accent-hover"
            >
              <IcoCoche /> Confirmer
            </button>
            <button
              type="button"
              onClick={() => onDecision('annuler')}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink"
            >
              <IcoFermer taille={14} /> Annuler
            </button>
          </div>
          <p className="m-0 text-[11px] text-muted">Rien n&apos;est enregistré sans votre confirmation. Le journal est gardé sur cet appareil.</p>
        </>
      )}
    </section>
  )
}
