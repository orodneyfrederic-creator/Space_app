'use client'
// Champ mot de passe avec bouton « afficher / masquer ».
import { useState } from 'react'
import { IcoOeil, IcoOeilBarre } from '../landing/icones'
import { CLASSE_CHAMP } from './formulaire'

export default function ChampMotDePasse({ id, autoComplete }: { id: string; autoComplete: 'current-password' | 'new-password' }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name="motDePasse"
        type={visible ? 'text' : 'password'}
        required
        minLength={8}
        autoComplete={autoComplete}
        placeholder="••••••••"
        className={`${CLASSE_CHAMP} pr-14`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-cnx hover:bg-pale"
      >
        {visible ? <IcoOeilBarre /> : <IcoOeil />}
      </button>
    </div>
  )
}
