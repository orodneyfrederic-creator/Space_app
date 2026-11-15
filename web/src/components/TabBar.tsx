'use client'
// Barre d'onglets en bas de l'écran (téléphone et tablette, moins de 1024 px) : 4 raccourcis + « Menu »,
// qui ouvre le menu complet de l'espace agriculteur (tiroir de la sidebar). Cachée sur ordinateur.
// Suspense : usePathname n'est connu qu'au moment de la requête (Next.js 16).
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { IcoMenu } from './landing/icones'
import { estActif, LIENS } from './navigation/liens'
import { EVENEMENT_OUVRIR_MENU } from './navigation/menu'

function Onglets({ chemin }: { chemin: string | null }) {
  const raccourci = chemin !== null && LIENS.some((l) => estActif(chemin, l.correspond))
  return (
    <nav
      aria-label="Raccourcis"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line-soft bg-surface px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {LIENS.map(({ href, label, icone: Icone, correspond }) => {
        const actif = chemin !== null && estActif(chemin, correspond)
        return (
          <Link
            key={href}
            href={href}
            aria-current={actif ? 'page' : undefined}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-[3px] text-xs no-underline ${
              actif ? 'font-semibold text-accent' : 'font-medium text-muted'
            }`}
          >
            <Icone />
            {label}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(EVENEMENT_OUVRIR_MENU))}
        className={`flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent font-sans text-xs ${
          chemin !== null && !raccourci ? 'font-semibold text-accent' : 'font-medium text-muted'
        }`}
      >
        <IcoMenu />
        Menu
      </button>
    </nav>
  )
}

function OngletsAvecChemin() {
  return <Onglets chemin={usePathname()} />
}

export default function TabBar() {
  return (
    <Suspense fallback={<Onglets chemin={null} />}>
      <OngletsAvecChemin />
    </Suspense>
  )
}
