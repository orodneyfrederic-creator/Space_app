// Page /parcelles/[id] : la fiche d'une parcelle (verdict, pluie, sol) et son graphique de pluie.
// Exemple : /parcelles/tchibanga
// TODO (front-end) : remplacer les données de démo par la fiche renvoyée par le serveur.
import Link from 'next/link'
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
    <main className="flex flex-1 flex-col gap-4 overflow-auto px-5 pt-14 pb-4">
      <header className="flex flex-col gap-1">
        <Link href="/carte" className="text-[13px] font-semibold text-accent no-underline hover:text-accent-hover">
          ← Carte
        </Link>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">{parcelle.nom}</h1>
        <span className="font-mono text-xs text-muted">
          {parcelle.lat}, {parcelle.lon}
          {parcelle.culture ? ` · ${parcelle.culture}` : ''}
        </span>
      </header>
      <CarteFiche fiche={FICHE_DEMO_TCHIBANGA} />
      <GraphiquePluie points={PLUIE_DEMO} />
      <Link
        href={`/assistant?parcelle=${parcelle.id}`}
        className="mt-auto flex min-h-[52px] items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-white no-underline hover:bg-accent-hover"
      >
        Demander conseil pour cette parcelle
      </Link>
    </main>
  )
}
