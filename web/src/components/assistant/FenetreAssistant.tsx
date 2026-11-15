'use client'
// MODULE 06 — Fenêtre de l'assistant intelligent : question écrite, vocale ou avec une photo,
// réponse du vrai agent S'STACK (données NASA du site choisi), sources consultées et action à confirmer.
// La photo n'est pas encore envoyée au serveur (pas d'analyse d'image côté agent) : la réponse se base
// sur la description, et tout diagnostic est présenté comme une hypothèse à vérifier.
import { useEffect, useRef, useState } from 'react'
import {
  ajouterAuJournal,
  consultations,
  nouvelId,
  proposerAction,
  TYPES_ACCEPTES,
  verifierFichier,
  type MessageAssistant,
} from '@/lib/assistant'
import { demanderConseil, envoyerVocal, ErreurApi } from '@/lib/api'
import type { ReponseAgent, Site } from '@/lib/types'
import BoutonMicro from '../discussion/BoutonMicro'
import { ArrowIcon, DocIcon, PaperclipIcon } from '../icons'
import { IcoFermer } from '../landing/icones'
import BulleMessage from './BulleMessage'

const LONGUEUR_MAX = 1000 // limite du serveur pour une question
const SYMPTOMES = /tache|jaun|fletri|pourri|insecte|chenille|maladie|feuilles? (seche|brul)|mosaique|champignon/

const SUGGESTIONS = [
  'Est-ce que je peux planter mon manioc cette semaine ?',
  'Explique-moi l’état de mon sol',
  'Mes feuilles de manioc jaunissent, que faire ?',
]

type Piece = { fichier: File; apercuUrl?: string }
type Props = { site: Site; questionInitiale?: string; onConseil?: () => void }

const sansAccents = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function FenetreAssistant({ site, questionInitiale = '', onConseil }: Props) {
  const [messages, setMessages] = useState<MessageAssistant[]>([])
  const [texte, setTexte] = useState(questionInitiale)
  const [piece, setPiece] = useState<Piece | null>(null)
  const [attente, setAttente] = useState(false)
  const fil = useRef<HTMLDivElement>(null)
  const champFichier = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [messages, attente])

  const ajouter = (...nouveaux: MessageAssistant[]) => setMessages((m) => [...m, ...nouveaux])
  const erreur = (t: string) => ajouter({ id: nouvelId('err'), role: 'erreur', texte: t })
  const lieu = { lat: site.lat, lon: site.lon, nomLieu: site.nom }

  function choisirFichier(f: File | undefined) {
    if (!f) return
    const probleme = verifierFichier(f)
    if (probleme) {
      erreur(probleme)
      if (champFichier.current) champFichier.current.value = ''
      return
    }
    retirerPiece()
    setPiece({ fichier: f, apercuUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined })
  }

  function retirerPiece() {
    if (piece?.apercuUrl) URL.revokeObjectURL(piece.apercuUrl)
    setPiece(null)
    if (champFichier.current) champFichier.current.value = ''
  }

  /** Appelle l'agent, puis ajoute sa réponse avec les sources consultées et l'éventuelle action. */
  async function traiter(appel: () => Promise<ReponseAgent>, contexte: { question?: string; jointe?: Piece; vocal: boolean }) {
    setAttente(true)
    try {
      const r = await appel()
      const question = contexte.question ?? r.transcription ?? ''
      if (contexte.vocal && r.transcription) ajouter({ id: nouvelId('msg'), role: 'moi', texte: r.transcription, vocal: true })
      const photo = contexte.jointe?.fichier.type.startsWith('image/')
      ajouter({
        id: nouvelId('msg'),
        role: 'agent',
        texte: r.texte,
        consultations: consultations(r, site),
        hypothese: Boolean(photo) || SYMPTOMES.test(sansAccents(question)),
        noteJointe: contexte.jointe
          ? photo
            ? 'La photo n’est pas encore analysée automatiquement : la réponse se base sur votre description.'
            : 'Le document n’est pas encore lu par l’agent : la réponse se base sur votre message.'
          : undefined,
        action: proposerAction(question, r, site),
      })
      onConseil?.()
    } catch (e) {
      erreur(e instanceof ErreurApi ? e.message : 'Une erreur inattendue est survenue.')
    } finally {
      setAttente(false)
    }
  }

  function envoyerTexte(brut: string) {
    const question = brut.trim().slice(0, LONGUEUR_MAX)
    if (attente) return
    if (!question) {
      if (piece) erreur('Décrivez en quelques mots ce que montre votre fichier : l’agent répond à partir de votre description.')
      return
    }
    const jointe = piece ?? undefined
    ajouter({
      id: nouvelId('msg'),
      role: 'moi',
      texte: question,
      pieceJointe: jointe ? { nom: jointe.fichier.name, type: jointe.fichier.type, apercuUrl: jointe.apercuUrl } : undefined,
    })
    setTexte('')
    setPiece(null) // l'aperçu reste affiché dans la bulle envoyée
    if (champFichier.current) champFichier.current.value = ''
    void traiter(() => demanderConseil({ ...lieu, question }), { question, jointe, vocal: false })
  }

  function decider(messageId: string, decision: 'confirmer' | 'annuler') {
    const message = messages.find((m) => m.id === messageId)
    if (message?.role !== 'agent' || !message.action || message.action.statut !== 'proposee') return
    const statut = decision === 'confirmer' ? 'enregistree' : 'annulee'
    const action = { ...message.action, statut } as const
    setMessages((liste) => liste.map((m) => (m.id === messageId && m.role === 'agent' ? { ...m, action } : m)))
    ajouterAuJournal({ id: action.id, date: new Date().toISOString(), titre: action.titre, siteId: action.siteId, statut })
  }

  return (
    <div className="flex h-[calc(100dvh-19rem)] min-h-[440px] flex-col overflow-hidden rounded-[20px] bg-surface md:h-[calc(100dvh-16rem)]">
      <div ref={fil} className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 md:p-6" aria-live="polite">
        <div className="max-w-[88%] self-start rounded-[18px_18px_18px_4px] bg-paper p-3.5 text-[15px] leading-normal">
          Bonjour ! Je connais les données <strong>NASA POWER</strong> et le sol de <strong>{site.nom}</strong>. Posez votre
          question à l&apos;écrit ou au micro, ou joignez une photo de vos plants en la décrivant.
        </div>

        {messages.map((m) => (
          <BulleMessage key={m.id} message={m} onDecision={decider} />
        ))}

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

      {piece && (
        <div className="flex shrink-0 items-center gap-2.5 border-t border-line-soft px-4 pt-2.5 md:px-5">
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
            <IcoFermer />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          envoyerTexte(texte)
        }}
        className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface p-3 md:px-5"
      >
        <input
          ref={champFichier}
          id="assistant-piece"
          type="file"
          accept={TYPES_ACCEPTES.join(',')}
          className="sr-only"
          onChange={(e) => choisirFichier(e.target.files?.[0])}
        />
        <label
          htmlFor="assistant-piece"
          aria-label="Joindre une photo ou un document"
          title="Joindre une photo ou un PDF (10 Mo max)"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-accent"
        >
          <PaperclipIcon />
        </label>
        <label htmlFor="assistant-message" className="sr-only">
          Votre message
        </label>
        <input
          id="assistant-message"
          type="text"
          autoComplete="off"
          maxLength={LONGUEUR_MAX}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={piece ? 'Décrivez ce que montre la photo…' : 'Posez votre question…'}
          className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 font-sans text-[15px] text-ink"
        />
        <BoutonMicro
          desactive={attente}
          onEnregistrement={(audio) => void traiter(() => envoyerVocal(audio, lieu), { vocal: true })}
          onErreur={erreur}
        />
        <button
          type="submit"
          disabled={attente || !texte.trim()}
          aria-label="Envoyer"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowIcon />
        </button>
      </form>
    </div>
  )
}
