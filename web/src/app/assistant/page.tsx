// MODULE 06 — Assistant intelligent (/assistant)
// Interface de discussion qui connaît le contexte de l'exploitation et appelle des outils métier.
// Accepte ?parcelle=<id> pour ouvrir la discussion sur une parcelle (ex. /assistant?parcelle=tchibanga).
// TODO (front-end) : remplacer PARCELLES_DEMO par les parcelles autorisées renvoyées par le serveur.
import { Suspense } from 'react'
import FenetreAssistant from '@/components/assistant/FenetreAssistant'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

function ChargementAssistant() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-14 pb-4" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-11 animate-pulse rounded-xl bg-surface" />
      <div className="h-24 animate-pulse rounded-[18px] bg-surface" />
    </main>
  )
}

export default function PageAssistant() {
  // useSearchParams (lu dans FenetreAssistant) doit être sous un Suspense avec Cache Components
  return (
    <Suspense fallback={<ChargementAssistant />}>
      <FenetreAssistant parcelles={PARCELLES_DEMO} />
    </Suspense>
  )
}
