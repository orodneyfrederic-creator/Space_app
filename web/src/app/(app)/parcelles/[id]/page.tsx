// Page /parcelles/[id] : fiche d'un site (exemple : /parcelles/tchibanga).
// Rendue dynamiquement : les données sont chargées à chaque visite depuis le serveur S'STACK,
// rien n'est figé au moment du build. loading.tsx sert d'écran d'attente pendant la lecture de `params`.
import VueParcelle from '@/components/vues/VueParcelle'

export default async function PageParcelle({ params }: PageProps<'/parcelles/[id]'>) {
  const { id } = await params
  return <VueParcelle id={id} />
}
