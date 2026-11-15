// Onglet « Historique » de l'assistant : conversations passées et journal des actions.
import Link from 'next/link'
import type { ConversationAssistant, JournalAction, Parcelle } from '@/lib/types'
import { STATUTS } from './CarteAction'

type Props = {
  conversations: ConversationAssistant[]
  journal: JournalAction[]
  parcelles: Parcelle[]
}

const dateCourte = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

export default function HistoriqueAssistant({ conversations, journal, parcelles }: Props) {
  const nomParcelle = (id: string | null) => parcelles.find((p) => p.id === id)?.nom ?? 'Toutes parcelles'

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto px-5 py-4">
      <section aria-labelledby="hist-conv" className="flex flex-col gap-2.5">
        <h2 id="hist-conv" className="m-0 font-display text-[17px] font-semibold">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="m-0 rounded-2xl bg-surface p-4 text-sm text-muted">Aucune conversation pour le moment.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {conversations.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 rounded-[18px] bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{dateCourte(c.date)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      c.canal === 'telegram' ? 'bg-info-soft text-info-ink' : 'bg-accent-soft text-accent'
                    }`}
                  >
                    {c.canal === 'telegram' ? 'Telegram' : 'Web'}
                  </span>
                </div>
                <p className="m-0 font-display text-[15px] font-semibold">{c.titre}</p>
                <span className="text-xs text-muted">
                  {nomParcelle(c.parcelleId)} · {c.nbMessages} messages
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hist-actions" className="flex flex-col gap-2.5">
        <h2 id="hist-actions" className="m-0 font-display text-[17px] font-semibold">Journal des actions</h2>
        {journal.length === 0 ? (
          <p className="m-0 rounded-2xl bg-surface p-4 text-sm text-muted">Aucune action pour le moment.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {journal.map((a) => {
              const statut = STATUTS[a.statut]
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{a.titre}</span>
                    <span className="text-xs text-muted">
                      {nomParcelle(a.parcelleId)} · {dateCourte(a.date)}
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statut.classe}`}>
                    {statut.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Link href="/historique" className="text-[13px] font-semibold text-accent no-underline hover:text-accent-hover">
        Voir tous les conseils reçus (web et Telegram) →
      </Link>
    </div>
  )
}
