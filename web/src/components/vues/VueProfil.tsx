'use client'
// Paramètres > Mon profil : le profil change le menu et la page d'accueil, tout de suite.
import { useState } from 'react'
import { ErreurApi } from '@/lib/api'
import { changerProfil, useProfil } from '@/lib/profil'
import { useSession } from '@/lib/session'
import type { Profil } from '@/lib/types'
import ChoixProfil from '../auth/ChoixProfil'
import { EnTetePage, Panneau } from '../ui/elements'

export default function VueProfil() {
  const session = useSession()
  const profil = useProfil()
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)

  const choisir = async (p: Profil) => {
    if (p === profil) return
    setEnvoi(true)
    setMessage(null)
    try {
      await changerProfil(p)
      setMessage({ ok: true, texte: 'Profil enregistré. Le menu et la page d\'accueil sont à jour.' })
    } catch (err) {
      setMessage({ ok: false, texte: err instanceof ErreurApi ? err.message : 'Le profil n\'a pas pu être enregistré. Réessayez.' })
    } finally {
      setEnvoi(false)
    }
  }

  const u = session?.utilisateur
  return (
    <>
      <EnTetePage titre="Mon profil" sousTitre="Votre compte S'STACK" />
      <div className="flex max-w-3xl flex-col gap-5">
        <Panneau titre="Mon compte">
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
            <dt className="text-muted">Nom</dt>
            <dd className="m-0 font-semibold text-ink">{u?.nom ?? '—'}</dd>
            <dt className="text-muted">Téléphone</dt>
            <dd className="m-0 font-mono text-ink">{u ? u.telephone.replace(/^\+241(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4') : '—'}</dd>
          </dl>
        </Panneau>
        <Panneau titre="Mon profil professionnel">
          <ChoixProfil name="profil" valeur={profil} onChange={choisir} desactive={envoi} />
          {message && (
            <p role={message.ok ? 'status' : 'alert'} className={`m-0 rounded-xl px-3 py-2 text-sm ${message.ok ? 'bg-accent-soft text-accent' : 'bg-risk-bg text-risk'}`}>
              {message.texte}
            </p>
          )}
        </Panneau>
      </div>
    </>
  )
}
