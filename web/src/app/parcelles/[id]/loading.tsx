// Affiché pendant le chargement d'une fiche parcelle (exigé par Next.js 16 pour les pages dynamiques).
export default function ChargementParcelle() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-14 pb-4" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-44 animate-pulse rounded-[20px] bg-surface" />
      <div className="h-52 animate-pulse rounded-[20px] bg-surface" />
      <p className="m-0 text-center text-[13px] text-muted">Chargement de la fiche parcelle…</p>
    </main>
  )
}
