'use client'
// Bouton qui relance la visite guidée (en haut du tableau de bord et dans le menu).
import { useRouter } from 'next/navigation'
import { lancerVisite, PAGE_VISITE } from './visite'

export function IcoVisite({ taille = 18 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.6 7.6a2.5 2.5 0 1 1 3.4 2.33c-.6.24-1 .8-1 1.45v.37" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="1" fill="currentColor" />
    </svg>
  )
}

export default function BoutonVisite({ className, children }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter()
  return (
    <button type="button" onClick={() => lancerVisite(() => router.push(PAGE_VISITE))} className={`cursor-pointer ${className ?? ''}`}>
      {children ?? (
        <>
          <IcoVisite />
          Comment ça marche ?
        </>
      )}
    </button>
  )
}
