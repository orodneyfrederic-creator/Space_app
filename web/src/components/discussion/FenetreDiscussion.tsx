'use client'
// Fenêtre de discussion avec l'agent (texte + bouton micro).
// TODO (front-end) :
//  1. À l'envoi : appeler demanderConseil() de lib/api.ts (en attendant le serveur, réponse simulée).
//  2. Afficher « Je réfléchis… » pendant l'attente (l'agent met 2 à 5 secondes).
//  3. Brancher BoutonMicro : l'audio enregistré part vers envoyerVocal().
import { useState } from 'react'
import type { Parcelle } from '@/lib/types'
import { ArrowIcon } from '../icons'
import BoutonMicro from './BoutonMicro'

type Message = { auteur: 'producteur' | 'agent'; texte: string }

const SUGGESTIONS = ['Quand semer le manioc ?', 'Mon sol est-il trop humide ?', 'Quelle culture pour janvier ?']

export default function FenetreDiscussion({ parcelle }: { parcelle: Parcelle }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')

  function envoyer() {
    if (!question.trim()) return
    // TODO : remplacer par l'appel à demanderConseil({ lat, lon, nomLieu, culture, question })
    setMessages((m) => [...m, { auteur: 'producteur', texte: question }, { auteur: 'agent', texte: '(réponse de démonstration)' }])
    setQuestion('')
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-3.5 overflow-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex max-w-[88%] flex-col gap-2 self-start rounded-[18px_18px_18px_4px] bg-surface p-3.5">
            <p className="m-0 text-sm leading-normal">
              Bonjour ! Je réponds à partir des données <strong>NASA POWER</strong> pour la parcelle de{' '}
              <strong>{parcelle.nom}</strong>. Posez votre question, à l&apos;écrit ou au micro.
            </p>
          </div>
        )}

        {messages.map((m, i) =>
          m.auteur === 'producteur' ? (
            <div
              key={i}
              className="max-w-[80%] self-end rounded-[18px_18px_4px_18px] bg-accent px-3.5 py-3 text-sm leading-[1.45] text-white"
            >
              {m.texte}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[88%] self-start rounded-[18px_18px_18px_4px] bg-surface p-3.5 text-sm leading-normal"
            >
              {m.texte}
            </div>
          ),
        )}

        <div className="mt-auto flex flex-col gap-2">
          <span className="text-xs text-muted">Suggestions</span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuestion(s)}
                className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          envoyer()
        }}
        className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface px-4 py-2.5"
      >
        <label htmlFor="question" className="sr-only">
          Votre question
        </label>
        <input
          id="question"
          type="text"
          autoComplete="off"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question…"
          className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] text-ink"
        />
        <BoutonMicro onEnregistrement={() => { /* TODO : envoyerVocal(audio, parcelle) */ }} />
        <button
          type="submit"
          aria-label="Envoyer la question"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white"
        >
          <ArrowIcon />
        </button>
      </form>
    </>
  )
}
