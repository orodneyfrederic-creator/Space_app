// Page /parcelles/[id] : la fiche d'une parcelle (verdict, pluie, sol) et son graphique de pluie.
// Exemple : /parcelles/tchibanga
// TODO (front-end) : remplacer les données de démo par la fiche renvoyée par le serveur.
import { notFound } from 'next/navigation'
import CarteFiche from '@/components/climat/CarteFiche'
import GraphiquePluie from '@/components/climat/GraphiquePluie'
import { FICHE_DEMO_TCHIBANGA, PARCELLES_DEMO, PLUIE_DEMO } from '@/lib/donnees-demo'

// Next.js 16 (Cache Components) : on liste les parcelles connues pour pré-générer leurs pages.
export async function generateStaticParams() {
  return PARCELLES_DEMO.map((p) => ({ id: p.id }))
}

export default async function PageParcelle({ params }: PageProps<'/parcelles/[id]'>) {
  const { id } = await params
  const parcelle = PARCELLES_DEMO.find((p) => p.id === id)
  if (!parcelle) notFound()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">{parcelle.nom}</h1>
      <CarteFiche fiche={FICHE_DEMO_TCHIBANGA} />
      <GraphiquePluie points={PLUIE_DEMO} />
    </main>
  )
}
