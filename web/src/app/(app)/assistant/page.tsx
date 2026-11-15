// MODULE 06 — Assistant intelligent (/assistant).
// Accepte ?question=… pour préremplir la question.
// Suspense : la vue lit ?question=… (useSearchParams), ce qui impose une limite Suspense en Next.js 16.
import { Suspense } from 'react'
import { Chargement } from '@/components/ui/elements'
import VueAssistant from '@/components/vues/VueAssistant'

export default function PageAssistant() {
  return (
    <Suspense fallback={<Chargement texte="Préparation de l'assistant…" hauteur="h-96" />}>
      <VueAssistant />
    </Suspense>
  )
}
