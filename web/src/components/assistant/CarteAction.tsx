// Aperçu d'une écriture proposée par l'agent : rien n'est enregistré sans « Confirmer ».
import type { ActionProposee, StatutAction } from '@/lib/types'
import { CheckIcon, CloseIcon } from '../icons'

export const STATUTS: Record<StatutAction, { label: string; classe: string }> = {
  proposee: { label: 'En attente', classe: 'bg-warn-bg text-warn-ink' },
  confirmee: { label: 'Confirmée', classe: 'bg-accent-soft text-accent' },
  executee: { label: 'Enregistrée', classe: 'bg-accent-soft text-accent' },
  annulee: { label: 'Annulée', classe: 'bg-track text-muted' },
  echec: { label: 'Échec', classe: 'bg-risk-bg text-risk' },
}

type Props = {
  action: ActionProposee
  enCours: boolean
  onDecision: (decision: 'confirmer' | 'annuler') => void
}

export default function CarteAction({ action, enCours, onDecision }: Props) {
  const statut = STATUTS[action.statut]
  const enAttente = action.statut === 'proposee'

  return (
    <section
      aria-label={`Action proposée : ${action.titre}`}
      className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-paper p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 font-display text-[15px] font-semibold">{action.titre}</h3>
        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${statut.classe}`}>
          {statut.label}
        </span>
      </div>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
        {action.details.map((d) => (
          <div key={d.label} className="contents">
            <dt className="text-muted">{d.label}</dt>
            <dd className="m-0 font-medium">{d.valeur}</dd>
          </div>
        ))}
      </dl>

      {enAttente && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={enCours}
              onClick={() => onDecision('confirmer')}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none bg-accent text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
            >
              <CheckIcon /> Confirmer
            </button>
            <button
              type="button"
              disabled={enCours}
              onClick={() => onDecision('annuler')}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60"
            >
              <CloseIcon /> Annuler
            </button>
          </div>
          <p className="m-0 text-[11px] text-muted">Rien n&apos;est enregistré sans votre confirmation.</p>
        </>
      )}
    </section>
  )
}
