'use client'
// Petit bandeau Telegram : seulement si le compte n'est pas encore relié au bot, et refermable
// (choix gardé sur l'appareil). La carte complète reste sur la page /bienvenue.
import { useSyncExternalStore } from 'react'
import { useSession } from '@/lib/session'
import { LIEN_BOT_TELEGRAM, NOM_BOT_TELEGRAM } from '@/lib/telegram'
import { IcoTelegram } from '../telegram/CarteTelegram'

const CLE = 'sstack:bandeau-telegram-ferme'
const EVENEMENT = 'sstack:bandeau-telegram'

const lireFerme = () => {
  try {
    return window.localStorage.getItem(CLE) === '1'
  } catch {
    return false
  }
}
const abonner = (rappel: () => void) => {
  window.addEventListener(EVENEMENT, rappel)
  return () => window.removeEventListener(EVENEMENT, rappel)
}

export default function BandeauTelegram() {
  const session = useSession()
  // Pendant le rendu serveur : considéré comme fermé (pas de bandeau qui apparaît puis disparaît)
  const ferme = useSyncExternalStore(abonner, lireFerme, () => true)
  if (ferme || !session || session.utilisateur.telegramLie) return null

  const fermer = () => {
    try {
      window.localStorage.setItem(CLE, '1')
    } catch {
      // stockage bloqué : le bandeau reviendra à la prochaine visite
    }
    window.dispatchEvent(new Event(EVENEMENT))
  }

  return (
    <aside data-visite="telegram" aria-label="Bot Telegram" className="flex items-center gap-3 rounded-2xl border border-info-light bg-info-soft px-4 py-2.5">
      <span className="shrink-0 text-info-ink">
        <IcoTelegram taille={20} />
      </span>
      <p className="m-0 min-w-0 flex-1 text-sm text-ink">
        Posez aussi vos questions sur Telegram, même à la voix :{' '}
        <a href={LIEN_BOT_TELEGRAM} target="_blank" rel="noopener noreferrer" className="font-semibold text-info-ink underline-offset-2 hover:underline">
          {NOM_BOT_TELEGRAM}
        </a>
      </p>
      <button
        type="button"
        onClick={fermer}
        aria-label="Fermer le bandeau Telegram"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent text-xl text-muted-2 hover:bg-white/60"
      >
        ×
      </button>
    </aside>
  )
}
