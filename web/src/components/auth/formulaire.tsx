// Éléments partagés des formulaires Connexion et Inscription (styles du design system CNX 4.0).
import type { ReactNode } from 'react'

export const CLASSE_CHAMP =
  'h-14 w-full rounded-[10px] border border-[#D9E3DD] bg-white px-4 font-sans text-base text-encre outline-none transition-[border-color,box-shadow] placeholder:text-[#9AA3B5] focus:border-cnx focus:shadow-[0_0_0_4px_rgba(29,120,82,0.12)]'

export const CLASSE_BOUTON_PRINCIPAL =
  'flex h-14 w-full cursor-pointer items-center justify-center rounded-[10px] border-0 bg-cnx font-sans text-base font-semibold text-white transition-colors hover:bg-profond'

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

/** Rappel honnête : l'authentification n'est pas encore branchée. */
export function AvisAuthentification() {
  return (
    <p className="m-0 rounded-[10px] bg-pale px-4 py-3 text-center text-[13px] leading-relaxed text-ardoise">
      L&apos;authentification n&apos;est pas encore active : le formulaire ouvre directement le tableau de bord. Aucune donnée saisie
      n&apos;est envoyée ni enregistrée.
    </p>
  )
}
