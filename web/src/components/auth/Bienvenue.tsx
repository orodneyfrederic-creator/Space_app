'use client'
// Contenu de /bienvenue, juste après l'inscription : le compte est prêt, on présente le bot Telegram
// (meilleur moment pour le relier : le producteur vient de donner son numéro).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/lib/session'
import CarteTelegram from '../telegram/CarteTelegram'
import { CLASSE_BOUTON_PRINCIPAL } from './formulaire'

export default function Bienvenue() {
  const session = useSession()
  const router = useRouter()

  // Sans compte, cette page n'a pas de sens : retour à l'inscription
  useEffect(() => {
    if (session === null) router.replace('/inscription')
  }, [session, router])

  if (!session) return null
  const prenom = session.utilisateur.nom.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-encre">Bienvenue {prenom} !</h2>
        <p className="m-0 text-[15px] text-ardoise">Votre compte est prêt. Une dernière chose, si vous avez Telegram :</p>
      </div>
      <CarteTelegram grande />
      <Link href="/tableau-de-bord" className={`${CLASSE_BOUTON_PRINCIPAL} no-underline`}>
        Aller au tableau de bord
      </Link>
      <p className="m-0 text-center text-[14px] text-ardoise">Vous pourrez relier Telegram plus tard, depuis le tableau de bord.</p>
    </div>
  )
}
