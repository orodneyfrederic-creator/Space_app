'use client'
// Carte « S'STACK sur Telegram » : fait connaître le bot et explique comment relier son compte.
// - Compte pas encore relié : les 3 étapes + le bouton qui ouvre le bot.
// - Compte relié : une ligne de confirmation et le lien vers le bot.
// Le profil est relu au retour sur l'onglet : la carte passe à « relié » juste après la liaison dans Telegram.
import { useEffect } from 'react'
import { getMoi } from '@/lib/api'
import { majUtilisateur, useSession } from '@/lib/session'
import { LIEN_BOT_TELEGRAM, NOM_BOT_TELEGRAM } from '@/lib/telegram'
import { useApi } from '@/lib/use-api'

export function IcoTelegram({ taille = 22 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21.2 4.3 2.9 11.4c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.7 3.4c.7.5 1.7.1 1.9-.7l3-14.6c.2-1-.8-1.8-1.8-1.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m7.6 14.9 9.6-6.4-6.9 7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** +241077123456 → 077 12 34 56 (comme le producteur l'écrit) */
const telephoneLisible = (t: string) => {
  const n = t.slice(4)
  return `${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`
}

export function BoutonOuvrirBot({ className = '' }: { className?: string }) {
  return (
    <a
      href={LIEN_BOT_TELEGRAM}
      target="_blank"
      rel="noreferrer"
      className={`flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-info-ink px-5 text-base font-semibold text-white no-underline transition-colors hover:bg-info ${className}`}
    >
      <IcoTelegram taille={20} />
      Ouvrir {NOM_BOT_TELEGRAM}
    </a>
  )
}

export default function CarteTelegram({ grande = false }: { grande?: boolean }) {
  const session = useSession()
  const moi = useApi(getMoi, 'moi')

  // Profil à jour dans la session (nom, liaison Telegram)
  useEffect(() => {
    if (moi.statut === 'pret') majUtilisateur(moi.donnees)
  }, [moi])

  // Retour sur l'onglet après être passé dans Telegram : on relit le profil
  const { recharger } = moi
  useEffect(() => {
    const auRetour = () => document.visibilityState === 'visible' && recharger()
    document.addEventListener('visibilitychange', auRetour)
    return () => document.removeEventListener('visibilitychange', auRetour)
  }, [recharger])

  const utilisateur = moi.statut === 'pret' ? moi.donnees : session?.utilisateur
  if (!utilisateur) return null

  if (utilisateur.telegramLie && !grande) {
    return (
      <div data-visite="telegram" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-info-soft px-4 py-3 text-info-ink">
        <p className="m-0 flex items-center gap-2.5 text-[15px] font-semibold">
          <IcoTelegram />
          Telegram relié : posez aussi vos questions à {NOM_BOT_TELEGRAM}
        </p>
        <a href={LIEN_BOT_TELEGRAM} target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-[15px] font-semibold text-info-ink underline underline-offset-2">
          Ouvrir le bot
        </a>
      </div>
    )
  }

  return (
    <section
      data-visite="telegram"
      aria-labelledby="titre-telegram"
      className={`flex flex-col gap-4 rounded-[20px] border border-info-light bg-surface ${grande ? 'p-6' : 'p-5'}`}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info-ink">
          <IcoTelegram />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="titre-telegram" className="m-0 font-display text-lg leading-snug font-semibold">
            {utilisateur.telegramLie ? 'Votre compte est relié à Telegram' : 'S’STACK aussi sur Telegram'}
          </h2>
          <p className="m-0 text-[15px] leading-relaxed text-muted-2">
            Posez vos questions depuis votre téléphone, par écrit ou par message vocal, même avec une petite connexion. Le bot
            s&apos;appelle <strong className="font-mono font-semibold text-ink">{NOM_BOT_TELEGRAM}</strong>.
          </p>
        </div>
      </div>

      {!utilisateur.telegramLie && (
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {[
            <>Touchez le bouton ci-dessous : Telegram s&apos;ouvre sur le bot.</>,
            <>Touchez « Démarrer ».</>,
            <>
              Touchez « 📱 Partager mon numéro » : votre compte (
              <span className="font-mono whitespace-nowrap">{telephoneLisible(utilisateur.telephone)}</span>) est relié.
            </>,
          ].map((etape, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info-soft font-mono text-sm font-bold text-info-ink">
                {i + 1}
              </span>
              <span className="pt-0.5">{etape}</span>
            </li>
          ))}
        </ol>
      )}

      <BoutonOuvrirBot className="sm:self-start" />
      {!utilisateur.telegramLie && (
        <p className="m-0 text-[13px] leading-relaxed text-muted">
          Sur ordinateur ? Ouvrez Telegram sur votre téléphone et cherchez <span className="font-mono">{NOM_BOT_TELEGRAM}</span>.
        </p>
      )}
    </section>
  )
}
