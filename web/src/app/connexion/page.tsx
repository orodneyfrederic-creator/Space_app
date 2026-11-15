// Page de connexion : numéro de téléphone + mot de passe, puis la page demandée ou le tableau de bord.
import type { Metadata } from 'next'
import CadreAuth from '@/components/auth/CadreAuth'
import FormConnexion from '@/components/auth/FormConnexion'

export const metadata: Metadata = {
  title: "Connexion · S'STACK",
  description: 'Connectez-vous à S’STACK pour suivre le verdict de semis de vos sites.',
}

export default function Connexion() {
  return (
    <CadreAuth
      titre="Vos champs, vus par les satellites de la NASA"
      texte="Retrouvez le verdict de semis de votre site, la pluie des derniers jours et les conseils de l'agent, sur le web comme sur Telegram."
    >
      <div className="flex flex-col gap-2 text-center">
        <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-encre">Se connecter</h2>
        <p className="m-0 text-[15px] text-ardoise">Content de vous revoir.</p>
      </div>
      <FormConnexion />
    </CadreAuth>
  )
}
