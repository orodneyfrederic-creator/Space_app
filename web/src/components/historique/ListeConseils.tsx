// Liste des conseils donnés (web et Telegram).
// TODO (front-end) : filtres par parcelle et par canal.
import type { Conseil } from '@/lib/types'

const CANAUX = {
  web: { label: 'Web', classe: 'bg-accent-soft text-accent' },
  telegram: { label: 'Telegram', classe: 'bg-info-soft text-info-ink' },
} as const

export default function ListeConseils({ conseils }: { conseils: Conseil[] }) {
  if (!conseils.length) {
    return <p className="m-0 rounded-2xl bg-surface p-4 text-sm text-muted">Aucun conseil pour le moment.</p>
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {conseils.map((c) => {
        const canal = CANAUX[c.canal]
        return (
          <li key={c.id} className="flex flex-col gap-2 rounded-[18px] bg-surface px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">
                {new Date(c.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${canal.classe}`}>{canal.label}</span>
            </div>
            <p className="m-0 font-display text-[15px] font-semibold">{c.question}</p>
            <p className="m-0 text-[13px] leading-[1.45] text-muted-2">{c.reponse}</p>
          </li>
        )
      })}
    </ul>
  )
}
