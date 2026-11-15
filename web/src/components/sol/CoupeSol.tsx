'use client'
// Coupe du sol en SVG (aucune dépendance) : ciel, bouture de manioc, 3 couches (surface, racines, profondeur)
// colorées du sec (Terre Latérite) au saturé (Bleu Océan), gouttes d'eau proportionnelles à l'humidité
// (l'information ne repose pas sur la couleur seule), thermomètre de surface, étiquettes directes.
// « Rejouer le mois » : curseur sur les 30 jours de la série, lecture à 1 jour toutes les 300 ms.
// On n'anime que fill, opacity et transform ; rien ne bouge seul (et transitions coupées si moins d'animations).
import { useEffect, useId, useState } from 'react'
import { couleurHumidite, degres, ETATS_COUCHE, FLECHES, jourCourt, NOMS_COUCHES, pourcent } from '@/lib/etat-sol'
import type { CoucheSol, EtatSol } from '@/lib/types'

const X0 = 46 // bord gauche du bloc de sol
const X1 = 214 // bord droit
const SOL = 110 // ligne du sol
const COUCHES: { nom: CoucheSol['nom']; y: number; h: number }[] = [
  { nom: 'surface', y: SOL, h: 42 },
  { nom: 'racines', y: SOL + 42, h: 134 },
  { nom: 'profondeur', y: SOL + 176, h: 124 },
]
const TIGE_X = 132
const MAX_GOUTTES = 8

// Positions des gouttes (fractions de la couche), à l'écart de la tige et des racines
const POSITIONS: Record<CoucheSol['nom'], [number, number][]> = {
  surface: [[0.08, 0.5], [0.2, 0.3], [0.32, 0.65], [0.44, 0.35], [0.66, 0.6], [0.76, 0.3], [0.86, 0.62], [0.95, 0.4]],
  racines: [[0.1, 0.15], [0.22, 0.55], [0.12, 0.85], [0.3, 0.3], [0.74, 0.2], [0.88, 0.5], [0.72, 0.78], [0.92, 0.9]],
  profondeur: [[0.12, 0.25], [0.3, 0.6], [0.16, 0.82], [0.46, 0.3], [0.6, 0.72], [0.78, 0.25], [0.9, 0.62], [0.68, 0.45]],
}

const TRANSITION = 'transition-[fill,opacity] duration-300 ease-out motion-reduce:transition-none'

function Goutte({ x, y, visible }: { x: number; y: number; visible: boolean }) {
  return (
    <path
      d={`M${x} ${y - 6} C ${x + 4.5} ${y - 0.5}, ${x + 4.5} ${y + 4}, ${x} ${y + 4} C ${x - 4.5} ${y + 4}, ${x - 4.5} ${y - 0.5}, ${x} ${y - 6} Z`}
      fill="#FFFFFF"
      fillOpacity={0.9}
      stroke="#111A14"
      strokeOpacity={0.35}
      strokeWidth={1}
      className={TRANSITION}
      opacity={visible ? 1 : 0}
    />
  )
}

/** Icône du ciel, déduite des données (aucun chiffre inventé) */
function Ciel({ pluie7, temp }: { pluie7: number | null; temp: number | null }) {
  const pluvieux = pluie7 !== null && pluie7 >= 20
  const ensoleille = !pluvieux && pluie7 !== null && pluie7 < 5 && temp !== null && temp > 30
  const soleil = (
    <g>
      <circle cx={ensoleille ? 170 : 158} cy={42} r={ensoleille ? 17 : 13} fill="#FCD116" stroke="#C9A200" strokeWidth={1.5} />
      {ensoleille &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return <line key={i} x1={170 + Math.cos(a) * 23} y1={42 + Math.sin(a) * 23} x2={170 + Math.cos(a) * 30} y2={42 + Math.sin(a) * 30} stroke="#C9A200" strokeWidth={2.5} strokeLinecap="round" />
        })}
    </g>
  )
  const nuage = (
    <path d="M96 58 a14 14 0 0 1 4-27 a19 19 0 0 1 36-4 a14 14 0 0 1 20 13 a11 11 0 0 1-2 18 Z" fill={pluvieux ? '#A9C4E8' : '#FFFFFF'} stroke="#535B53" strokeOpacity={0.4} strokeWidth={1.5} />
  )
  return (
    <g aria-hidden="true" transform="translate(58 -8)">
      {!pluvieux && soleil}
      {!ensoleille && nuage}
      {pluvieux &&
        [104, 118, 132, 146].map((x, i) => (
          <line key={x} x1={x} y1={66 + (i % 2) * 4} x2={x - 4} y2={78 + (i % 2) * 4} stroke="#3A75C4" strokeWidth={2.5} strokeLinecap="round" />
        ))}
    </g>
  )
}

/** Couleur du thermomètre : Jaune Soleil, vers Terre Latérite au-delà de 35 °C */
const couleurTemp = (t: number) => (t >= 35 ? '#B4532A' : t >= 30 ? '#E5A12A' : '#FCD116')

export default function CoupeSol({ etat }: { etat: EtatSol }) {
  const serie = etat.serie
  const dernier = Math.max(0, serie.length - 1)
  const [jour, setJour] = useState(dernier)
  const [lecture, setLecture] = useState(false)
  const [tableau, setTableau] = useState(false)
  const id = useId()

  // Lecture : un jour toutes les 300 ms ; elle s'arrête d'elle-même au dernier jour (état déduit)
  const enLecture = lecture && jour < dernier
  useEffect(() => {
    if (!enLecture) return
    const minuteur = window.setInterval(() => setJour((j) => Math.min(j + 1, dernier)), 300)
    return () => window.clearInterval(minuteur)
  }, [enLecture, dernier])

  const point = serie[jour]
  const estAujourdhui = jour === dernier
  const indices: Record<CoucheSol['nom'], number | null> = {
    surface: point?.surface ?? null,
    racines: point?.racines ?? null,
    profondeur: point?.profondeur ?? null,
  }
  const temp = point?.tempSurface ?? null
  const couche = (nom: CoucheSol['nom']) => etat.couches.find((c) => c.nom === nom)

  const resume = (['surface', 'racines', 'profondeur'] as const)
    .map((n) => {
      const c = couche(n)
      const nomLong = n === 'surface' ? 'Sol en surface' : n === 'racines' ? 'zone des racines' : 'profondeur'
      return `${nomLong} ${estAujourdhui && c ? ETATS_COUCHE[c.etat] + ' ' : ''}(${pourcent(indices[n])})`
    })
    .join(', ')
  const description = `${point ? `Le ${jourCourt(point.date)} : ` : ''}${resume}. Température de surface ${degres(temp)}.`

  // Thermomètre : 15 °C en bas, 45 °C en haut
  const hautTube = 26
  const basTube = 118
  const niveau = temp === null ? basTube : basTube - ((Math.min(45, Math.max(15, temp)) - 15) / 30) * (basTube - hautTube)

  return (
    <figure data-visite="coupe" className="m-0 flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption className="font-display text-base font-semibold text-ink">Votre sol, couche par couche</figcaption>
        <span className="font-mono text-sm text-muted-2" aria-live="polite">
          {point ? (estAujourdhui ? `${jourCourt(point.date)} · dernier jour` : jourCourt(point.date)) : '—'}
        </span>
      </div>

      <svg viewBox="0 0 360 420" role="img" aria-labelledby={`${id}-titre ${id}-desc`} className="h-auto w-full max-w-[420px] self-center">
        <title id={`${id}-titre`}>Coupe du sol</title>
        <desc id={`${id}-desc`}>{description}</desc>

        <Ciel pluie7={etat.pluie7} temp={etat.tempSurface.actuelle} />

        {/* Couches */}
        {COUCHES.map(({ nom, y, h }, i) => {
          const fond = couleurHumidite(indices[nom])
          const derniere = i === COUCHES.length - 1
          return (
            <g key={nom}>
              <path
                d={derniere ? `M${X0} ${y} H${X1} V${y + h - 14} Q${X1} ${y + h} ${X1 - 14} ${y + h} H${X0 + 14} Q${X0} ${y + h} ${X0} ${y + h - 14} Z` : `M${X0} ${y} H${X1} V${y + h} H${X0} Z`}
                fill={fond}
                className={TRANSITION}
              />
              {i > 0 && <line x1={X0} x2={X1} y1={y} y2={y} stroke="#111A14" strokeOpacity={0.18} strokeDasharray="4 4" />}
              {POSITIONS[nom].map(([fx, fy], k) => (
                <Goutte key={k} x={X0 + fx * (X1 - X0)} y={y + 8 + fy * (h - 16)} visible={k < Math.round((indices[nom] ?? 0) * MAX_GOUTTES)} />
              ))}
            </g>
          )
        })}

        {/* Bouture de manioc : tige, 2 feuilles, racines dans la zone des racines */}
        <g aria-hidden="true">
          <path d={`M${TIGE_X} ${SOL + 42} C ${TIGE_X - 14} ${SOL + 80}, ${TIGE_X - 30} ${SOL + 110}, ${TIGE_X - 40} ${SOL + 150}`} stroke="#6B4A2B" strokeWidth={2} fill="none" />
          <path d={`M${TIGE_X} ${SOL + 42} C ${TIGE_X + 6} ${SOL + 90}, ${TIGE_X + 4} ${SOL + 120}, ${TIGE_X + 8} ${SOL + 165}`} stroke="#6B4A2B" strokeWidth={2} fill="none" />
          <path d={`M${TIGE_X} ${SOL + 42} C ${TIGE_X + 16} ${SOL + 75}, ${TIGE_X + 34} ${SOL + 100}, ${TIGE_X + 42} ${SOL + 135}`} stroke="#6B4A2B" strokeWidth={2} fill="none" />
          <rect x={TIGE_X - 4} y={SOL - 52} width={8} height={52 + 46} rx={3} fill="#8A6A45" stroke="#5B4026" strokeWidth={1} />
          <path d={`M${TIGE_X} ${SOL - 44} C ${TIGE_X - 30} ${SOL - 62}, ${TIGE_X - 44} ${SOL - 44}, ${TIGE_X - 44} ${SOL - 36} C ${TIGE_X - 28} ${SOL - 34}, ${TIGE_X - 12} ${SOL - 38}, ${TIGE_X} ${SOL - 44} Z`} fill="#009E60" stroke="#0B5D3B" strokeWidth={1.2} />
          <path d={`M${TIGE_X} ${SOL - 30} C ${TIGE_X + 28} ${SOL - 50}, ${TIGE_X + 44} ${SOL - 34}, ${TIGE_X + 46} ${SOL - 24} C ${TIGE_X + 28} ${SOL - 20}, ${TIGE_X + 12} ${SOL - 24}, ${TIGE_X} ${SOL - 30} Z`} fill="#009E60" stroke="#0B5D3B" strokeWidth={1.2} />
        </g>
        <line x1={X0 - 6} x2={X1 + 6} y1={SOL} y2={SOL} stroke="#6B4A2B" strokeWidth={2.5} strokeLinecap="round" />

        {/* Thermomètre de surface */}
        <g>
          <rect x={14} y={hautTube - 4} width={12} height={basTube - hautTube + 8} rx={6} fill="#FFFFFF" stroke="#535B53" strokeWidth={1.5} />
          <rect x={17} y={niveau} width={6} height={basTube - niveau + 4} rx={3} fill={temp === null ? '#D2C9B1' : couleurTemp(temp)} className="transition-[y,height,fill] duration-300 motion-reduce:transition-none" />
          <circle cx={20} cy={basTube + 10} r={9} fill={temp === null ? '#D2C9B1' : couleurTemp(temp)} stroke="#535B53" strokeWidth={1.5} />
          <text x={22} y={basTube + 36} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111A14" fontFamily="var(--font-mono)">
            {temp === null ? '—' : `${Math.round(temp)}°`}
          </text>
          <text x={22} y={basTube + 50} textAnchor="middle" fontSize={10} fill="#434A43">surface</text>
        </g>

        {/* Étiquettes directes */}
        {COUCHES.map(({ nom, y, h }) => {
          const c = couche(nom)
          const cy = nom === 'surface' ? y + 13 : y + h / 2 - 12
          const v = indices[nom]
          return (
            <g key={`e-${nom}`}>
              <text x={X1 + 12} y={cy} fontSize={13} fontWeight={700} fill="#111A14">
                {NOMS_COUCHES[nom]} · <tspan fontFamily="var(--font-mono)">{pourcent(v)}</tspan>
              </text>
              <text x={X1 + 12} y={cy + 15} fontSize={12} fill="#434A43">
                {estAujourdhui && c ? `${ETATS_COUCHE[c.etat]}${c.tendance7j ? ` ${FLECHES[c.tendance7j]}` : ''}` : ' '}
              </text>
              {/* Mini-jauge avec la normale du mois en pointillé */}
              <rect x={X1 + 12} y={cy + 21} width={110} height={5} rx={2.5} fill="#EFEADD" />
              <rect x={X1 + 12} y={cy + 21} width={v === null ? 0 : 110 * v} height={5} rx={2.5} fill={couleurHumidite(v)} className="transition-[width,fill] duration-300 motion-reduce:transition-none" />
              {c?.normale != null && (
                <line x1={X1 + 12 + 110 * c.normale} x2={X1 + 12 + 110 * c.normale} y1={cy + 18} y2={cy + 29} stroke="#111A14" strokeWidth={1.5} strokeDasharray="2 2" />
              )}
            </g>
          )
        })}
        <text x={X1 + 12} y={410} fontSize={10} fill="#434A43">
          ┆ normale du mois
        </text>
      </svg>

      {/* Rejouer le mois */}
      {serie.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (enLecture) {
                setLecture(false)
                return
              }
              if (jour >= dernier) setJour(0)
              setLecture(true)
            }}
            aria-pressed={enLecture}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 font-sans text-sm font-semibold text-ink hover:border-accent"
          >
            <span aria-hidden="true">{enLecture ? '❚❚' : '▶'}</span>
            {enLecture ? 'Pause' : 'Rejouer le mois'}
          </button>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Jour affiché</span>
            <input
              type="range"
              min={0}
              max={dernier}
              value={jour}
              onChange={(e) => {
                setLecture(false)
                setJour(Number(e.target.value))
              }}
              aria-valuetext={point ? jourCourt(point.date) : undefined}
              className="w-full cursor-pointer accent-accent"
            />
            <span className="flex justify-between font-mono text-[11px] text-muted">
              <span>{serie[0] ? jourCourt(serie[0].date) : ''}</span>
              <span>{serie[dernier] ? jourCourt(serie[dernier].date) : ''}</span>
            </span>
          </label>
        </div>
      )}

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
          <caption className="mb-1 text-left text-xs text-muted">{point ? `Valeurs du ${jourCourt(point.date)}` : 'Valeurs'} · normale = moyenne NASA du mois</caption>
          <thead>
            <tr className="border-b border-line text-muted-2">
              <th className="py-1.5 font-semibold">Couche</th>
              <th className="py-1.5 font-semibold">Humidité</th>
              <th className="py-1.5 font-semibold">État</th>
              <th className="py-1.5 font-semibold">Normale</th>
            </tr>
          </thead>
          <tbody>
            {(['surface', 'racines', 'profondeur'] as const).map((n) => {
              const c = couche(n)
              return (
                <tr key={n} className="border-b border-line-soft">
                  <td className="py-1.5">{NOMS_COUCHES[n]}</td>
                  <td className="py-1.5 font-mono">{pourcent(indices[n])}</td>
                  <td className="py-1.5">{estAujourdhui && c ? ETATS_COUCHE[c.etat] : '—'}</td>
                  <td className="py-1.5 font-mono">{pourcent(c?.normale ?? null)}</td>
                </tr>
              )
            })}
            <tr>
              <td className="py-1.5">Température de surface</td>
              <td className="py-1.5 font-mono">{degres(temp)}</td>
              <td className="py-1.5">—</td>
              <td className="py-1.5 font-mono">{degres(etat.tempSurface.normale)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </figure>
  )
}

/** Squelette à la forme de la coupe (pendant le chargement). */
export function SqueletteCoupe() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="h-5 w-1/2 rounded bg-line-soft" />
      <div className="mx-auto flex aspect-[360/420] w-full max-w-[420px] flex-col justify-end gap-1 pb-2">
        <div className="h-[10%] w-[47%] rounded bg-line-soft" />
        <div className="h-[32%] w-[47%] rounded bg-line-soft" />
        <div className="h-[30%] w-[47%] rounded-b-xl bg-line-soft" />
      </div>
    </div>
  )
}
