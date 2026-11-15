'use client'
// Humidité de la zone des racines (indice NASA POWER GWETROOT, 0 à 1) et normale du mois, avec recharts.
// Bandes : sec (< 0,4), correct, humide (> 0,7) — seuils de knowledge/fiches/seuils.md, à valider.
import { CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dateFr, nombreFr } from '@/lib/fiche'
import type { PointHumidite } from '@/lib/types'

const jourCourt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export default function GraphiqueHumidite({ points, hauteur = 260 }: { points: PointHumidite[]; hauteur?: number }) {
  const connus = points.filter((p) => p.racines !== null)
  if (connus.length === 0) {
    return <p className="m-0 rounded-[14px] bg-paper p-4 text-sm text-muted">Humidité du sol indisponible pour le moment.</p>
  }
  const dernier = connus[connus.length - 1]

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div
        style={{ height: hauteur }}
        role="img"
        aria-label={`Humidité de la zone des racines sur ${points.length} jours ; dernière valeur ${nombreFr(dernier.racines, 2)} le ${dateFr(dernier.date)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <ReferenceArea y1={0} y2={0.4} fill="#F5E0D5" fillOpacity={0.6} />
            <ReferenceArea y1={0.7} y2={1} fill="#DEE8F6" fillOpacity={0.7} />
            <CartesianGrid stroke="#E0D9C6" vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} tick={{ fontSize: 11, fill: '#535B53' }} minTickGap={24} tickLine={false} axisLine={{ stroke: '#D2C9B1' }} />
            <YAxis domain={[0, 1]} ticks={[0, 0.4, 0.7, 1]} tick={{ fontSize: 11, fill: '#535B53' }} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              labelFormatter={(d) => jourCourt(String(d))}
              formatter={(valeur, nom) => [valeur === null ? 'indisponible' : nombreFr(Number(valeur), 2), nom === 'racines' ? 'Humidité (racines)' : 'Normale du mois']}
              contentStyle={{ borderRadius: 12, border: '1px solid #D2C9B1', fontFamily: 'var(--font-sans)' }}
            />
            <Legend formatter={(nom) => (nom === 'racines' ? 'Humidité du jour' : 'Normale (moyenne NASA)')} wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="racines" stroke="#3A75C4" strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line dataKey="normale" type="stepAfter" stroke="#0B5D3B" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap justify-between gap-3 text-xs text-muted">
        <span>
          <span className="mr-1 inline-block size-2.5 rounded-sm bg-risk-bg align-middle" /> sec (moins de 0,4)
          <span className="mr-1 ml-3 inline-block size-2.5 rounded-sm bg-info-soft align-middle" /> humide (plus de 0,7)
        </span>
        <span className="font-mono">dernière valeur : {nombreFr(dernier.racines, 2)} le {dateFr(dernier.date)}</span>
      </figcaption>
    </figure>
  )
}
