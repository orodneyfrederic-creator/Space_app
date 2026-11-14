'use client'
// Fenêtre de discussion avec l'agent (texte + bouton micro).
// TODO (front-end) :
//  1. Garder la liste des messages dans un useState (producteur / agent).
//  2. À l'envoi : appeler demanderConseil() de lib/api.ts (en attendant le serveur, simuler une réponse).
//  3. Afficher « Je réfléchis… » pendant l'attente (l'agent met 2 à 5 secondes).
//  4. Brancher BoutonMicro : l'audio enregistré part vers envoyerVocal().
import { useState } from 'react'
import type { Parcelle } from '@/lib/types'
import BoutonMicro from './BoutonMicro'

type Message = { auteur: 'producteur' | 'agent'; texte: string }

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
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm">Parcelle : {parcelle.nom}</p>
      <div className="flex min-h-40 flex-col gap-2">
        {messages.map((m, i) => (
          <p key={i} className={m.auteur === 'producteur' ? 'self-end' : 'self-start'}>
            {m.texte}
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && envoyer()}
          placeholder="Posez votre question…"
        />
        <BoutonMicro onEnregistrement={() => { /* TODO : envoyerVocal(audio, parcelle) */ }} />
        <button type="button" className="rounded border px-4" onClick={envoyer}>
          Envoyer
        </button>
      </div>
    </div>
  )
}
