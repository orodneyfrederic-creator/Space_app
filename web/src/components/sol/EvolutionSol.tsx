'use client'
// Évolution sur 30 jours, en « petits multiples » alignés sur le même axe des dates (pas de double axe) :
//  1. humidité du sol (%) : surface, racines, profondeur, étiquetées en bout de ligne, normale des racines en pointillé ;
//  2. température (°C) : surface du sol et air (max) ;
//  3. pluie (mm/jour) : barres.
// recharts : isAnimationActive={false} (sinon graphiques vides dans les captures).
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { jourCourt } from '@/lib/etat-sol'
import type { EtatSol } from '@/lib/types'

const COULEURS = { surface: '#B4532A', racines: '#0B5D3B', profondeur: '#3A75C4', tempSurface: '#B4532A', tmax: '#535B53', pluie: '#3A75C4' }
const NOMS: Record<string, string> = {
  surface: 'Surface',
  racines: 'Racines',
  profondeur: 'Profondeur',
  tempSurface: 'Surface du sol',
  tmax: 'Air (max)',
  pluie: 'Pluie',
}
const nombre = (v: number, unite: string) => `${(Math.round(v * 10) / 10).toString().replace('.', ',')} ${unite}`
const AXE = { tick: { fontSize: 11, fill: '#535B53' }, tickLine: false } as const
const MARGES = { top: 8, right: 76, bottom: 0, left: -14 }

function Bloc({ titre, source, children }: { titre: string; source: string; children: ReactNode }) {
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <figcaption className="text-sm font-semibold text-ink">{titre}</figcaption>
      <div className="h-44 w-full">{children}</div>
      <p className="m-0 text-[11px] text-muted">Source : {source} · maille d&apos;environ 50 km</p>
    </figure>
  )
}

/** Étiquette en bout de ligne (seulement sur le dernier point) */
function etiquetteFin(nom: string, couleur: string, dernier: number) {
  return function Etiquette(props: { x?: number | string; y?: number | string; index?: number }) {
    if (props.index !== dernier || props.x === undefined || props.y === undefined) return null
    return (
      <text x={Number(props.x) + 6} y={Number(props.y) + 4} fontSize={11} fontWeight={600} fill={couleur}>
        {nom}
      </text>
    )
  }
}

export default function EvolutionSol({ etat }: { etat: EtatSol }) {
  if (etat.serie.length === 0) {
    return <p className="m-0 rounded-[14px] bg-paper p-4 text-sm text-muted">Évolution indisponible : la NASA n&apos;a pas encore publié de données pour cette zone.</p>
  }
  const donnees = etat.serie.map((p) => ({
    date: p.date,
    surface: p.surface === null ? null : Math.round(p.surface * 100),
    racines: p.racines === null ? null : Math.round(p.racines * 100),
    profondeur: p.profondeur === null ? null : Math.round(p.profondeur * 100),
    tempSurface: p.tempSurface,
    tmax: p.tmax,
    pluie: p.pluie,
  }))
  const dernier = donnees.length - 1
  const normaleRacines = etat.couches.find((c) => c.nom === 'racines')?.normale ?? null
  const infobulle = (unite: string) => ({
    labelFormatter: (d: unknown) => jourCourt(String(d)),
    formatter: (v: unknown, nom: unknown) => [v === null || v === undefined ? 'non publiée' : nombre(Number(v), unite), NOMS[String(nom)] ?? String(nom)] as [string, string],
    contentStyle: { borderRadius: 12, border: '1px solid #D2C9B1', fontFamily: 'var(--font-sans)', fontSize: 13 },
  })

  return (
    <div className="flex flex-col gap-6">
      <Bloc titre="Humidité du sol (%)" source="NASA POWER (GWETTOP, GWETROOT, GWETPROF)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={MARGES} syncId="evolution-sol">
            <CartesianGrid stroke="#E0D9C6" vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={28} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} width={44} {...AXE} />
            {normaleRacines !== null && (
              <ReferenceLine y={Math.round(normaleRacines * 100)} stroke={COULEURS.racines} strokeDasharray="5 4" strokeOpacity={0.7} label={{ value: 'normale racines', position: 'insideBottomLeft', fontSize: 10, fill: '#434A43' }} />
            )}
            <Tooltip {...infobulle('%')} />
            {(['surface', 'racines', 'profondeur'] as const).map((k) => (
              <Line key={k} dataKey={k} stroke={COULEURS[k]} strokeWidth={k === 'racines' ? 3 : 2} dot={false} isAnimationActive={false}>
                <LabelList dataKey={k} content={etiquetteFin(NOMS[k] ?? k, COULEURS[k], dernier)} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Bloc>

      <Bloc titre="Température (°C)" source="NASA POWER (TS, T2M_MAX)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={MARGES} syncId="evolution-sol">
            <CartesianGrid stroke="#E0D9C6" vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={28} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} allowDecimals={false} axisLine={false} width={44} {...AXE} />
            <Tooltip {...infobulle('°C')} />
            {(['tempSurface', 'tmax'] as const).map((k) => (
              <Line key={k} dataKey={k} stroke={COULEURS[k]} strokeWidth={2} strokeDasharray={k === 'tmax' ? '6 3' : undefined} dot={false} isAnimationActive={false}>
                <LabelList dataKey={k} content={etiquetteFin(NOMS[k] ?? k, COULEURS[k], dernier)} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Bloc>

      <Bloc titre="Pluie (mm/jour)" source="NASA POWER (PRECTOTCORR)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={donnees} margin={MARGES} syncId="evolution-sol">
            <CartesianGrid stroke="#E0D9C6" vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={28} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis allowDecimals={false} axisLine={false} width={44} {...AXE} />
            <Tooltip {...infobulle('mm')} cursor={{ fill: '#EFEADD' }} />
            <Bar dataKey="pluie" fill={COULEURS.pluie} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Bloc>
    </div>
  )
}
