// Une bulle de l'assistant : message du producteur (avec sa pièce jointe), réponse de l'agent
// (sources réellement consultées, badge « hypothèse », action à confirmer) ou erreur.
import type { MessageAssistant } from '@/lib/assistant'
import TexteAgent from '../agent/TexteAgent'
import { DocIcon, ToolIcon } from '../icons'
import CarteAction from './CarteAction'

type Props = { message: MessageAssistant; onDecision: (messageId: string, decision: 'confirmer' | 'annuler') => void }

export default function BulleMessage({ message: m, onDecision }: Props) {
  if (m.role === 'moi') {
    const piece = m.pieceJointe
    return (
      <div className="flex max-w-[80%] flex-col gap-2 self-end rounded-[18px_18px_4px_18px] bg-accent px-3.5 py-3 text-[15px] leading-[1.45] text-white">
        {piece?.apercuUrl ? (
          // URL locale (blob:) : next/image n'apporte rien ici
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.apercuUrl} alt={`Photo jointe : ${piece.nom}`} className="max-h-56 w-full rounded-xl object-cover" />
        ) : (
          piece && (
            <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-2 text-[13px]">
              <DocIcon /> {piece.nom}
            </span>
          )
        )}
        {m.vocal && <span className="block text-xs font-semibold opacity-85">🎙️ J&apos;ai compris :</span>}
        {m.texte && <p className="m-0 whitespace-pre-line">{m.texte}</p>}
      </div>
    )
  }

  if (m.role === 'erreur') {
    return (
      <div role="alert" className="max-w-[88%] self-start rounded-2xl border border-risk-bg bg-risk-bg/40 p-3.5 text-sm text-risk">
        {m.texte}
      </div>
    )
  }

  return (
    <div className="flex max-w-[92%] flex-col gap-2.5 self-start rounded-[18px_18px_18px_4px] bg-paper p-3.5 text-[15px] leading-relaxed">
      <details className="group rounded-xl bg-info-soft px-3 py-2 text-[12px] text-info-ink">
        <summary className="flex min-h-6 cursor-pointer list-none items-center gap-1.5 font-semibold">
          <ToolIcon />
          Données consultées ({m.consultations.length})
          <span aria-hidden="true" className="ml-auto transition-transform group-open:rotate-90">›</span>
        </summary>
        <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0">
          {m.consultations.map((c) => (
            <li key={c.libelle} className="flex flex-col">
              <span className="font-medium">✓ {c.libelle}</span>
              <span className="opacity-85">{c.detail}</span>
            </li>
          ))}
        </ul>
      </details>

      {m.hypothese && (
        <p role="note" className="m-0 rounded-xl bg-warn-bg px-3 py-2 text-[12px] font-semibold text-warn-ink">
          Diagnostic indicatif : c&apos;est une hypothèse, à vérifier sur le terrain avec un agent technique.
        </p>
      )}

      <TexteAgent texte={m.texte} />

      {m.noteJointe && <p className="m-0 text-xs text-muted-2">{m.noteJointe}</p>}

      {m.action && <CarteAction action={m.action} onDecision={(d) => onDecision(m.id, d)} />}

      <span className="text-[11px] text-muted">Conseil à valider avec un agronome · données NASA POWER</span>
    </div>
  )
}
