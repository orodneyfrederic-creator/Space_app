// Liste des conseils donnés (web et Telegram).
// TODO (front-end) : filtres par parcelle et par canal, date en français (toLocaleDateString('fr-FR')).
import type { Conseil } from '@/lib/types'

export default function ListeConseils({ conseils }: { conseils: Conseil[] }) {
  if (!conseils.length) return <p>Aucun conseil pour le moment.</p>
  return (
    <ul className="flex flex-col gap-3">
      {conseils.map((c) => (
        <li key={c.id} className="rounded-xl border p-4">
          <p className="text-xs">
            {new Date(c.date).toLocaleString('fr-FR')} · {c.canal}
          </p>
          <p className="font-semibold">{c.question}</p>
          <p>{c.reponse}</p>
        </li>
      ))}
    </ul>
  )
}
