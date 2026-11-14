// Page /carte : toutes les parcelles sur la carte du Gabon.
import CarteParcelles from '@/components/carte/CarteParcelles'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

export default function PageCarte() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Carte des parcelles</h1>
      <CarteParcelles parcelles={PARCELLES_DEMO} />
    </main>
  )
}
