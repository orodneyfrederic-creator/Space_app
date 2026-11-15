'use client'
// Garde de l'espace agriculteur : il faut un compte. Sans session, on renvoie vers /connexion
// (avec ?suite=… pour revenir ensuite sur la page demandée). Même chose après une déconnexion
// ou un jeton expiré (lib/api.ts efface alors la session).
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useSession } from '@/lib/session'

export default function GardeSession({ children }: { children: ReactNode }) {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session !== null) return
    const ici = `${window.location.pathname}${window.location.search}`
    router.replace(`/connexion?suite=${encodeURIComponent(ici)}`)
  }, [session, router])

  // undefined : on lit encore le navigateur ; null : redirection en cours
  if (!session) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-[50svh] items-center justify-center">
        <span aria-hidden="true" className="size-7 animate-spin rounded-full border-[3px] border-line border-t-accent" />
        <span className="sr-only">Vérification de votre compte…</span>
      </div>
    )
  }
  return children
}
