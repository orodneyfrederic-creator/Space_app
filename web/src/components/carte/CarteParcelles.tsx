'use client'
// Carte des parcelles avec MapLibre (déjà installé : maplibre-gl).
// TODO (front-end) :
//  1. Créer la carte dans un useEffect (MapLibre ne fonctionne que dans le navigateur).
//  2. Importer 'maplibre-gl/dist/maplibre-gl.css'.
//  3. Centrer sur le Gabon (lon 11.6, lat -0.8, zoom 5.5) et ajouter un marqueur par parcelle.
//  4. Au clic sur un marqueur : appeler onSelection(parcelle).
import type { Parcelle } from '@/lib/types'

type Props = {
  parcelles: Parcelle[]
  onSelection?: (parcelle: Parcelle) => void
}

export default function CarteParcelles({ parcelles, onSelection }: Props) {
  return (
    <div className="rounded-xl border border-dashed p-6">
      <p className="font-semibold">Carte MapLibre à construire ici</p>
      <ul className="mt-3 text-sm">
        {parcelles.map((p) => (
          <li key={p.id}>
            <button type="button" className="underline" onClick={() => onSelection?.(p)}>
              {p.nom} ({p.lat}, {p.lon})
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
