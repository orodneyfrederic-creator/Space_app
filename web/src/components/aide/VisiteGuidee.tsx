'use client'
// Visite guidée du tableau de bord, pour un producteur, en français facile.
// - Se lance seule à la première visite de /tableau-de-bord (une fois les données NASA affichées),
//   puis à la demande (« Comment ça marche ? », entrée « Visite guidée » du menu).
// - Chaque étape éclaire un élément portant data-visite="…" ; une étape dont l'élément est absent
//   (données en erreur, agent ouvert…) est simplement sautée.
// - La page reste utilisable pendant la visite ; Échap ou « Passer » l'arrête.
import { usePathname } from 'next/navigation'
import { Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { mouvementReduit, placer, trouverCible, type Cote } from './position'
import { EVENEMENT_LANCER_VISITE, marquerVisiteVue, PAGE_VISITE, visiteDejaVue, visiteDemandee } from './visite'

type Etape = { cible?: string; cote?: Cote; titre: string; texte: string }

const ETAPES: readonly Etape[] = [
  {
    titre: 'Bienvenue sur S’STACK',
    texte: 'Cette page vous dit si c’est le bon moment pour semer. On vous montre comment la lire. Cela prend une minute.',
  },
  {
    cible: 'site',
    titre: 'Choisissez votre ville',
    texte: 'Prenez la ville la plus proche de vos champs. Tous les chiffres de la page changent avec elle.',
  },
  {
    cible: 'verdict',
    titre: 'La réponse est ici',
    texte: 'Vert : c’est un bon moment pour semer. Jaune : c’est risqué. Brun : mieux vaut attendre. En dessous, on vous dit pourquoi.',
  },
  {
    cible: 'conditions',
    titre: 'Les chiffres de la pluie',
    texte: 'Ils viennent des satellites de la NASA. Touchez le petit « i » à côté d’un mot pour savoir ce qu’il veut dire.',
  },
  {
    cible: 'sites',
    titre: 'Les autres villes',
    texte: 'Vous voyez l’avis de chaque ville. Touchez une ville pour la choisir.',
  },
  {
    cible: 'telegram',
    titre: 'Aussi sur Telegram',
    texte: 'Vous avez Telegram ? Posez vos questions au bot @sstack_agri_bot, par écrit ou par message vocal. Suivez les 3 étapes de cette carte.',
  },
  {
    cible: 'agent',
    cote: 'haut',
    titre: 'Posez vos questions',
    texte: 'Touchez ce bouton pour écrire à Mbolo, notre assistant. Posez votre question avec vos mots, comme à un voisin.',
  },
  {
    cible: 'menu',
    cote: 'droite',
    titre: 'Toutes les pages',
    texte: 'Le menu vous mène aux autres pages : la carte, la pluie, vos cultures.',
  },
  {
    titre: 'C’est tout !',
    texte: 'Pour revoir cette visite, touchez « Comment ça marche ? » en haut de la page.',
  },
]

const PADDING = 6 // marge du cadre lumineux autour de l'élément

function Visite({ chemin }: { chemin: string | null }) {
  const [parcours, setParcours] = useState<readonly Etape[] | null>(null)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const bulle = useRef<HTMLDivElement>(null)
  const boutonPrincipal = useRef<HTMLButtonElement>(null)
  const idTitre = useId()
  const idTexte = useId()
  const surPage = chemin === PAGE_VISITE

  const demarrer = useCallback(() => {
    // Seules les étapes dont l'élément est à l'écran (les étapes sans élément sont toujours gardées)
    setParcours(ETAPES.filter((e) => !e.cible || trouverCible(e.cible)))
    setIndex(0)
    setRect(null)
    marquerVisiteVue()
  }, [])

  const terminer = useCallback(() => setParcours(null), [])

  // Lancement automatique (première visite ou demande depuis une autre page) et à la demande
  useEffect(() => {
    if (!surPage) return
    window.addEventListener(EVENEMENT_LANCER_VISITE, demarrer)
    let attente: number | undefined
    if (!visiteDejaVue() || visiteDemandee()) {
      // On attend que le verdict NASA soit affiché (6 s au plus) pour éclairer les vrais éléments
      const debut = Date.now()
      attente = window.setInterval(() => {
        if (trouverCible('verdict') || Date.now() - debut > 6000) {
          window.clearInterval(attente)
          demarrer()
        }
      }, 250)
    }
    return () => {
      window.removeEventListener(EVENEMENT_LANCER_VISITE, demarrer)
      window.clearInterval(attente)
    }
  }, [surPage, demarrer])

  const etape = parcours?.[index]

  // Élément de l'étape : on le fait défiler au centre, puis on suit sa position
  useEffect(() => {
    if (!etape) return
    let image = 0
    if (!etape.cible) {
      image = requestAnimationFrame(() => setRect(null))
      return () => cancelAnimationFrame(image)
    }
    const el = trouverCible(etape.cible)
    if (!el) {
      // Élément disparu entre-temps : étape sautée
      image = requestAnimationFrame(() => setIndex((i) => i + 1))
      return () => cancelAnimationFrame(image)
    }
    el.scrollIntoView({ block: 'center', behavior: mouvementReduit() ? 'auto' : 'smooth' })
    const mesurer = () => {
      cancelAnimationFrame(image)
      image = requestAnimationFrame(() => setRect(el.getBoundingClientRect()))
    }
    mesurer()
    const relance = window.setTimeout(mesurer, 450) // fin du défilement doux
    window.addEventListener('scroll', mesurer, true)
    window.addEventListener('resize', mesurer)
    return () => {
      cancelAnimationFrame(image)
      window.clearTimeout(relance)
      window.removeEventListener('scroll', mesurer, true)
      window.removeEventListener('resize', mesurer)
    }
  }, [etape])

  // Position de la bulle (après rendu, une fois sa taille connue)
  useLayoutEffect(() => {
    const b = bulle.current
    if (!etape || !b) return
    const { width: w, height: h } = b.getBoundingClientRect()
    const image = requestAnimationFrame(() => {
      if (!rect || !etape.cible) {
        setPos({ top: (window.innerHeight - h) / 2, left: (window.innerWidth - w) / 2 })
        return
      }
      const cadre = {
        top: rect.top - PADDING,
        bottom: rect.bottom + PADDING,
        left: rect.left - PADDING,
        right: rect.right + PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
      setPos(placer(cadre, { w, h }, etape.cote ?? 'bas'))
    })
    return () => cancelAnimationFrame(image)
  }, [etape, rect])

  // Le focus suit la bulle (clavier, lecteur d'écran)
  useEffect(() => {
    if (etape) boutonPrincipal.current?.focus({ preventScroll: true })
  }, [etape])

  useEffect(() => {
    if (!etape) return
    const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && terminer()
    document.addEventListener('keydown', surTouche)
    return () => document.removeEventListener('keydown', surTouche)
  }, [etape, terminer])

  if (!parcours || !etape || !surPage) return null

  const premiere = index === 0
  const derniere = index === parcours.length - 1
  // Le compteur ne montre que les étapes qui éclairent un élément
  const guidees = parcours.filter((e) => e.cible)
  const numero = etape.cible ? guidees.indexOf(etape) + 1 : 0
  const suivant = () => (derniere ? terminer() : setIndex((i) => i + 1))

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {rect && etape.cible ? (
        <div
          aria-hidden="true"
          className="visite-projecteur absolute rounded-[22px]"
          style={{ top: rect.top - PADDING, left: rect.left - PADDING, width: rect.width + PADDING * 2, height: rect.height + PADDING * 2 }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
      )}

      <div
        ref={bulle}
        key={index}
        role="dialog"
        aria-modal="false"
        aria-labelledby={idTitre}
        aria-describedby={idTexte}
        style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
        className="bulle-apparition pointer-events-auto absolute flex w-[min(360px,calc(100vw-24px))] flex-col gap-3 rounded-[20px] bg-surface p-5 font-sans shadow-[0_24px_60px_-18px_rgba(17,26,20,0.6)]"
      >
        {numero > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {guidees.map((g, i) => (
                <span key={g.cible} className={`h-1.5 rounded-full transition-all ${i + 1 === numero ? 'w-5 bg-accent' : i + 1 < numero ? 'w-1.5 bg-accent-light' : 'w-1.5 bg-line'}`} />
              ))}
            </div>
            <span className="font-mono text-xs text-muted">
              {numero} sur {guidees.length}
            </span>
          </div>
        )}

        <h2 id={idTitre} className="m-0 font-display text-[19px] leading-tight font-semibold text-ink">
          {etape.titre}
        </h2>
        <p id={idTexte} className="m-0 text-base leading-[1.5] text-muted-2">
          {etape.texte}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          {derniere ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={terminer}
              className="min-h-12 cursor-pointer rounded-xl border-0 bg-transparent px-2 font-sans text-[15px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {premiere ? 'Plus tard' : 'Passer'}
            </button>
          )}
          <div className="flex items-center gap-2">
            {!premiere && !derniere && (
              <button
                type="button"
                onClick={() => setIndex((i) => i - 1)}
                className="min-h-12 cursor-pointer rounded-xl border border-line bg-surface px-4 font-sans text-[15px] font-semibold text-ink hover:border-accent"
              >
                Retour
              </button>
            )}
            <button
              ref={boutonPrincipal}
              type="button"
              onClick={suivant}
              className="min-h-12 cursor-pointer rounded-xl border-0 bg-accent px-5 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover"
            >
              {premiere ? 'Commencer' : derniere ? 'J’ai compris' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function VisiteAvecChemin() {
  return <Visite chemin={usePathname()} />
}

export default function VisiteGuidee() {
  return (
    <Suspense fallback={null}>
      <VisiteAvecChemin />
    </Suspense>
  )
}
