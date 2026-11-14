'use client'
// Barre d'onglets en bas de l'écran (téléphone, moins de 768 px). Cachée sur tablette et ordinateur.
// Suspense : même principe que NavLaterale (usePathname n'est connu qu'au moment de la requête).
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { estActif, LIENS } from './navigation/liens'

function Onglets({ chemin }: { chemin: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line-soft bg-surface px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden"
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
