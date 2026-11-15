// Page /soil : Intelligence des sols (analyses, humidité NASA, amendements, bilan).
// ?onglet=bilan|analyses|humidite|amendements ouvre directement une rubrique (liens du menu).
// Suspense : la vue lit ?onglet=… (useSearchParams), ce qui impose une limite Suspense en Next.js 16.
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Chargement } from '@/components/ui/elements'
import VueSols from '@/components/vues/VueSols'

export const metadata: Metadata = { title: "Intelligence des sols · S'STACK" }

export default function PageSols() {
  return (
    <Suspense fallback={<Chargement texte="Chargement du carnet de sol…" hauteur="h-96" />}>
      <VueSols />
    </Suspense>
  )
}
