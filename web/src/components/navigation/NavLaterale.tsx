'use client'
// Barre de navigation latérale (tablette et ordinateur, à partir de 768 px).
// Suspense : usePathname() n'est connu qu'au moment de la requête (Next.js 16) ; en attendant,
// la même barre s'affiche sans lien actif, pour ne jamais faire disparaître la navigation.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { estActif, LIENS } from './liens'
import Logo from './Logo'

function Barre({ chemin }: { chemin: string | null }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line-soft bg-surface md:flex">
      <Link href="/" aria-label="S'STACK, accueil" className="flex min-h-16 items-center px-6 no-underline">
        <Logo />
      </Link>
      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1 px-3 py-4">
        {LIENS.map(({ href, label, icone: Icone, correspond }) => {
          const actif = chemin !== null && estActif(chemin, correspond)
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline transition-colors ${
                actif ? 'bg-accent font-semibold text-white' : 'font-medium text-muted-2 hover:bg-accent-soft hover:text-accent'
              }`}
            >
              <Icone />
              {label}
            </Link>
          )
        })}
      </nav>
      <p className="m-0 border-t border-line-soft px-6 py-4 text-xs leading-relaxed text-muted">
        Données NASA POWER et SoilGrids
        <br />
        NASA Space Apps 2026 · Field Shift
      </p>
    </aside>
  )
}

function BarreAvecChemin() {
  return <Barre chemin={usePathname()} />
}

export default function NavLaterale() {
  return (
    <Suspense fallback={<Barre chemin={null} />}>
      <BarreAvecChemin />
    </Suspense>
  )
}
