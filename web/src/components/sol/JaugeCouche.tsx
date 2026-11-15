'use client'
// Une couche de sol : libellé, pourcentage, état, flèche de tendance, et une jauge 0–100 %
// avec un trait pointillé à la normale du mois. L'état n'est pas dit par la couleur seule (texte + flèche).
import { couleurHumidite, ETATS_COUCHE, FLECHES, LIBELLES_TENDANCE, NOMS_COUCHES, pourcent } from '@/lib/etat-sol'
import type { CoucheSol } from '@/lib/types'

export default function JaugeCouche({ couche, libelle, compacte = false }: { couche: CoucheSol; libelle?: string; compacte?: boolean }) {
  const largeur = couche.indice === null ? 0 : Math.round(couche.indice * 100)
  const titre = libelle ?? NOMS_COUCHES[couche.nom]
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {!compacte && (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-ink">{titre}</span>
          <span className="font-mono text-ink">
            {pourcent(couche.indice)}
            <span className="ml-1.5 font-sans text-muted-2">
              {ETATS_COUCHE[couche.etat]}
              {couche.tendance7j && (
                <span aria-label={LIBELLES_TENDANCE[couche.tendance7j]} title={LIBELLES_TENDANCE[couche.tendance7j]}>
                  {' '}
                  {FLECHES[couche.tendance7j]}
                </span>
              )}
            </span>
          </span>
        </div>
      )}
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-track"
        role="meter"
        aria-label={`${titre} : ${pourcent(couche.indice)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={couche.indice === null ? undefined : largeur}
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${largeur}%`, background: couleurHumidite(couche.indice) }} />
        {couche.normale !== null && (
          <span
            aria-hidden="true"
            title={`Normale du mois : ${pourcent(couche.normale)}`}
            className="absolute inset-y-0 w-0 border-l-2 border-dashed border-ink/70"
            style={{ left: `${Math.round(couche.normale * 100)}%` }}
          />
        )}
      </div>
    </div>
  )
}
