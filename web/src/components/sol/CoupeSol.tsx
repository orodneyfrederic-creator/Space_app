'use client'
// Bloc de sol en 3D (perspective isométrique, SVG sans dépendance) : dessus en herbe avec une bouture de manioc,
// deux faces coupées qui montrent les 3 couches (surface, racines, profondeur).
// Couleur de chaque couche : du sec (Terre Latérite) au gorgé d'eau (Bleu Océan) ; gouttes d'eau en plus de la couleur.
// Animation continue, sans bouton lecture : les 30 jours défilent en boucle (pause plus longue sur le dernier jour),
// le ciel suit la pluie du jour affiché, la pluie tombe, les feuilles bougent, les gouttes ondulent.
// Accessibilité : un petit bouton « pause » (WCAG 2.2.2), arrêt quand l'onglet est caché, et aucune animation
// si le visiteur a demandé moins de mouvements (on affiche alors le dernier jour).
import { useEffect, useId, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { couleurHumidite, degres, ETATS_COUCHE, FLECHES, jourCourt, NOMS_COUCHES, nuancer, pourcent } from '@/lib/etat-sol'
import type { CoucheSol, EtatSol } from '@/lib/types'

// ── Géométrie isométrique (2:1) ──
const CX = 178 // sommet arrière du dessus
const TY = 126
const A = 136 // demi-largeur du losange
const B = 68 // demi-hauteur du losange
const T = { x: CX, y: TY }
const R = { x: CX + A, y: TY + B }
const BAS = { x: CX, y: TY + 2 * B } // coin avant
const L = { x: CX - A, y: TY + B }
const COUCHES: { nom: CoucheSol['nom']; y0: number; y1: number }[] = [
  { nom: 'surface', y0: 0, y1: 26 },
  { nom: 'racines', y0: 26, y1: 100 },
  { nom: 'profondeur', y0: 100, y1: 162 },
]
const NOMS: CoucheSol['nom'][] = ['surface', 'racines', 'profondeur']
const MAX_GOUTTES = 8
const DUREE_JOUR_MS = 650
const PAUSE_FIN_MS = 3200

const pt = (p: { x: number; y: number }, dy = 0) => `${p.x},${p.y + dy}`

// Emplacements des gouttes sur les faces : [face, u le long de l'arête, v dans l'épaisseur de la couche]
const EMPLACEMENTS: ['g' | 'd', number, number][] = [
  ['g', 0.3, 0.5], ['d', 0.65, 0.45], ['g', 0.62, 0.3], ['d', 0.3, 0.65],
  ['g', 0.15, 0.75], ['d', 0.85, 0.3], ['g', 0.82, 0.7], ['d', 0.5, 0.8],
]

function position(face: 'g' | 'd', u: number, y: number) {
  const depart = face === 'g' ? L : BAS
  const arrivee = face === 'g' ? BAS : R
  return { x: depart.x + u * (arrivee.x - depart.x), y: depart.y + u * (arrivee.y - depart.y) + y }
}

// ── Préférences du visiteur, suivies en direct ──
function useMoinsDeMouvement(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      const m = window.matchMedia('(prefers-reduced-motion: reduce)')
      m.addEventListener('change', rappel)
      return () => m.removeEventListener('change', rappel)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true, // rendu serveur : immobile
  )
}
function useOngletVisible(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      document.addEventListener('visibilitychange', rappel)
      return () => document.removeEventListener('visibilitychange', rappel)
    },
    () => document.visibilityState === 'visible',
    () => false,
  )
}

function Goutte({ x, y, visible, delai }: { x: number; y: number; visible: boolean; delai: number }) {
  return (
    <g opacity={visible ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none">
      <path
        className="coupe-goutte"
        style={{ '--delai': `${delai}ms` } as CSSProperties}
        d={`M${x} ${y - 6} C ${x + 4.2} ${y - 0.5}, ${x + 4.2} ${y + 3.8}, ${x} ${y + 3.8} C ${x - 4.2} ${y + 3.8}, ${x - 4.2} ${y - 0.5}, ${x} ${y - 6} Z`}
        fill="#FFFFFF"
        fillOpacity={0.92}
        stroke="#111A14"
        strokeOpacity={0.3}
      />
    </g>
  )
}

/** Ciel du jour affiché : pluie (≥ 5 mm), soleil (< 1 mm), sinon soleil voilé. Aucun chiffre inventé. */
function Ciel({ pluie }: { pluie: number | null }) {
  const pluvieux = pluie !== null && pluie >= 5
  const sec = pluie !== null && pluie < 1
  return (
    <g aria-hidden="true">
      {!pluvieux && (
        <g>
          {sec && (
            <g className="coupe-rayons">
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i * Math.PI) / 5
                return <line key={i} x1={372 + Math.cos(a) * 26} y1={52 + Math.sin(a) * 26} x2={372 + Math.cos(a) * 34} y2={52 + Math.sin(a) * 34} stroke="#E5BC12" strokeWidth={3} strokeLinecap="round" />
              })}
            </g>
          )}
          <circle cx={372} cy={52} r={sec ? 19 : 15} fill="#FCD116" stroke="#C9A200" strokeWidth={1.5} />
        </g>
      )}
      {!sec && (
        <g className="coupe-nuage">
          <path
            d="M272 74 a15 15 0 0 1 3-29 a21 21 0 0 1 39-6 a15 15 0 0 1 23 12 a12 12 0 0 1-2 23 Z"
            fill={pluvieux ? '#9DB8DE' : pluie === null ? '#E0D9C6' : '#FFFFFF'}
            stroke="#535B53"
            strokeOpacity={0.35}
            strokeWidth={1.5}
          />
        </g>
      )}
      {pluvieux && (
        <g className="coupe-pluie">
          {[280, 292, 304, 316, 328, 286, 310, 322].map((x, i) => (
            <line key={i} x1={x} y1={84 + (i % 3) * 6} x2={x - 3} y2={94 + (i % 3) * 6} stroke="#3A75C4" strokeWidth={2.2} strokeLinecap="round" style={{ '--delai': `${i * 110}ms` } as CSSProperties} />
          ))}
        </g>
      )}
    </g>
  )
}

/** Bouture de manioc : tige brune, feuilles palmées (5 lobes), légèrement balancée. */
function Manioc() {
  const base = { x: CX, y: TY + B } // centre du dessus
  const feuille = (cx: number, cy: number, r: number, rotation: number) => (
    <g transform={`rotate(${rotation} ${cx} ${cy})`}>
      {[-64, -32, 0, 32, 64].map((a) => (
        <ellipse key={a} cx={cx} cy={cy - r * 0.55} rx={r * 0.17} ry={r * 0.55} transform={`rotate(${a} ${cx} ${cy})`} fill="#009E60" stroke="#0B5D3B" strokeWidth={1} />
      ))}
    </g>
  )
  return (
    <g aria-hidden="true">
      <ellipse cx={base.x} cy={base.y + 2} rx={20} ry={8} fill="#111A14" opacity={0.16} />
      <g className="coupe-plante" style={{ transformOrigin: `${base.x}px ${base.y}px` }}>
        <path d={`M${base.x} ${base.y} L${base.x - 1} ${base.y - 74}`} stroke="#7A5634" strokeWidth={6} strokeLinecap="round" />
        <path d={`M${base.x - 1} ${base.y - 40} Q ${base.x - 18} ${base.y - 52} ${base.x - 26} ${base.y - 66}`} stroke="#7A5634" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d={`M${base.x} ${base.y - 52} Q ${base.x + 16} ${base.y - 62} ${base.x + 26} ${base.y - 76}`} stroke="#7A5634" strokeWidth={3} fill="none" strokeLinecap="round" />
        {feuille(base.x - 28, base.y - 66, 24, -25)}
        {feuille(base.x + 28, base.y - 77, 24, 25)}
        {feuille(base.x - 1, base.y - 78, 26, 0)}
      </g>
    </g>
  )
}

/** Touffes d'herbe sur le dessus (positions fixes, à l'intérieur du losange). */
const HERBES: [number, number][] = [
  [-80, 6], [-55, -14], [-30, 22], [40, -22], [70, 10], [95, -2], [20, 36], [-100, 0], [-10, -40], [55, 30],
]

/** Couleur du thermomètre : Jaune Soleil, vers Terre Latérite au-delà de 35 °C */
const couleurTemp = (t: number) => (t >= 35 ? '#B4532A' : t >= 30 ? '#E5A12A' : '#FCD116')

export default function CoupeSol({ etat }: { etat: EtatSol }) {
  const serie = etat.serie
  const dernier = Math.max(0, serie.length - 1)
  const [jourAnime, setJourAnime] = useState(dernier)
  const [pause, setPause] = useState(false)
  const [tableau, setTableau] = useState(false)
  const moinsDeMouvement = useMoinsDeMouvement()
  const ongletVisible = useOngletVisible()
  const id = useId()

  const anime = !moinsDeMouvement && !pause && ongletVisible && serie.length > 1
  const jour = moinsDeMouvement ? dernier : Math.min(jourAnime, dernier)

  // Boucle continue : un jour toutes les 650 ms, pause plus longue sur le dernier jour, puis on recommence
  useEffect(() => {
    if (!anime) return
    const minuteur = window.setTimeout(() => setJourAnime((j) => (j >= dernier ? 0 : j + 1)), jour >= dernier ? PAUSE_FIN_MS : DUREE_JOUR_MS)
    return () => window.clearTimeout(minuteur)
  }, [anime, jour, dernier])

  const point = serie[jour]
  const aujourdhui = jour === dernier
  const indices: Record<CoucheSol['nom'], number | null> = {
    surface: point?.surface ?? null,
    racines: point?.racines ?? null,
    profondeur: point?.profondeur ?? null,
  }
  const temp = point?.tempSurface ?? null
  const couche = (nom: CoucheSol['nom']) => etat.couches.find((c) => c.nom === nom)

  // Description pour les lecteurs d'écran : toujours le dernier jour publié (l'animation n'est pas lue en boucle)
  const derniereDescription = NOMS.map((n) => {
    const c = couche(n)
    const nomLong = n === 'surface' ? 'Sol en surface' : n === 'racines' ? 'zone des racines' : 'profondeur'
    return `${nomLong} ${c ? `${ETATS_COUCHE[c.etat]} ` : ''}(${pourcent(c?.indice ?? null)})`
  }).join(', ')
  const description = `${etat.dernierJour ? `Le ${jourCourt(etat.dernierJour)} : ` : ''}${derniereDescription}. Température de surface ${degres(etat.tempSurface.actuelle)}.`

  const fondDessus = nuancer(couleurHumidite(indices.surface), 1.06)
  // Thermomètre : 15 °C en bas, 45 °C en haut
  const haut = 150
  const basTube = 286
  const niveau = temp === null ? basTube : basTube - ((Math.min(45, Math.max(15, temp)) - 15) / 30) * (basTube - haut)

  return (
    <figure data-visite="coupe" className="m-0 flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <figcaption className="font-display text-base font-semibold text-ink">Votre sol, couche par couche</figcaption>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-2">{point ? (aujourdhui ? `${jourCourt(point.date)} · aujourd'hui` : jourCourt(point.date)) : '—'}</span>
          {!moinsDeMouvement && serie.length > 1 && (
            <button
              type="button"
              onClick={() => setPause((p) => !p)}
              aria-label={pause ? 'Reprendre l\'animation' : 'Mettre l\'animation en pause'}
              title={pause ? 'Reprendre l\'animation' : 'Mettre l\'animation en pause'}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-[11px] text-muted-2 hover:border-accent hover:text-accent"
            >
              <span aria-hidden="true">{pause ? '▶' : '❚❚'}</span>
            </button>
          )}
        </div>
      </div>

      <svg viewBox="0 0 460 432" role="img" aria-labelledby={`${id}-titre ${id}-desc`} className="h-auto w-full max-w-[480px] self-center">
        <title id={`${id}-titre`}>Bloc de sol en 3D</title>
        <desc id={`${id}-desc`}>{description}</desc>
        <defs>
          <linearGradient id={`${id}-ombre`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#111A14" stopOpacity="0" />
            <stop offset="1" stopColor="#111A14" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        <Ciel pluie={point?.pluie ?? null} />

        {/* Ombre portée du bloc */}
        <ellipse cx={CX + 10} cy={BAS.y + 170} rx={150} ry={16} fill="#111A14" opacity={0.1} />

        {/* Faces avant (gauche et droite) : les 3 couches */}
        {COUCHES.map(({ nom, y0, y1 }) => {
          const base = couleurHumidite(indices[nom])
          return (
            <g key={nom}>
              <polygon className="coupe-face" points={`${pt(L, y0)} ${pt(BAS, y0)} ${pt(BAS, y1)} ${pt(L, y1)}`} fill={nuancer(base, 0.92)} />
              <polygon className="coupe-face" points={`${pt(BAS, y0)} ${pt(R, y0)} ${pt(R, y1)} ${pt(BAS, y1)}`} fill={nuancer(base, 0.8)} />
              {y0 > 0 && <polyline points={`${pt(L, y0)} ${pt(BAS, y0)} ${pt(R, y0)}`} fill="none" stroke="#111A14" strokeOpacity={0.22} strokeDasharray="5 4" />}
              {EMPLACEMENTS.map(([face, u, v], k) => {
                const p = position(face, u, y0 + 6 + v * (y1 - y0 - 12))
                return <Goutte key={k} x={p.x} y={p.y} visible={k < Math.round((indices[nom] ?? 0) * MAX_GOUTTES)} delai={k * 350} />
              })}
            </g>
          )
        })}
        {/* Assombrissement vers le bas, pour le volume */}
        <polygon points={`${pt(L, 0)} ${pt(BAS, 0)} ${pt(R, 0)} ${pt(R, 162)} ${pt(BAS, 162)} ${pt(L, 162)}`} fill={`url(#${id}-ombre)`} />

        {/* Racines visibles sur la coupe, depuis le coin avant */}
        <g aria-hidden="true" stroke="#5B4026" strokeOpacity={0.75} fill="none" strokeLinecap="round">
          <path d={`M${BAS.x} ${BAS.y + 4} C ${BAS.x - 6} ${BAS.y + 30}, ${BAS.x - 30} ${BAS.y + 50}, ${BAS.x - 52} ${BAS.y + 80}`} strokeWidth={2.2} />
          <path d={`M${BAS.x - 14} ${BAS.y + 38} C ${BAS.x - 24} ${BAS.y + 52}, ${BAS.x - 22} ${BAS.y + 70}, ${BAS.x - 30} ${BAS.y + 92}`} strokeWidth={1.4} />
          <path d={`M${BAS.x} ${BAS.y + 4} C ${BAS.x + 4} ${BAS.y + 34}, ${BAS.x + 4} ${BAS.y + 60}, ${BAS.x + 2} ${BAS.y + 94}`} strokeWidth={2} />
          <path d={`M${BAS.x} ${BAS.y + 4} C ${BAS.x + 10} ${BAS.y + 26}, ${BAS.x + 34} ${BAS.y + 44}, ${BAS.x + 56} ${BAS.y + 72}`} strokeWidth={2.2} />
          <path d={`M${BAS.x + 26} ${BAS.y + 40} C ${BAS.x + 32} ${BAS.y + 54}, ${BAS.x + 44} ${BAS.y + 62}, ${BAS.x + 48} ${BAS.y + 86}`} strokeWidth={1.4} />
        </g>

        {/* Dessus : terre et herbe */}
        <polygon className="coupe-face" points={`${pt(T)} ${pt(R)} ${pt(BAS)} ${pt(L)}`} fill={fondDessus} />
        <polygon points={`${pt(T)} ${pt(R)} ${pt(BAS)} ${pt(L)}`} fill="#3E8E4A" opacity={0.5} />
        {HERBES.map(([dx, dy], i) => {
          const x = CX + dx
          const y = TY + B + dy
          return <path key={i} aria-hidden="true" d={`M${x - 5} ${y} L${x - 2} ${y - 9} L${x} ${y} L${x + 3} ${y - 10} L${x + 5} ${y}`} fill="none" stroke="#0B5D3B" strokeWidth={1.6} strokeLinejoin="round" />
        })}
        {/* Arêtes */}
        <g fill="none" stroke="#111A14" strokeOpacity={0.35} strokeWidth={1.2} strokeLinejoin="round">
          <polygon points={`${pt(T)} ${pt(R)} ${pt(BAS)} ${pt(L)}`} />
          <polyline points={`${pt(L)} ${pt(L, 162)} ${pt(BAS, 162)} ${pt(R, 162)} ${pt(R)}`} />
          <line x1={BAS.x} y1={BAS.y} x2={BAS.x} y2={BAS.y + 162} />
        </g>

        <Manioc />

        {/* Thermomètre de surface */}
        <g>
          <rect x={10} y={haut - 4} width={12} height={basTube - haut + 8} rx={6} fill="#FFFFFF" stroke="#535B53" strokeWidth={1.5} />
          <rect x={13} y={niveau} width={6} height={basTube - niveau + 4} rx={3} fill={temp === null ? '#D2C9B1' : couleurTemp(temp)} />
          <circle cx={16} cy={basTube + 10} r={9} fill={temp === null ? '#D2C9B1' : couleurTemp(temp)} stroke="#535B53" strokeWidth={1.5} />
          <text x={17} y={basTube + 36} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111A14" fontFamily="var(--font-mono)">
            {temp === null ? '—' : `${Math.round(temp)}°`}
          </text>
          <text x={17} y={basTube + 50} textAnchor="middle" fontSize={10} fill="#434A43">
            surface
          </text>
        </g>

        {/* Étiquettes directes, reliées à la face droite */}
        {COUCHES.map(({ nom, y0, y1 }) => {
          const c = couche(nom)
          const v = indices[nom]
          const yFace = R.y + (y0 + y1) / 2
          const cy = nom === 'surface' ? yFace - 18 : yFace - 10
          return (
            <g key={`e-${nom}`}>
              <line x1={R.x + 2} y1={yFace} x2={R.x + 12} y2={cy + 4} stroke="#111A14" strokeOpacity={0.4} />
              <text x={R.x + 16} y={cy} fontSize={13} fontWeight={700} fill="#111A14">
                {NOMS_COUCHES[nom]} · <tspan fontFamily="var(--font-mono)">{pourcent(v)}</tspan>
              </text>
              <text x={R.x + 16} y={cy + 15} fontSize={12} fill="#434A43">
                {aujourdhui && c ? `${ETATS_COUCHE[c.etat]}${c.tendance7j ? ` ${FLECHES[c.tendance7j]}` : ''}` : ' '}
              </text>
              <rect x={R.x + 16} y={cy + 21} width={112} height={5} rx={2.5} fill="#EFEADD" />
              <rect x={R.x + 16} y={cy + 21} width={v === null ? 0 : 112 * v} height={5} rx={2.5} fill={couleurHumidite(v)} className="transition-[width,fill] duration-500 motion-reduce:transition-none" />
              {c?.normale != null && (
                <line x1={R.x + 16 + 112 * c.normale} x2={R.x + 16 + 112 * c.normale} y1={cy + 18} y2={cy + 29} stroke="#111A14" strokeWidth={1.5} strokeDasharray="2 2" />
              )}
            </g>
          )
        })}
        <text x={R.x + 16} y={424} fontSize={10} fill="#434A43">
          ┆ normale du mois
        </text>
      </svg>

      {/* Frise des 30 jours (avance toute seule) */}
      {serie.length > 1 && (
        <div className="flex flex-col gap-1" aria-hidden="true">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full bg-accent ${jour === 0 ? '' : 'transition-[width] duration-500 ease-linear'}`}
              style={{ width: `${dernier === 0 ? 100 : (jour / dernier) * 100}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted">
            <span>{serie[0] ? jourCourt(serie[0].date) : ''}</span>
            <span>les 30 derniers jours</span>
            <span>{serie[dernier] ? jourCourt(serie[dernier].date) : ''}</span>
          </div>
        </div>
      )}

      {/* Échelle de couleur */}
      <div className="flex items-center gap-2 text-[12px] text-muted-2">
        <span>sec</span>
        <span aria-hidden="true" className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((v) => couleurHumidite(v)).join(', ')})` }} />
        <span>gorgé d&apos;eau</span>
      </div>

      <button
        type="button"
        onClick={() => setTableau((t) => !t)}
        aria-expanded={tableau}
        className="min-h-11 self-start rounded-xl border-0 bg-transparent px-0 font-sans text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        {tableau ? 'Masquer le tableau' : 'Voir en tableau'}
      </button>
      {tableau && (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="mb-1 text-left text-xs text-muted">Valeurs du dernier jour publié · normale = moyenne NASA du mois</caption>
          <thead>
            <tr className="border-b border-line text-muted-2">
              <th className="py-1.5 font-semibold">Couche</th>
              <th className="py-1.5 font-semibold">Humidité</th>
              <th className="py-1.5 font-semibold">État</th>
              <th className="py-1.5 font-semibold">Normale</th>
            </tr>
          </thead>
          <tbody>
            {NOMS.map((n) => {
              const c = couche(n)
              return (
                <tr key={n} className="border-b border-line-soft">
                  <td className="py-1.5">{NOMS_COUCHES[n]}</td>
                  <td className="py-1.5 font-mono">{pourcent(c?.indice ?? null)}</td>
                  <td className="py-1.5">{c ? ETATS_COUCHE[c.etat] : '—'}</td>
                  <td className="py-1.5 font-mono">{pourcent(c?.normale ?? null)}</td>
                </tr>
              )
            })}
            <tr>
              <td className="py-1.5">Température de surface</td>
              <td className="py-1.5 font-mono">{degres(etat.tempSurface.actuelle)}</td>
              <td className="py-1.5">—</td>
              <td className="py-1.5 font-mono">{degres(etat.tempSurface.normale)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </figure>
  )
}

/** Squelette à la forme du bloc (pendant le chargement). */
export function SqueletteCoupe() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="h-5 w-1/2 rounded bg-line-soft" />
      <svg viewBox="0 0 460 432" className="h-auto w-full max-w-[480px] self-center">
        <polygon points={`${pt(T)} ${pt(R)} ${pt(BAS)} ${pt(L)}`} fill="#E0D9C6" />
        <polygon points={`${pt(L)} ${pt(BAS)} ${pt(BAS, 162)} ${pt(L, 162)}`} fill="#D2C9B1" />
        <polygon points={`${pt(BAS)} ${pt(R)} ${pt(R, 162)} ${pt(BAS, 162)}`} fill="#C9BFA4" />
      </svg>
    </div>
  )
}
