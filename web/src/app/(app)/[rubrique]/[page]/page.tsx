// Pages « à venir » du menu de l'espace agriculteur (ex. /climat/meteo, /economie/revenus).
// Les adresses viennent de components/navigation/menu.ts ; toute autre adresse renvoie une page 404.
// Les dossiers existants (carte, cultures, parcelles…) restent prioritaires sur ce segment dynamique.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adressesAVenir, pageAVenir } from '@/components/navigation/menu'
import VuePageAVenir from '@/components/vues/VuePageAVenir'

export function generateStaticParams() {
  return adressesAVenir()
}

export async function generateMetadata({ params }: PageProps<'/[rubrique]/[page]'>): Promise<Metadata> {
  const { rubrique, page } = await params
  const trouvee = pageAVenir(rubrique, page)
  return { title: trouvee ? `${trouvee.page.titre} · S'STACK` : "S'STACK" }
}

export default async function PageAVenir({ params }: PageProps<'/[rubrique]/[page]'>) {
  const { rubrique, page } = await params
  const trouvee = pageAVenir(rubrique, page)
  if (!trouvee) notFound()
  return <VuePageAVenir rubrique={trouvee.rubrique} page={trouvee.page} />
}
