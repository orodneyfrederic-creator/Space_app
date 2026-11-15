// Page d'inscription (authentification pas encore branchée : elle garde le site choisi et ouvre le tableau de bord).
import type { Metadata } from 'next'
import CadreAuth from '@/components/auth/CadreAuth'
import FormInscription from '@/components/auth/FormInscription'

export const metadata: Metadata = {
  title: "Créer un compte · S'STACK",
  description: 'Créez votre compte S’STACK et choisissez le site le plus proche de vos champs.',
}

export default function Inscription() {
  return (
    <CadreAuth
      titre="Semez au bon moment, avec les données de la NASA"
      texte="Choisissez le site le plus proche de vos champs : S'STACK suit sa pluie et son sol chaque jour, et l'agent répond à vos questions."
    >
      <div className="flex flex-col gap-2 text-center">
        <h2 className="m-0 font-display text-[28px] font-bold tracking-[-0.03em] text-encre">Créer un compte</h2>
        <p className="m-0 text-[15px] text-ardoise">Quelques informations suffisent.</p>
      </div>
      <FormInscription />
    </CadreAuth>
  )
}
