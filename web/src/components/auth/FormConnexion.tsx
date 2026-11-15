'use client'
// Formulaire de connexion : numéro de téléphone + mot de passe (POST /api/auth/connexion).
// En cas de succès, la session est gardée (lib/session.ts) et on ouvre la page demandée
// (paramètre ?suite=… posé par la garde de l'espace agriculteur) ou le tableau de bord.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { connecter, ErreurApi } from '@/lib/api'
import BoutonAgent from '../agent/BoutonAgent'
import ChampMotDePasse from './ChampMotDePasse'
import { AIDE_TELEPHONE, CLASSE_BOUTON_PRINCIPAL, CLASSE_BOUTON_SECONDAIRE, CLASSE_CHAMP, Etiquette, MessageErreur, Separateur } from './formulaire'

/** Page à ouvrir après la connexion : seulement une adresse interne au site. */
export function pageSuivante(): string {
  const suite = new URLSearchParams(window.location.search).get('suite')
  return suite && suite.startsWith('/') && !suite.startsWith('//') ? suite : '/tableau-de-bord'
}

export default function FormConnexion() {
  const router = useRouter()
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          const champs = new FormData(e.currentTarget)
          setErreur(null)
          setEnvoi(true)
          try {
            await connecter({ telephone: String(champs.get('telephone') ?? ''), motDePasse: String(champs.get('motDePasse') ?? '') })
            router.push(pageSuivante())
          } catch (err) {
            setErreur(err instanceof ErreurApi ? err.message : 'Une erreur inattendue est survenue. Réessayez.')
            setEnvoi(false)
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="connexion-tel">Numéro de téléphone</Etiquette>
          <input
            id="connexion-tel"
            name="telephone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="077 12 34 56"
            aria-describedby="connexion-tel-aide"
            className={CLASSE_CHAMP}
          />
          <p id="connexion-tel-aide" className="m-0 text-[13px] text-ardoise">{AIDE_TELEPHONE}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="connexion-mdp">Mot de passe</Etiquette>
          <ChampMotDePasse id="connexion-mdp" autoComplete="current-password" />
        </div>
        <div className="flex justify-end">
          <BoutonAgent
            question="J'ai oublié mon mot de passe"
            className="min-h-11 border-0 bg-transparent p-0 font-sans text-[15px] font-semibold text-cnx hover:text-vif-hover"
          >
            Mot de passe oublié ?
          </BoutonAgent>
        </div>
        <MessageErreur message={erreur} />
        <button type="submit" disabled={envoi} className={CLASSE_BOUTON_PRINCIPAL}>
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <Separateur />

      <Link href="/inscription" className={CLASSE_BOUTON_SECONDAIRE}>
        Créer un compte
      </Link>
    </div>
  )
}
