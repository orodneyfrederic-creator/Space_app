// Page /discuter : poser une question à l'agent, à l'écrit ou au micro.
// TODO (front-end) : permettre de choisir la parcelle (liste ou clic sur la carte).
import FenetreDiscussion from '@/components/discussion/FenetreDiscussion'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

export default function PageDiscuter() {
  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Parler à l&apos;agent S&apos;STACK</h1>
      <FenetreDiscussion parcelle={PARCELLES_DEMO[0]} />
    </main>
  )
}
