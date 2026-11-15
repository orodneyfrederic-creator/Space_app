// Page /bienvenue : affichée juste après l'inscription (compte prêt + présentation du bot Telegram).
import type { Metadata } from 'next'
import Bienvenue from '@/components/auth/Bienvenue'
import CadreAuth from '@/components/auth/CadreAuth'

export const metadata: Metadata = {
  title: "Bienvenue · S'STACK",
  description: 'Votre compte S’STACK est prêt. Recevez aussi vos conseils sur Telegram.',
}

export default function PageBienvenue() {
  return (
    <CadreAuth
      titre="Vos conseils de semis, sur le web et sur Telegram"
      texte="Sur le site : les chiffres, la carte et l'historique. Sur Telegram : une question, une réponse, même au champ et par message vocal."
    >
      <Bienvenue />
    </CadreAuth>
  )
}
