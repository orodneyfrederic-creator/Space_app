// Écran d'attente d'une fiche de site (Next.js 16 l'utilise comme limite Suspense pour les pages dynamiques).
export default function ChargementParcelle() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-line-soft" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[20px] bg-surface" />
        <div className="h-80 animate-pulse rounded-[20px] bg-surface" />
      </div>
      <p className="m-0 text-center text-[13px] text-muted">Chargement de la fiche…</p>
    </div>
  )
}
