'use client'
// Choix du profil en 3 cartes cliquables (boutons radio natifs : clavier et lecteurs d'écran).
import { PROFILS } from '@/lib/profil'
import type { Profil } from '@/lib/types'

type Props = {
  name: string
  valeur: Profil
  onChange: (p: Profil) => void
  desactive?: boolean
}

export default function ChoixProfil({ name, valeur, onChange, desactive = false }: Props) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-[15px] font-semibold text-encre">Vous êtes :</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {PROFILS.map((p) => {
          const choisi = p.id === valeur
          return (
            <label
              key={p.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border-2 px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cnx ${
                choisi ? 'border-cnx bg-accent-soft' : 'border-line bg-surface hover:border-accent-light'
              } ${desactive ? 'cursor-wait opacity-70' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={p.id}
                checked={choisi}
                disabled={desactive}
                onChange={() => onChange(p.id)}
                className="sr-only"
              />
              <span className="font-display text-[15px] font-semibold text-encre">{p.titre}</span>
              <span className="text-[13px] leading-snug text-ardoise">{p.description}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
