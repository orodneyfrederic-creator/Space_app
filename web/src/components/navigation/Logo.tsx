// Logo S'STACK simplifié : insigne aux trois couleurs de la charte + nom.
// Disque en CSS (pas de clipPath SVG à identifiant fixe : plusieurs logos sur la page, dont un masqué,
// faisaient perdre l'arrondi aux suivants).
export default function Logo({ clair = false, sousTitre }: { clair?: boolean; sousTitre?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="flex size-7 shrink-0 flex-col overflow-hidden rounded-full">
        <span className="flex-1 bg-[#009E60]" />
        <span className="flex-1 bg-[#FCD116]" />
        <span className="flex-1 bg-[#3A75C4]" />
      </span>
      <span className="flex flex-col">
        <span className={`font-display text-xl leading-tight font-bold tracking-[-0.3px] ${clair ? 'text-white' : 'text-ink'}`}>S&apos;STACK</span>
        {sousTitre && (
          <span className={`text-[9px] leading-none font-medium tracking-[0.12em] uppercase ${clair ? 'text-white/75' : 'text-muted'}`}>{sousTitre}</span>
        )}
      </span>
    </span>
  )
}
