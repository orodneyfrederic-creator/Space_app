// Page /historique : les conseils donnés sur le web et sur Telegram.
// TODO (front-end) : remplacer HISTORIQUE_DEMO par listerConseils() (lib/api.ts) quand le serveur l'expose.
import ListeConseils from '@/components/historique/ListeConseils'
import { HISTORIQUE_DEMO } from '@/lib/donnees-demo'

export default function PageHistorique() {
  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Historique des conseils</h1>
      <ListeConseils conseils={HISTORIQUE_DEMO} />
    </main>
  )
}
