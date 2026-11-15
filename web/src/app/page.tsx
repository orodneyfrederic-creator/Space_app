// Landing de S'STACK, en pleine largeur (sans la barre latérale de l'application).
// Le tableau de bord est sur /tableau-de-bord ; connexion et inscription sur /connexion et /inscription.
import type { Metadata } from 'next'
import EnTeteLanding from '@/components/landing/EnTeteLanding'
import Hero from '@/components/landing/Hero'
import Sections from '@/components/landing/Sections'

export const metadata: Metadata = {
  title: "S'STACK · Semer au bon moment grâce aux données NASA",
  description:
    'Verdict de semis, pluie observée et agent conseiller pour les producteurs gabonais, à partir des données ouvertes NASA POWER et SoilGrids.',
}

export default function Landing() {
  return (
    <div className="bg-white">
      <EnTeteLanding />
      <Hero />
      <Sections />
    </div>
  )
}
