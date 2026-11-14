// Logo S'STACK simplifié : insigne aux trois couleurs de la charte + nom.
export default function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30" className="shrink-0">
        <clipPath id="logo-disque">
          <circle cx="15" cy="15" r="14" />
        </clipPath>
        <g clipPath="url(#logo-disque)">
          <rect width="30" height="10" fill="#009E60" />
          <rect y="10" width="30" height="10" fill="#FCD116" />
          <rect y="20" width="30" height="10" fill="#3A75C4" />
        </g>
      </svg>
      <span className={`font-display text-xl font-bold tracking-[-0.3px] ${clair ? 'text-white' : 'text-ink'}`}>S&apos;STACK</span>
    </span>
  )
}
