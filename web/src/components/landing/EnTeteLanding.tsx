'use client'
// En-tête de la landing, toujours visible : transparent sur le hero, vert profond dès qu'on fait défiler.
// Le lien de la section en cours de lecture est mis en avant.
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import Logo from '../navigation/Logo'
import { ANCRES, GOUTTIERE } from './constantes'
import { IcoMenu } from './icones'

const SEUIL_DEFILEMENT = 24

function abonnerDefilement(rappel: () => void) {
  window.addEventListener('scroll', rappel, { passive: true })
  return () => window.removeEventListener('scroll', rappel)
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

export default function EnTeteLanding() {
  const defile = useSyncExternalStore(abonnerDefilement, aDefile, () => false)
  const active = useSyncExternalStore(abonnerDefilement, sectionActive, () => ANCRES[0].href)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,height] duration-300 ${
        defile ? 'h-16 border-white/10 bg-sous-bois/80 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur-lg' : 'h-20 border-transparent bg-transparent'
      }`}
    >
      <div className={`flex h-full items-center justify-between gap-6 ${GOUTTIERE}`}>
        <Link href="/" aria-label="S'STACK, accueil" className="no-underline">
          <Logo clair sousTitre="Conseils de semis" prioritaire />
        </Link>

        {/* Navigation en pastille blanche, comme sur la maquette */}
        <nav aria-label="Sections de la page" className="hidden items-center gap-1 rounded-full bg-white p-1.5 shadow-lg lg:flex">
          {ANCRES.map((a) => {
            const estActive = a.href === active
            return (
              <a
                key={a.href}
                href={a.href}
                aria-current={estActive ? 'location' : undefined}
                className={`flex h-10 items-center rounded-full px-5 text-sm no-underline transition-colors ${
                  estActive ? 'bg-feuille font-medium text-white' : 'text-encre hover:bg-pale'
                }`}
              >
                {a.label}
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/connexion"
            className="hidden h-11 items-center rounded-full border border-white/50 bg-black/10 px-5 text-sm font-medium text-white no-underline backdrop-blur-md transition-colors hover:bg-white/15 sm:flex"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="hidden h-11 items-center rounded-full bg-feuille px-5 text-sm font-medium text-white no-underline shadow-lg transition-colors hover:bg-feuille-hover md:flex"
          >
            Créer un compte
          </Link>
          <details className="relative lg:hidden">
            <summary
              aria-label="Ouvrir le menu"
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md [&::-webkit-details-marker]:hidden"
            >
              <IcoMenu />
            </summary>
            <nav
              aria-label="Menu"
              onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
              className="absolute right-0 z-30 mt-2 flex w-64 flex-col gap-1 rounded-2xl bg-white p-2 shadow-xl"
            >
              {ANCRES.map((a) => (
                <a key={a.href} href={a.href} className="flex min-h-11 items-center rounded-xl px-4 text-[15px] font-medium text-encre no-underline hover:bg-pale">
                  {a.label}
                </a>
              ))}
              <Link href="/connexion" className="mt-1 flex min-h-11 items-center justify-center rounded-xl border border-feuille px-4 text-[15px] font-semibold text-feuille no-underline">
                Se connecter
              </Link>
              <Link href="/inscription" className="flex min-h-11 items-center justify-center rounded-xl bg-feuille px-4 text-[15px] font-semibold text-white no-underline">
                Créer un compte
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
