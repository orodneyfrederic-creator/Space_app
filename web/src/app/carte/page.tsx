// Page /carte : toutes les parcelles sur la carte du Gabon.
import CarteParcelles from '@/components/carte/CarteParcelles'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

export default function PageCarte() {
  return (
    <main className="flex flex-1 flex-col gap-4 overflow-auto px-5 pt-14 pb-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">Carte des parcelles</h1>
        <span className="text-[13px] text-muted">{PARCELLES_DEMO.length} parcelles suivies au Gabon</span>
      </header>
      <CarteParcelles parcelles={PARCELLES_DEMO} />
    </main>
  )
}
