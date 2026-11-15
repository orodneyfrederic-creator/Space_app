'use client'
// Carte où le producteur touche l'endroit de son champ (solution de repli quand le GPS est refusé ou absent).
// Même fond que CarteParcelles : tuiles OpenStreetMap, worker MapLibre servi depuis public/.
import 'maplibre-gl/dist/maplibre-gl.css'
import { Map as CarteMapLibre, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.35 } }],
}

const LIMITES_GABON: [[number, number], [number, number]] = [
  [8.6, -4.1],
  [14.6, 2.4],
]

type Props = {
  /** Point déjà choisi (affiché par un marqueur) */
  point: { lat: number; lon: number } | null
  onToucher: (lat: number, lon: number) => void
}

export default function CartePointeur({ point, onToucher }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<CarteMapLibre | null>(null)
  const marqueur = useRef<Marker | null>(null)
  const rappel = useRef(onToucher)

  useEffect(() => {
    rappel.current = onToucher
  }, [onToucher])

  useEffect(() => {
    if (!conteneur.current) return
    setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
    const instance = new CarteMapLibre({
      container: conteneur.current,
      style: STYLE,
      bounds: LIMITES_GABON,
      fitBoundsOptions: { padding: 16 },
      attributionControl: { compact: true },
    })
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    instance.getCanvas().style.cursor = 'crosshair'
    instance.on('click', (e) => rappel.current(e.lngLat.lat, e.lngLat.lng))
    carte.current = instance
    return () => {
      instance.remove()
      carte.current = null
      marqueur.current = null
    }
  }, [])

  // Marqueur du point choisi
  useEffect(() => {
    const instance = carte.current
    if (!instance) return
    if (!point) {
      marqueur.current?.remove()
      marqueur.current = null
      return
    }
    if (!marqueur.current) marqueur.current = new Marker({ color: '#0B5D3B' }).setLngLat([point.lon, point.lat]).addTo(instance)
    else marqueur.current.setLngLat([point.lon, point.lat])
  }, [point])

  return (
    <div
      ref={conteneur}
      role="application"
      aria-label="Carte : touchez l'endroit de votre champ"
      className="h-72 w-full overflow-hidden rounded-2xl bg-info-soft"
    />
  )
}
