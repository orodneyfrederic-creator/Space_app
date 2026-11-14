// Page /historique : les conseils donnés sur le web et sur Telegram.
// TODO (front-end) : remplacer HISTORIQUE_DEMO par listerConseils() (lib/api.ts) quand le serveur l'expose.
import ListeConseils from '@/components/historique/ListeConseils'
import { HISTORIQUE_DEMO } from '@/lib/donnees-demo'

export default function PageHistorique() {
  return (
    <main className="flex flex-1 flex-col gap-4 overflow-auto px-5 pt-14 pb-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">Historique des conseils</h1>
        <span className="text-[13px] text-muted">Web et Telegram</span>
      </header>
      <ListeConseils conseils={HISTORIQUE_DEMO} />
    </main>
  )
}
