'use client'
// Sélecteur de profil pour la démo : visible SEULEMENT en mode local sans compte (développement).
// Avec un vrai compte, le profil se change dans Paramètres > Mon profil.
import { changerProfil, PROFILS, useProfil } from '@/lib/profil'
import { JETON_LOCAL, useSession } from '@/lib/session'
import type { Profil } from '@/lib/types'

export default function SelecteurProfilDemo() {
  const session = useSession()
  const profil = useProfil()
  if (process.env.NODE_ENV === 'production' || session?.jeton !== JETON_LOCAL) return null
  return (
    <label className="flex items-center gap-2 text-sm text-muted-2">
      <span className="hidden sm:inline">Profil (démo)</span>
      <select
        value={profil}
        onChange={(e) => void changerProfil(e.target.value as Profil)}
        aria-label="Profil (démo)"
        className="min-h-11 max-w-[10rem] cursor-pointer rounded-xl border border-dashed border-line bg-surface px-2 font-sans text-sm text-ink sm:max-w-none"
      >
        {PROFILS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.titre}
          </option>
        ))}
      </select>
    </label>
  )
}
