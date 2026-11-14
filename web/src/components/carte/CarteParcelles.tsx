'use client'
// Carte des parcelles avec MapLibre (déjà installé : maplibre-gl).
// TODO (front-end) :
//  1. Créer la carte dans un useEffect (MapLibre ne fonctionne que dans le navigateur).
//  2. Importer 'maplibre-gl/dist/maplibre-gl.css'.
//  3. Centrer sur le Gabon (lon 11.6, lat -0.8, zoom 5.5) et ajouter un marqueur par parcelle.
//  4. Au clic sur un marqueur : appeler onSelection(parcelle).
import Link from 'next/link'
import type { Parcelle } from '@/lib/types'
import { MapIcon } from '../icons'

type Props = {
  parcelles: Parcelle[]
  onSelection?: (parcelle: Parcelle) => void
}

export default function CarteParcelles({ parcelles, onSelection }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Emplacement de la carte MapLibre */}
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line bg-info-soft text-info-ink">
        <MapIcon />
        <p className="m-0 text-sm font-semibold">Carte MapLibre à construire ici</p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {parcelles.map((p) => (
          <li key={p.id}>
            <Link
              href={`/parcelles/${p.id}`}
              onClick={() => onSelection?.(p)}
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-ink no-underline hover:ring-2 hover:ring-accent-light"
            >
              <span className="flex flex-col">
                <span className="font-display text-[15px] font-semibold">{p.nom}</span>
                <span className="font-mono text-[11px] text-muted">
                  {p.lat}, {p.lon}
                </span>
              </span>
              {p.culture && (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  {p.culture}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
