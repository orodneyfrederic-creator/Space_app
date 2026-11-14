'use client'
// Graphique de la pluie quotidienne (barres, Bleu Océan) et de la normale du jour (ligne), avec recharts.
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { nombreFr } from '@/lib/fiche'
import type { PointPluie } from '@/lib/types'

const jourCourt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export default function GraphiquePluie({ points, hauteur = 280 }: { points: PointPluie[]; hauteur?: number }) {
  if (points.length === 0) {
    return <p className="m-0 rounded-[14px] bg-paper p-4 text-sm text-muted">Série de pluie indisponible pour le moment.</p>
  }
  const total = points.reduce((s, p) => s + p.pluie, 0)
  const totalNormale = points.reduce((s, p) => s + p.normale, 0)

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div style={{ height: hauteur }} role="img" aria-label={`Pluie quotidienne sur ${points.length} jours : ${nombreFr(total)} mm, pour une normale de ${nombreFr(totalNormale)} mm`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#E0D9C6" vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} tick={{ fontSize: 11, fill: '#535B53' }} minTickGap={24} tickLine={false} axisLine={{ stroke: '#D2C9B1' }} />
            <YAxis tick={{ fontSize: 11, fill: '#535B53' }} tickLine={false} axisLine={false} unit=" mm" width={56} />
            <Tooltip
              labelFormatter={(d) => jourCourt(String(d))}
              formatter={(valeur, nom) => [`${nombreFr(Number(valeur))} mm`, nom === 'pluie' ? 'Pluie' : 'Normale du mois']}
              contentStyle={{ borderRadius: 12, border: '1px solid #D2C9B1', fontFamily: 'var(--font-sans)' }}
            />
            <Legend formatter={(nom) => (nom === 'pluie' ? 'Pluie du jour' : 'Normale (moyenne NASA)')} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="pluie" fill="#3A75C4" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Line dataKey="normale" type="stepAfter" stroke="#0B5D3B" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex justify-between gap-3 font-mono text-xs text-muted">
        <span>
          {points.length} jours · {nombreFr(total)} mm
        </span>
        <span>normale {nombreFr(totalNormale)} mm</span>
      </figcaption>
    </figure>
  )
}
