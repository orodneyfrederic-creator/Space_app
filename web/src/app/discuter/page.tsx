// Page /discuter : poser une question à l'agent, à l'écrit ou au micro.
// Suspense : la vue lit ?question=… (useSearchParams), ce qui impose une limite Suspense en Next.js 16.
import { Suspense } from 'react'
import { Chargement } from '@/components/ui/elements'
import VueDiscuter from '@/components/vues/VueDiscuter'

export default function PageDiscuter() {
  return (
    <Suspense fallback={<Chargement texte="Préparation de l'agent…" hauteur="h-96" />}>
      <VueDiscuter />
    </Suspense>
  )
}
