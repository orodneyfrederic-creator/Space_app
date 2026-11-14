'use client'
// Graphique de la pluie quotidienne.
// Version CSS aux couleurs S'STACK ; pourra être remplacée par un BarChart recharts
// (avec une ligne de référence pour la normale) si besoin.
import type { PointPluie } from '@/lib/types'

const HAUTEUR = 140 // px

export default function GraphiquePluie({ points }: { points: PointPluie[] }) {
  const total = points.reduce((s, p) => s + p.pluie, 0)
  const max = Math.max(1, ...points.map((p) => p.pluie))

  return (
    <section aria-labelledby="pluie-title" className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 id="pluie-title" className="font-display text-[17px] font-semibold">
          Pluie quotidienne
        </h2>
        <span className="font-mono text-[11px] text-muted">
          {points.length} j · {total} mm
        </span>
      </div>
      <div
        className="flex items-end gap-[3px] border-b border-line"
        style={{ height: HAUTEUR }}
        role="img"
        aria-label={`Pluie quotidienne sur ${points.length} jours, ${total} mm au total`}
      >
        {points.map((p) => (
          <div
            key={p.date}
            title={`${p.date} : ${p.pluie} mm`}
            className={`flex-1 rounded-t ${p.pluie >= max * 0.6 ? 'bg-info' : 'bg-info-light'}`}
            style={{ height: Math.max(2, (p.pluie / max) * HAUTEUR) }}
          />
        ))}
      </div>
      {points.length > 0 && (
        <div className="flex justify-between font-mono text-[11px] text-muted">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
        </div>
      )}
    </section>
  )
}
