'use client'
// Agent flottant de S'STACK, sur le modèle de Linky (CNX LINK) :
// - une bulle en bas à droite sur toutes les pages, qui montre de temps en temps une question utile pour la page ;
// - une fenêtre de discussion : message d'accueil, questions de départ propres à la page, réponses ;
// - réponses rapides écrites à l'avance (avec des liens qui guident vers la bonne page),
//   sinon la question part vers l'agent S'STACK (POST /api/conseil) avec le site choisi ;
// - la conversation est gardée dans l'onglet (sessionStorage) et survit aux changements de page.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { demanderConseil, ErreurApi, getSites } from '@/lib/api'
import { useSiteChoisi } from '@/lib/site-choisi'
import type { Site } from '@/lib/types'
import { IcoEnvoyer, IcoFermer, IcoFleche, IcoGraine, IcoMoins, IcoNouveau } from '../landing/icones'
import { EVENEMENT_OUVRIR_AGENT, type DetailOuverture } from './ouvrir'
import { INVITATIONS, MESSAGE_ACCUEIL, NOM_AGENT, questionsPour, reponseRapide } from './questions'
import TexteAgent from './TexteAgent'

type Message = { id: string; role: 'moi' | 'agent'; texte: string; erreur?: boolean; rapide?: boolean }

const CLE_STOCKAGE = 'sstack:agent-conversation'
/** La page Agent a déjà sa propre discussion complète (micro compris). */
const PAGES_SANS_AGENT = ['/discuter']
/** Pages sans barre d'onglets en bas sur téléphone (la bulle peut descendre). */
const PAGES_SANS_ONGLETS = ['/', '/connexion', '/inscription']
const LONGUEUR_MAX = 1000 // limite du serveur pour une question
const DELAI_PREMIERE_PENSEE_MS = 8_000
const INTERVALLE_PENSEE_MS = 45_000
const DUREE_PENSEE_MS = 6_000

function lireConversation(): Message[] {
  try {
    const valeur: unknown = JSON.parse(window.sessionStorage.getItem(CLE_STOCKAGE) ?? '[]')
    return Array.isArray(valeur) ? (valeur as Message[]) : []
  } catch {
    return []
  }
}

function ecrireConversation(messages: Message[]) {
  try {
    if (messages.length) window.sessionStorage.setItem(CLE_STOCKAGE, JSON.stringify(messages))
    else window.sessionStorage.removeItem(CLE_STOCKAGE)
  } catch {
    // stockage indisponible (navigation privée) : la conversation reste en mémoire
  }
}

let compteur = 0
const nouvelId = () => `m-${Date.now()}-${compteur++}`

/** Une phrase de `phrases` montrée près de la bulle de temps en temps, puis effacée (jamais deux fois de suite la même). */
function usePensee(actif: boolean, phrases: readonly string[]): string | null {
  const [pensee, setPensee] = useState<string | null>(null)
  const refPhrases = useRef(phrases)
  useEffect(() => {
    refPhrases.current = phrases
  })

  useEffect(() => {
    if (!actif) return
    let derniere: string | null = null
    let intervalle: ReturnType<typeof setInterval> | undefined
    let effacement: ReturnType<typeof setTimeout> | undefined
    const choisir = () => {
      const choix = refPhrases.current.filter((p) => p !== derniere)
      if (!choix.length) return
      derniere = choix[Math.floor(Math.random() * choix.length)]
      setPensee(derniere)
      clearTimeout(effacement)
      effacement = setTimeout(() => setPensee(null), DUREE_PENSEE_MS)
    }
    const premiere = setTimeout(() => {
      choisir()
      intervalle = setInterval(choisir, INTERVALLE_PENSEE_MS)
    }, DELAI_PREMIERE_PENSEE_MS)
    return () => {
      clearTimeout(premiere)
      clearTimeout(effacement)
      clearInterval(intervalle)
      setPensee(null)
    }
  }, [actif])

  return actif ? pensee : null
}

function Avatar({ taille = 'petit' }: { taille?: 'petit' | 'grand' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-vif text-white ${taille === 'grand' ? 'size-10' : 'size-7'}`}
    >
      <IcoGraine taille={taille === 'grand' ? 20 : 15} />
    </span>
  )
}

function BulleAgent({ message, surReessai }: { message: Pick<Message, 'texte' | 'erreur' | 'rapide'>; surReessai?: () => void }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <div
        className={`flex max-w-[85%] flex-col gap-2 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(2,69,52,0.08)] ${
          message.erreur ? 'border border-risk-bg bg-white text-risk' : 'bg-white text-encre'
        }`}
      >
        <TexteAgent texte={message.texte} />
        {message.rapide && <span className="self-start rounded-md bg-pale px-2 py-0.5 text-[10px] font-medium text-cnx">Réponse rapide</span>}
        {surReessai && (
          <button
            type="button"
            onClick={surReessai}
            className="min-h-9 cursor-pointer self-start rounded-lg border-0 bg-vif px-3 text-xs font-semibold text-white hover:bg-vif-hover"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  )
}

export default function AgentFlottant() {
  const chemin = usePathname() ?? '/'
  const [siteId] = useSiteChoisi()
  const [ouvert, setOuvert] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [attente, setAttente] = useState(false)
  const [saisie, setSaisie] = useState('')
  const idPanneau = useId()

  const refMessages = useRef<Message[]>([])
  const refCharge = useRef(false)
  const refGeneration = useRef(0) // change quand la conversation est effacée : une réponse en retard est alors ignorée
  const refAttente = useRef(false)
  const refSites = useRef<Site[] | null>(null)
  const refListe = useRef<HTMLDivElement>(null)
  const refChamp = useRef<HTMLTextAreaElement>(null)

  const questions = questionsPour(chemin)
  const pensee = usePensee(!ouvert, [...questions.map((q) => q.texte), ...INVITATIONS])

  const definir = (suivants: Message[]) => {
    refMessages.current = suivants
    setMessages(suivants)
    ecrireConversation(suivants)
  }
  const ajouter = (message: Omit<Message, 'id'>) => definir([...refMessages.current, { ...message, id: nouvelId() }])
  const definirAttente = (valeur: boolean) => {
    refAttente.current = valeur
    setAttente(valeur)
  }

  const siteChoisi = async (): Promise<Site> => {
    refSites.current ??= await getSites()
    const site = refSites.current.find((s) => s.id === siteId) ?? refSites.current[0]
    if (!site) throw new ErreurApi('Aucun site connu pour le moment.')
    return site
  }

  const envoyer = async (brut: string) => {
    const texte = brut.trim().slice(0, LONGUEUR_MAX)
    if (!texte || refAttente.current) return
    const generation = refGeneration.current
    ajouter({ role: 'moi', texte })
    definirAttente(true)
    const rapide = reponseRapide(texte)
    try {
      if (rapide) {
        await new Promise((r) => setTimeout(r, 450))
        if (generation === refGeneration.current) ajouter({ role: 'agent', texte: rapide, rapide: true })
        return
      }
      const site = await siteChoisi()
      const reponse = await demanderConseil({ lat: site.lat, lon: site.lon, nomLieu: site.nom, question: texte })
      if (generation === refGeneration.current) ajouter({ role: 'agent', texte: reponse.texte })
    } catch (erreur) {
      if (generation !== refGeneration.current) return
      ajouter({
        role: 'agent',
        erreur: true,
        texte: erreur instanceof ErreurApi ? erreur.message : "L'agent n'a pas pu répondre. Réessayez dans un instant.",
      })
    } finally {
      if (generation === refGeneration.current) definirAttente(false)
    }
  }

  const ouvrir = (question?: string) => {
    if (!refCharge.current) {
      refCharge.current = true
      definir(lireConversation())
    }
    setOuvert(true)
    if (question) void envoyer(question)
  }

  const effacer = () => {
    refGeneration.current++
    definirAttente(false)
    definir([])
  }

  const reessayer = () => {
    const liste = refMessages.current
    const index = liste.findLastIndex((m) => m.role === 'moi')
    if (index < 0) return
    const question = liste[index].texte
    definir(liste.slice(0, index))
    void envoyer(question)
  }

  // Les boutons « Parler à Mbolo » de l'application ouvrent l'agent par un événement (voir ouvrir.ts).
  const refOuvrir = useRef(ouvrir)
  useEffect(() => {
    refOuvrir.current = ouvrir
  })
  useEffect(() => {
    const surOuverture = (e: Event) => refOuvrir.current((e as CustomEvent<DetailOuverture>).detail?.question)
    window.addEventListener(EVENEMENT_OUVRIR_AGENT, surOuverture)
    return () => window.removeEventListener(EVENEMENT_OUVRIR_AGENT, surOuverture)
  }, [])

  useEffect(() => {
    if (ouvert) refChamp.current?.focus()
  }, [ouvert])

  useEffect(() => {
    const liste = refListe.current
    if (liste) liste.scrollTop = liste.scrollHeight
  }, [messages, attente, ouvert])

  if (PAGES_SANS_AGENT.some((p) => chemin.startsWith(p))) return null

  const soumettre = () => {
    if (!saisie.trim() || attente) return
    void envoyer(saisie)
    setSaisie('')
  }
  const surTouche = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      soumettre()
    }
  }

  const bas = PAGES_SANS_ONGLETS.includes(chemin) ? 'bottom-5 sm:bottom-6' : 'bottom-[calc(env(safe-area-inset-bottom)+84px)] lg:bottom-6'
  const penseeEstQuestion = pensee !== null && questions.some((q) => q.texte === pensee)
  const derniere = messages.at(-1)

  return (
    <>
      {!ouvert && (
        <div className={`fixed right-4 z-[60] flex items-end gap-3 sm:right-6 ${bas}`}>
          {pensee && (
            <button
              type="button"
              onClick={() => ouvrir(penseeEstQuestion ? pensee : undefined)}
              className="mb-2 hidden max-w-[260px] cursor-pointer rounded-2xl rounded-br-md border-0 bg-encre px-4 py-2.5 text-left text-sm leading-snug text-white shadow-xl sm:block"
            >
              {pensee}
            </button>
          )}
          <button
            type="button"
            onClick={() => ouvrir()}
            aria-expanded={false}
            aria-controls={idPanneau}
            aria-label={`Ouvrir ${NOM_AGENT}, l'assistant S'STACK`}
            className="relative flex size-14 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-vif text-white shadow-[0_10px_30px_-8px_rgba(2,69,52,0.6)] transition-transform hover:scale-105"
          >
            <IcoGraine taille={24} />
            <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-sun" />
          </button>
        </div>
      )}

      {ouvert && (
        <div
          id={idPanneau}
          role="dialog"
          aria-label={`Discussion avec ${NOM_AGENT}, l'assistant S'STACK`}
          onKeyDown={(e) => e.key === 'Escape' && setOuvert(false)}
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(2,69,52,0.45)] sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100svh-3rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-[#D9E3DD]"
        >
          <header className="flex items-center gap-3 bg-profond px-4 py-3 text-white">
            <Avatar taille="grand" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="m-0 font-display text-base font-bold">{NOM_AGENT}</p>
              <p className="m-0 truncate text-xs text-white/70">Assistant S&apos;STACK · guide et conseils NASA</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={effacer}
                aria-label="Nouvelle conversation"
                title="Nouvelle conversation"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-white hover:bg-white/10"
              >
                <IcoNouveau />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label={`Réduire ${NOM_AGENT} (la conversation est gardée)`}
              title="Réduire"
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-white hover:bg-white/10"
            >
              <IcoMoins />
            </button>
            <button
              type="button"
              onClick={() => {
                effacer()
                setOuvert(false)
              }}
              aria-label={`Fermer ${NOM_AGENT} et effacer la conversation`}
              title="Fermer"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-vif text-white hover:bg-vif-hover"
            >
              <IcoFermer />
            </button>
          </header>

          <div ref={refListe} role="log" aria-live="polite" aria-label={`Conversation avec ${NOM_AGENT}`} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-pale px-4 py-4">
            <BulleAgent message={{ texte: MESSAGE_ACCUEIL }} />
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 pl-9">
                {questions.map((q) => (
                  <button
                    key={q.texte}
                    type="button"
                    onClick={() => void envoyer(q.texte)}
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D9E3DD] bg-white px-3.5 py-2 text-left text-sm text-encre transition-colors hover:border-cnx hover:text-cnx"
                  >
                    {q.texte}
                    <span className="text-cnx"><IcoFleche taille={14} /></span>
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) =>
              m.role === 'moi' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="m-0 max-w-[85%] rounded-2xl rounded-tr-md bg-vif px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white">{m.texte}</p>
                </div>
              ) : (
                <BulleAgent key={m.id} message={m} surReessai={m.erreur && m === derniere && !attente ? reessayer : undefined} />
              ),
            )}
            {attente && (
              <div className="flex items-center gap-2" role="status">
                <Avatar />
                <span className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} aria-hidden="true" className="size-1.5 animate-bounce rounded-full bg-cnx" style={{ animationDelay: `${d}ms` }} />
                  ))}
                  <span className="sr-only">{NOM_AGENT} prépare sa réponse…</span>
                </span>
              </div>
            )}
          </div>

          <form
            className="flex flex-col gap-2 border-t border-[#D9E3DD] bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault()
              soumettre()
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${idPanneau}-champ`} className="sr-only">Votre question</label>
              <textarea
                id={`${idPanneau}-champ`}
                ref={refChamp}
                rows={1}
                value={saisie}
                maxLength={LONGUEUR_MAX}
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={surTouche}
                placeholder="Écrivez votre question"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-[#D9E3DD] bg-pale px-3.5 py-2.5 font-sans text-sm text-encre outline-none placeholder:text-ardoise focus:border-cnx focus:bg-white"
              />
              <button
                type="submit"
                disabled={!saisie.trim() || attente}
                aria-label="Envoyer"
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-vif text-white hover:bg-vif-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IcoEnvoyer />
              </button>
            </div>
            <p className="m-0 text-[11px] leading-snug text-ardoise">
              Ne partagez pas de données personnelles. Micro et conversation complète :{' '}
              <Link href="/discuter" className="font-semibold text-cnx">page Agent</Link>.
            </p>
          </form>
        </div>
      )}
    </>
  )
}
