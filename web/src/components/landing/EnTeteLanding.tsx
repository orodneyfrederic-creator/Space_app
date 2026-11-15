'use client'
// En-tête de la landing, toujours visible.
// - En haut (sur la photo du hero) : transparent, logo négatif, pastille de navigation en verre (blanc 14 %, texte blanc).
// - Dès 24 px de défilement : barre de verre dépoli claire (classe .verre), logo principal en fondu enchaîné,
//   pastille fondue dans le verre, barre de progression de lecture en bas.
// Mouvements : seulement transform, opacity, couleurs et ombres (var(--duree-lente), var(--ease-sortie)).
// La hauteur réservée ne change jamais (80 px) : le verre fait 64 px et le contenu remonte de 8 px en transform.
// Le fond vert du lien actif est une seule pastille qui glisse (clip-path), posée sans état React.
import Link from 'next/link'
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import Logo from '../navigation/Logo'
import { ANCRES, GOUTTIERE } from './constantes'
import { IcoMenu } from './icones'

const SEUIL_DEFILEMENT = 24

function abonnerDefilement(rappel: () => void) {
  window.addEventListener('scroll', rappel, { passive: true })
  window.addEventListener('resize', rappel)
  return () => {
    window.removeEventListener('scroll', rappel)
    window.removeEventListener('resize', rappel)
  }
}
const aDefile = () => window.scrollY > SEUIL_DEFILEMENT

/** Ancre de la dernière section dont le haut a passé le milieu de l'écran (dans l'ordre de la page). */
function sectionActive(): string {
  const milieu = window.innerHeight * 0.45
  let active: string = ANCRES[0].href
  const sections = ANCRES.map((a) => ({ href: a.href, el: document.querySelector(a.href) }))
    .filter((s): s is { href: (typeof ANCRES)[number]['href']; el: Element } => s.el !== null)
    .sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top)
  for (const s of sections) if (s.el.getBoundingClientRect().top <= milieu) active = s.href
  return active
}

const TRANSITION = 'duration-(--duree-lente) ease-(--ease-sortie)'

/** Pastille verte qui glisse sous le lien actif : on découpe (clip-path) une bande verte de la largeur de la nav. */
function useIndicateur(active: string) {
  const nav = useRef<HTMLElement>(null)
  const indicateur = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const placer = () => {
      const n = nav.current
      const i = indicateur.current
      const lien = n?.querySelector<HTMLElement>(`a[href="${active}"]`)
      if (!n || !i || !lien) return
      const gauche = lien.offsetLeft - i.offsetLeft
      const droite = i.offsetWidth - gauche - lien.offsetWidth
      i.style.clipPath = `inset(0 ${droite}px 0 ${gauche}px round 999px)`
      // Première pose : sans glissement depuis le bord
      if (i.dataset.pret !== 'oui') {
        requestAnimationFrame(() => {
          i.dataset.pret = 'oui'
        })
      }
    }
    placer()
    window.addEventListener('resize', placer)
    // Les polices peuvent changer la largeur des liens après le premier rendu
    void document.fonts?.ready.then(placer)
    return () => window.removeEventListener('resize', placer)
  }, [active])

  return { nav, indicateur }
}

/** Barre de lecture (2 px, Vert Gabon) : écrite directement dans le style, sans re-rendu à chaque pixel. */
function useProgression() {
  const barre = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    let image = 0
    const maj = () => {
      cancelAnimationFrame(image)
      image = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        if (barre.current) barre.current.style.transform = `scaleX(${p})`
      })
    }
    maj()
    window.addEventListener('scroll', maj, { passive: true })
    window.addEventListener('resize', maj)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('scroll', maj)
      window.removeEventListener('resize', maj)
    }
  }, [])
  return barre
}

export default function EnTeteLanding() {
  const defile = useSyncExternalStore(abonnerDefilement, aDefile, () => false)
  const active = useSyncExternalStore(abonnerDefilement, sectionActive, () => ANCRES[0].href)
  const { nav, indicateur } = useIndicateur(active)
  const barre = useProgression()

  return (
    <header className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-20 ${defile ? '' : 'fond-sombre'}`}>
      {/* Fond de verre (64 px) : apparaît en fondu */}
      <div
        aria-hidden="true"
        className={`verre absolute inset-x-0 top-0 h-16 border-b border-ink/6 shadow-(--ombre-2) transition-opacity ${TRANSITION} ${
          defile ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span ref={barre} style={{ transform: 'scaleX(0)' }} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-success" />
      </div>

      <div
        className={`relative flex h-full items-center justify-between gap-6 transition-transform ${TRANSITION} ${GOUTTIERE} ${
          defile ? '-translate-y-2' : 'translate-y-0'
        }`}
      >
        {/* Logo : négatif (sur photo) et principal (sur verre) superposés, fondu enchaîné, 30 → 26 px */}
        <Link
          href="/"
          aria-label="S'STACK, accueil"
          className={`pointer-events-auto grid origin-left rounded-lg no-underline transition-transform ${TRANSITION} ${defile ? 'scale-[0.8667]' : 'scale-100'}`}
        >
          <span className={`col-start-1 row-start-1 transition-opacity ${TRANSITION} ${defile ? 'opacity-0' : 'opacity-100'}`}>
            <Logo clair sousTitre="Conseils de semis" prioritaire />
          </span>
          <span aria-hidden="true" className={`col-start-1 row-start-1 transition-opacity ${TRANSITION} ${defile ? 'opacity-100' : 'opacity-0'}`}>
            <Logo sousTitre="Conseils de semis" prioritaire />
          </span>
        </Link>

        {/* Navigation en pastille : blanche sur la photo, fondue dans le verre une fois défilé */}
        <nav
          ref={nav}
          aria-label="Sections de la page"
          className={`pointer-events-auto relative hidden items-center gap-1 rounded-full border p-1.5 transition-[background-color,border-color,box-shadow] lg:flex ${TRANSITION} ${
            defile ? 'border-transparent bg-transparent shadow-none' : 'border-white/25 bg-white/14 shadow-(--ombre-2) backdrop-blur-md backdrop-saturate-150'
          }`}
        >
          <span
            ref={indicateur}
            aria-hidden="true"
            className="absolute inset-1.5 rounded-full bg-feuille opacity-0 data-[pret=oui]:opacity-100 data-[pret=oui]:transition-[clip-path] data-[pret=oui]:duration-(--duree) data-[pret=oui]:ease-(--ease-sortie)"
          />
          {ANCRES.map((a) => {
            const estActive = a.href === active
            return (
              <a
                key={a.href}
                href={a.href}
                aria-current={estActive ? 'location' : undefined}
                className={`relative flex h-10 items-center rounded-full px-5 text-sm no-underline transition-colors duration-(--duree-rapide) ease-(--ease-standard) focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  defile ? 'focus-visible:outline-cnx' : 'focus-visible:outline-sun'
                } ${estActive ? 'font-medium text-white' : defile ? 'text-encre hover:bg-pale' : 'text-white hover:bg-white/15'}`}
              >
                {a.label}
              </a>
            )
          })}
        </nav>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/connexion"
            className={`bouton-contour bouton-entete hidden h-11 items-center rounded-full border px-5 text-sm font-medium no-underline sm:flex ${
              defile ? 'border-cnx bg-transparent text-cnx hover:bg-pale' : 'border-white/50 bg-black/10 text-white backdrop-blur-md hover:bg-white/15'
            }`}
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="bouton-plein hidden h-11 items-center rounded-full bg-feuille px-5 text-sm font-medium text-white no-underline hover:bg-feuille-hover md:flex"
          >
            Créer un compte
          </Link>
          <details className="relative lg:hidden">
            <summary
              aria-label="Ouvrir le menu"
              className={`flex size-11 cursor-pointer list-none items-center justify-center rounded-full border transition-colors [&::-webkit-details-marker]:hidden ${TRANSITION} ${
                defile ? 'border-ink/10 bg-white/60 text-encre' : 'border-white/30 bg-white/10 text-white backdrop-blur-md'
              }`}
            >
              <IcoMenu />
            </summary>
            <nav
              aria-label="Menu"
              onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
              className="menu-deroulant verre absolute right-0 z-30 mt-2 flex w-64 flex-col gap-1 rounded-2xl border border-ink/6 p-2 shadow-(--ombre-3)"
            >
              {ANCRES.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  aria-current={a.href === active ? 'location' : undefined}
                  className="flex min-h-11 items-center rounded-xl px-4 text-[15px] font-medium text-encre no-underline transition-colors duration-(--duree-rapide) hover:bg-pale aria-[current=location]:text-cnx"
                >
                  {a.label}
                </a>
              ))}
              <Link href="/connexion" className="mt-1 flex min-h-11 items-center justify-center rounded-xl border border-feuille px-4 text-[15px] font-semibold text-feuille no-underline hover:bg-pale">
                Se connecter
              </Link>
              <Link href="/inscription" className="flex min-h-11 items-center justify-center rounded-xl bg-feuille px-4 text-[15px] font-semibold text-white no-underline hover:bg-feuille-hover">
                Créer un compte
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
