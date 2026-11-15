// Une bulle de la conversation : message du producteur, ou réponse de l'agent avec
// les outils appelés, le badge « hypothèse » des diagnostics et l'action à confirmer.
import type { MessageAssistant } from '@/lib/types'
import { DocIcon, ToolIcon } from '../icons'
import CarteAction from './CarteAction'

type Props = {
  message: MessageAssistant
  actionEnCours: boolean
  onDecision: (messageId: string, decision: 'confirmer' | 'annuler') => void
}

function ApercuPiece({ message }: { message: MessageAssistant }) {
  const piece = message.pieceJointe
  if (!piece) return null
  if (piece.type.startsWith('image/') && piece.apercuUrl) {
    return (
      // URL blob: locale ou URL signée : next/image n'apporte rien ici
      // eslint-disable-next-line @next/next/no-img-element
      <img src={piece.apercuUrl} alt={`Photo jointe : ${piece.nom}`} className="max-h-48 w-full rounded-xl object-cover" />
    )
  }
  return (
    <span className="flex items-center gap-1.5 rounded-xl bg-white/15 px-2.5 py-2 text-[13px]">
      <DocIcon /> {piece.nom}
    </span>
  )
}

export default function BulleMessage({ message, actionEnCours, onDecision }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex max-w-[80%] flex-col gap-2 self-end rounded-[18px_18px_4px_18px] bg-accent px-3.5 py-3 text-sm leading-[1.45] text-white">
        <ApercuPiece message={message} />
        {message.texte && <p className="m-0 whitespace-pre-line">{message.texte}</p>}
      </div>
    )
  }

  const reco = message.recommandation
  return (
    <div className="flex max-w-[92%] flex-col gap-2.5 self-start rounded-[18px_18px_18px_4px] bg-surface p-3.5 text-sm leading-normal">
      {message.outils && message.outils.length > 0 && (
        <details className="group rounded-xl bg-info-soft px-3 py-2 text-[12px] text-info-ink">
          <summary className="flex min-h-6 cursor-pointer list-none items-center gap-1.5 font-semibold">
            <ToolIcon />
            {message.outils.length === 1 ? '1 outil utilisé' : `${message.outils.length} outils utilisés`}
            <span aria-hidden="true" className="ml-auto transition-transform group-open:rotate-90">›</span>
          </summary>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0">
            {message.outils.map((o) => (
              <li key={o.id} className="flex flex-col">
                <span className="font-medium">
                  {o.statut === 'ok' ? '✓' : '✕'} {o.libelle}
                </span>
                <span className="font-mono text-[11px] opacity-80">
                  {o.outil}
                  {o.resume ? ` → ${o.resume}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {reco?.estHypothese && (
        <p role="note" className="m-0 rounded-xl bg-warn-bg px-3 py-2 text-[12px] font-semibold text-warn-ink">
          Diagnostic indicatif — hypothèse à vérifier sur le terrain
          {reco.confiance !== undefined ? ` (confiance ${Math.round(reco.confiance * 100)} %)` : ''}
        </p>
      )}

      <p className="m-0 whitespace-pre-line">{message.texte}</p>

      {message.action && (
        <CarteAction
          action={message.action}
          enCours={actionEnCours}
          onDecision={(decision) => onDecision(message.id, decision)}
        />
      )}

      {reco && reco.sources.length > 0 && (
        <p className="m-0 text-[11px] text-muted">Sources : {reco.sources.join(' · ')}</p>
      )}
    </div>
  )
}
