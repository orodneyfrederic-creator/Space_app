'use client'
// Graphique de la pluie quotidienne (recharts, déjà installé).
// TODO (front-end) : BarChart de recharts avec date en abscisse et pluie (mm) en ordonnée,
// et une ligne de référence pour la normale si elle est fournie.
import type { PointPluie } from '@/lib/types'

export default function GraphiquePluie({ points }: { points: PointPluie[] }) {
  const total = points.reduce((s, p) => s + p.pluie, 0)
  return (
    <div className="rounded-xl border border-dashed p-6">
      <p className="font-semibold">Graphique de pluie à construire ici</p>
      <p className="text-sm">
        {points.length} jours, {total} mm au total
      </p>
    </div>
  )
}
