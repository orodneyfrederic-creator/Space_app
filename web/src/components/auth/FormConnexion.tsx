'use client'
// Formulaire de connexion. L'authentification n'est pas encore branchée :
// un formulaire valide ouvre directement le tableau de bord, rien n'est envoyé ni enregistré.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BoutonAgent from '../agent/BoutonAgent'
import ChampMotDePasse from './ChampMotDePasse'
import { AvisAuthentification, CLASSE_BOUTON_PRINCIPAL, CLASSE_BOUTON_SECONDAIRE, CLASSE_CHAMP, Etiquette, Separateur } from './formulaire'

export default function FormConnexion() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          router.push('/tableau-de-bord')
        }}
      >
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="connexion-email">Adresse e-mail</Etiquette>
          <input id="connexion-email" name="email" type="email" required autoComplete="email" placeholder="prenom.nom@exemple.ga" className={CLASSE_CHAMP} />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="connexion-mdp">Mot de passe</Etiquette>
          <ChampMotDePasse id="connexion-mdp" autoComplete="current-password" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-encre">
            <input type="checkbox" name="resterConnecte" defaultChecked className="size-5 cursor-pointer accent-cnx" />
            Rester connecté
          </label>
          <BoutonAgent
            question="J'ai oublié mon mot de passe"
            className="min-h-11 border-0 bg-transparent p-0 font-sans text-[15px] font-semibold text-cnx hover:text-profond"
          >
            Mot de passe oublié ?
          </BoutonAgent>
        </div>
        <button type="submit" className={CLASSE_BOUTON_PRINCIPAL}>
          Se connecter
        </button>
      </form>

      <Separateur />

      <Link href="/inscription" className={CLASSE_BOUTON_SECONDAIRE}>
        Créer un compte
      </Link>

      <AvisAuthentification />
    </div>
  )
}
