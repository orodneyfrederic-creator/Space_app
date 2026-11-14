'use client'
// Fenêtre de discussion avec l'agent : question écrite ou vocale, réponse fondée sur les données NASA du site.
import { useEffect, useRef, useState } from 'react'
import { demanderConseil, envoyerVocal, ErreurApi } from '@/lib/api'
import type { ReponseAgent, Site } from '@/lib/types'
import { ArrowIcon } from '../icons'
import BoutonMicro from './BoutonMicro'

type Message =
  | { id: number; auteur: 'producteur'; texte: string; vocal?: boolean }
  | { id: number; auteur: 'agent'; texte: string; fournisseur?: string }
  | { id: number; auteur: 'erreur'; texte: string }

// Un message sans son id (Omit appliqué à chaque variante de l'union)
type NouveauMessage = Message extends infer M ? (M extends Message ? Omit<M, 'id'> : never) : never

const SUGGESTIONS = [
  'Est-ce que je peux planter mon manioc cette semaine ?',
  'Cette année est-elle plus sèche que d\'habitude ?',
  'Après mon manioc, que planter pour reposer la terre ?',
]

type Props = { site: Site; questionInitiale?: string; onConseil?: () => void }

export default function FenetreDiscussion({ site, questionInitiale = '', onConseil }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState(questionInitiale)
  const [attente, setAttente] = useState(false)
  const fil = useRef<HTMLDivElement>(null)
  const compteur = useRef(0)

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [messages, attente])

  const ajouter = (...nouveaux: NouveauMessage[]) =>
    setMessages((m) => [...m, ...nouveaux.map((n): Message => ({ ...n, id: ++compteur.current }))])

  const lieu = { lat: site.lat, lon: site.lon, nomLieu: site.nom }

  async function traiter(appel: () => Promise<ReponseAgent>, vocal: boolean) {
    setAttente(true)
    try {
      const r = await appel()
      if (vocal && r.transcription) ajouter({ auteur: 'producteur', texte: r.transcription, vocal: true })
      ajouter({ auteur: 'agent', texte: r.texte, fournisseur: r.fournisseur })
      onConseil?.()
    } catch (erreur) {
      ajouter({ auteur: 'erreur', texte: erreur instanceof ErreurApi ? erreur.message : 'Une erreur inattendue est survenue.' })
    } finally {
      setAttente(false)
    }
  }

  function envoyerTexte(texte: string) {
    const q = texte.trim()
    if (!q || attente) return
    ajouter({ auteur: 'producteur', texte: q })
    setQuestion('')
    void traiter(() => demanderConseil({ ...lieu, question: q }), false)
  }

  return (
    <div className="flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col overflow-hidden rounded-[20px] bg-surface md:h-[calc(100dvh-12rem)]">
      <div ref={fil} className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 md:p-6" aria-live="polite">
        <div className="max-w-[88%] self-start rounded-[18px_18px_18px_4px] bg-paper p-3.5 text-[15px] leading-normal">
          Bonjour ! Je réponds à partir des données <strong>NASA POWER</strong> pour <strong>{site.nom}</strong>. Posez votre
          question à l&apos;écrit, ou appuyez sur le micro pour parler.
        </div>

        {messages.map((m) =>
          m.auteur === 'producteur' ? (
            <div key={m.id} className="max-w-[80%] self-end rounded-[18px_18px_4px_18px] bg-accent px-3.5 py-3 text-[15px] leading-[1.45] text-white">
              {m.vocal && <span className="mb-1 block text-xs font-semibold opacity-85">🎙️ J&apos;ai compris :</span>}
              {m.texte}
            </div>
          ) : m.auteur === 'agent' ? (
            <div key={m.id} className="max-w-[88%] self-start rounded-[18px_18px_18px_4px] bg-paper p-3.5 text-[15px] leading-relaxed whitespace-pre-line">
              {m.texte}
              <span className="mt-2 block text-[11px] text-muted">Conseil à valider avec un agronome · données NASA POWER</span>
            </div>
          ) : (
            <div key={m.id} role="alert" className="max-w-[88%] self-start rounded-2xl border border-risk-bg bg-risk-bg/40 p-3.5 text-sm text-risk">
              {m.texte}
            </div>
          ),
        )}

        {attente && (
          <div role="status" className="flex items-center gap-2.5 self-start rounded-[18px_18px_18px_4px] bg-paper p-3.5 text-sm text-muted-2">
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" />
            S&apos;STACK consulte les données NASA…
          </div>
        )}

        {messages.length === 0 && !attente && (
          <div className="mt-auto flex flex-col gap-2">
            <span className="text-xs text-muted">Suggestions</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => envoyerTexte(s)}
                  className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3.5 text-left text-[13px] font-medium text-ink hover:border-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          envoyerTexte(question)
        }}
        className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface p-3 md:px-5"
      >
        <label htmlFor="question" className="sr-only">
          Votre question
        </label>
        <input
          id="question"
          type="text"
          autoComplete="off"
          maxLength={1000}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question…"
          className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 font-sans text-[15px] text-ink"
        />
        <BoutonMicro
          desactive={attente}
          onEnregistrement={(audio) => void traiter(() => envoyerVocal(audio, lieu), true)}
          onErreur={(texte) => ajouter({ auteur: 'erreur', texte })}
        />
        <button
          type="submit"
          disabled={attente || !question.trim()}
          aria-label="Envoyer la question"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowIcon />
        </button>
      </form>
    </div>
  )
}
