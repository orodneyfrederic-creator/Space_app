// Éléments partagés des formulaires Connexion et Inscription (styles du design system CNX 4.0).
// Classe du bouton principal : grisé pendant l'envoi (disabled).
import type { ReactNode } from 'react'

export const CLASSE_CHAMP =
  'h-14 w-full rounded-[10px] border border-[#D9E3DD] bg-white px-4 font-sans text-base text-encre outline-none transition-[border-color,box-shadow] placeholder:text-[#9AA3B5] focus:border-cnx focus:shadow-[0_0_0_4px_rgba(29,120,82,0.12)]'

export const CLASSE_BOUTON_PRINCIPAL =
  'flex h-14 w-full cursor-pointer items-center justify-center rounded-[10px] border-0 bg-cnx font-sans text-base font-semibold text-white transition-colors hover:bg-vif-hover disabled:cursor-wait disabled:opacity-70'

export const CLASSE_BOUTON_SECONDAIRE =
  'flex h-14 w-full items-center justify-center rounded-[10px] border border-[#D9E3DD] bg-white text-base font-semibold text-encre no-underline transition-colors hover:border-cnx hover:text-cnx'

export function Etiquette({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold tracking-[0.12em] text-encre uppercase">
      {children}
    </label>
  )
}

export function Separateur() {
  return (
    <div className="flex items-center gap-4 text-sm font-medium text-ardoise" aria-hidden="true">
      <span className="h-px flex-1 bg-[#D9E3DD]" />
      OU
      <span className="h-px flex-1 bg-[#D9E3DD]" />
    </div>
  )
}

/** Erreur renvoyée par le serveur (numéro mal écrit, mot de passe incorrect…), lue par les lecteurs d'écran. */
export function MessageErreur({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="m-0 rounded-[10px] border border-risk-bg bg-risk-bg/50 px-4 py-3 text-[15px] leading-relaxed text-risk">
      {message}
    </p>
  )
}

/** Indication sous le champ téléphone : les deux écritures acceptées par le serveur. */
export const AIDE_TELEPHONE = 'Exemple : 077 12 34 56 ou +241 77 12 34 56'
