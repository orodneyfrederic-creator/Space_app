// Barre de navigation commune à toutes les pages.
// Le dossier components/ui/ accueille les petits composants réutilisables (boutons, cartes, badges…).
import Link from 'next/link'

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/carte', label: 'Carte' },
  { href: '/discuter', label: 'Parler à l’agent' },
  { href: '/historique', label: 'Historique' },
]

export default function Navigation() {
  return (
    <nav className="flex gap-4 border-b px-4 py-3">
      <span className="font-bold">S&apos;STACK</span>
      {LIENS.map((l) => (
        <Link key={l.href} href={l.href} className="hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
