'use client'
// MODULE 06 — Assistant intelligent : discussion avec l'agent qui connaît les parcelles,
// appelle des outils métier, accepte une photo ou un document, et propose des actions
// à confirmer. Tant que NEXT_PUBLIC_ASSISTANT_API n'est pas « on », les réponses viennent
// du moteur de démonstration (lib/assistant-demo.ts).
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  API_ASSISTANT_PRETE,
  envoyerMessageAssistant,
  listerConversations,
  listerJournalActions,
  repondreAction,
} from '@/lib/api'
import {
  CONVERSATIONS_DEMO,
  JOURNAL_DEMO,
  nouvelId,
  repondreActionDemo,
  repondreDemo,
} from '@/lib/assistant-demo'
import type { ConversationAssistant, JournalAction, MessageAssistant, Parcelle } from '@/lib/types'
import { ArrowIcon, CloseIcon, DocIcon, PaperclipIcon } from '../icons'
import BoutonMicro from '../discussion/BoutonMicro'
import BulleMessage from './BulleMessage'
import HistoriqueAssistant from './HistoriqueAssistant'

const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const TAILLE_MAX = 10 * 1024 * 1024 // 10 Mo

const SUGGESTIONS = ['Puis-je semer cette semaine ?', 'Explique-moi l’état du sol', 'Quelles cultures pour la saison ?', 'Mes parcelles']

type Piece = { fichier: File; apercuUrl?: string }
type Onglet = 'discussion' | 'historique'

export default function FenetreAssistant({ parcelles }: { parcelles: Parcelle[] }) {
  const parametres = useSearchParams()
  const parcelleInitiale = parcelles.some((p) => p.id === parametres.get('parcelle')) ? parametres.get('parcelle') : null

  const [onglet, setOnglet] = useState<Onglet>('discussion')
  const [parcelleId, setParcelleId] = useState<string | null>(parcelleInitiale)
  const [messages, setMessages] = useState<MessageAssistant[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [texte, setTexte] = useState('')
  const [piece, setPiece] = useState<Piece | null>(null)
  const [enAttente, setEnAttente] = useState(false)
  const [actionEnCours, setActionEnCours] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationAssistant[]>(API_ASSISTANT_PRETE ? [] : CONVERSATIONS_DEMO)
  const [journal, setJournal] = useState<JournalAction[]>(API_ASSISTANT_PRETE ? [] : JOURNAL_DEMO)

  const champFichier = useRef<HTMLInputElement>(null)
  const finDiscussion = useRef<HTMLDivElement>(null)
  const parcelle = parcelles.find((p) => p.id === parcelleId) ?? null

  // Historique réel quand le serveur est prêt
  useEffect(() => {
    if (!API_ASSISTANT_PRETE) return
    Promise.all([listerConversations(), listerJournalActions()])
      .then(([c, j]) => {
        setConversations(c)
        setJournal(j)
      })
      .catch(() => setErreur('Impossible de charger l’historique.'))
  }, [])

  // Toujours montrer le dernier message
  useEffect(() => {
    finDiscussion.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, enAttente])

  function choisirFichier(fichier: File | undefined) {
    if (!fichier) return
    if (!TYPES_ACCEPTES.includes(fichier.type)) {
      setErreur('Format non accepté : photo (JPEG, PNG, WebP) ou PDF.')
      return
    }
    if (fichier.size > TAILLE_MAX) {
      setErreur('Fichier trop lourd : 10 Mo maximum.')
      return
    }
    retirerPiece()
    setErreur(null)
    setPiece({ fichier, apercuUrl: fichier.type.startsWith('image/') ? URL.createObjectURL(fichier) : undefined })
  }

  function retirerPiece() {
    if (piece?.apercuUrl) URL.revokeObjectURL(piece.apercuUrl)
    setPiece(null)
    if (champFichier.current) champFichier.current.value = ''
  }

  async function envoyer(question: string) {
    const contenu = question.trim()
    if ((!contenu && !piece) || enAttente) return

    const messageUtilisateur: MessageAssistant = {
      id: nouvelId('msg'),
      role: 'user',
      texte: contenu,
      date: new Date().toISOString(),
      parcelleId,
      pieceJointe: piece
        ? { nom: piece.fichier.name, type: piece.fichier.type, taille: piece.fichier.size, apercuUrl: piece.apercuUrl }
        : undefined,
    }
    const fichier = piece?.fichier
    setMessages((m) => [...m, messageUtilisateur])
    setTexte('')
    setPiece(null) // l'URL d'aperçu reste utilisée par la bulle envoyée
    if (champFichier.current) champFichier.current.value = ''
    setErreur(null)
    setEnAttente(true)

    try {
      const reponse = API_ASSISTANT_PRETE
        ? await envoyerMessageAssistant({ conversationId, message: contenu, parcelleId, pieceJointe: fichier })
        : await repondreDemo({ conversationId, message: contenu, parcelle, pieceJointe: fichier })

      const agent = reponse.message
      setConversationId(reponse.conversationId)
      setMessages((m) => [...m, agent])

      // Historique de session : la conversation en cours remonte en tête
      setConversations((liste) => {
        const existante = liste.find((c) => c.id === reponse.conversationId)
        const aJour: ConversationAssistant = {
          id: reponse.conversationId,
          titre: existante?.titre ?? (contenu || `Pièce jointe : ${fichier?.name}`),
          date: agent.date,
          parcelleId,
          canal: 'web',
          nbMessages: (existante?.nbMessages ?? 0) + 2,
        }
        return [aJour, ...liste.filter((c) => c.id !== reponse.conversationId)]
      })
      const action = agent.action
      if (action) {
        setJournal((j) => [{ id: action.id, date: agent.date, titre: action.titre, parcelleId, statut: action.statut }, ...j])
      }
    } catch {
      setErreur('L’agent n’a pas pu répondre. Vérifiez la connexion et réessayez.')
    } finally {
      setEnAttente(false)
    }
  }

  async function decider(messageId: string, decision: 'confirmer' | 'annuler') {
    const action = messages.find((m) => m.id === messageId)?.action
    if (!action || actionEnCours) return
    setActionEnCours(messageId)
    try {
      const resultat = API_ASSISTANT_PRETE ? await repondreAction(action.id, decision) : await repondreActionDemo(action, decision)
      setMessages((m) => m.map((msg) => (msg.id === messageId ? { ...msg, action: resultat } : msg)))
      setJournal((j) => j.map((a) => (a.id === resultat.id ? { ...a, statut: resultat.statut, date: new Date().toISOString() } : a)))
    } catch {
      setErreur('L’action n’a pas pu être enregistrée. Réessayez.')
    } finally {
      setActionEnCours(null)
    }
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-line-soft px-5 pt-14 pb-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-[-0.4px]">Assistant S&apos;STACK</h1>
          <span className="text-[13px] text-muted">
            {API_ASSISTANT_PRETE ? 'Connaît vos parcelles et vos données' : 'Mode démonstration · réponses simulées'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="parcelle" className="shrink-0 text-[13px] font-medium text-muted">
            Parcelle
          </label>
          <select
            id="parcelle"
            value={parcelleId ?? ''}
            onChange={(e) => setParcelleId(e.target.value || null)}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-ink"
          >
            <option value="">Toutes (aucune sélection)</option>
            {parcelles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>

        <div role="tablist" aria-label="Affichage" className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-segmented p-1">
          {(['discussion', 'historique'] as const).map((o) => (
            <button
              key={o}
              type="button"
              role="tab"
              aria-selected={onglet === o}
              onClick={() => setOnglet(o)}
              className={`min-h-10 cursor-pointer rounded-[10px] border-none text-sm font-semibold ${
                onglet === o ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'bg-transparent text-muted'
              }`}
            >
              {o === 'discussion' ? 'Discussion' : 'Historique'}
            </button>
          ))}
        </div>
      </header>

      {onglet === 'historique' ? (
        <HistoriqueAssistant conversations={conversations} journal={journal} parcelles={parcelles} />
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3.5 overflow-auto px-5 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex max-w-[92%] flex-col gap-2 self-start rounded-[18px_18px_18px_4px] bg-surface p-3.5">
                <p className="m-0 text-sm leading-normal">
                  Bonjour ! Je connais vos parcelles et leurs données <strong>NASA POWER</strong>.{' '}
                  {parcelle ? (
                    <>
                      Nous parlons de <strong>{parcelle.nom}</strong>.
                    </>
                  ) : (
                    <>Choisissez une parcelle en haut pour des conseils précis.</>
                  )}{' '}
                  Vous pouvez aussi m&apos;envoyer une photo de vos plants.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <BulleMessage key={m.id} message={m} actionEnCours={actionEnCours === m.id} onDecision={decider} />
            ))}

            {enAttente && (
              <div className="self-start rounded-[18px_18px_18px_4px] bg-surface px-3.5 py-3 text-sm text-muted">
                Je réfléchis…
              </div>
            )}

            {messages.length === 0 && (
              <div className="mt-auto flex flex-col gap-2">
                <span className="text-xs text-muted">Suggestions</span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => envoyer(s)}
                      className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={finDiscussion} />
          </div>

          {erreur && (
            <p role="alert" className="m-0 shrink-0 bg-risk-bg px-5 py-2 text-[13px] text-risk">
              {erreur}
            </p>
          )}

          {piece && (
            <div className="flex shrink-0 items-center gap-2.5 border-t border-line-soft bg-surface px-4 pt-2.5">
              {piece.apercuUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piece.apercuUrl} alt="" className="size-12 rounded-lg object-cover" />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-lg bg-paper text-accent">
                  <DocIcon />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px]">{piece.fichier.name}</span>
              <button
                type="button"
                onClick={retirerPiece}
                aria-label="Retirer la pièce jointe"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              envoyer(texte)
            }}
            className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface px-4 py-2.5"
          >
            <input
              ref={champFichier}
              id="piece-jointe"
              type="file"
              accept={TYPES_ACCEPTES.join(',')}
              className="sr-only"
              onChange={(e) => choisirFichier(e.target.files?.[0])}
            />
            <label
              htmlFor="piece-jointe"
              aria-label="Joindre une photo ou un document"
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-accent"
            >
              <PaperclipIcon />
            </label>
            <label htmlFor="message" className="sr-only">
              Votre message
            </label>
            <input
              id="message"
              type="text"
              autoComplete="off"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder={piece ? 'Décrivez la photo…' : 'Posez votre question…'}
              className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] text-ink"
            />
            <BoutonMicro onEnregistrement={() => { /* TODO : envoyerVocal puis afficher la réponse */ }} />
            <button
              type="submit"
              disabled={enAttente || (!texte.trim() && !piece)}
              aria-label="Envoyer"
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon />
            </button>
          </form>
        </>
      )}
    </main>
  )
}
