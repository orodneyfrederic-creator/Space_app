'use client'
// Carte MapLibre des sites suivis. Couleur du marqueur selon le verdict de semis.
// Fond de carte : tuiles raster OpenStreetMap (gratuites, sans clé ; attribution obligatoire, usage léger).
// Pour un usage public à grande échelle, passer à un fournisseur de tuiles dédié.
// Relief 3D (option `relief3d`) : tuiles d'altitude Terrarium (AWS Open Data, gratuites, sans clé).
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Map as CarteMapLibre,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type RasterDEMSourceSpecification,
  type RasterSourceSpecification,
  type StyleSpecification,
} from 'maplibre-gl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ApercuSite } from '@/lib/types'
import { styleVerdict } from '@/lib/verdict'

const SOURCE_OSM: RasterSourceSpecification = {
  type: 'raster',
  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
  tileSize: 256,
  maxzoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>',
}

// Altitudes encodées dans les couleurs des tuiles (format Terrarium)
const SOURCE_ALTITUDE: RasterDEMSourceSpecification = {
  type: 'raster-dem',
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  maxzoom: 14,
  attribution: 'Relief : <a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles (AWS)</a>',
}

/** Le Gabon est peu montagneux : on accentue le relief pour qu'il se lise. */
const EXAGERATION_RELIEF = 2.5

function styleCarte(avecRelief: boolean): StyleSpecification {
  const fond = { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.35 } } as const
  if (!avecRelief) return { version: 8, sources: { osm: SOURCE_OSM }, layers: [fond] }
  // Deux sources distinctes pour le relief et l'ombrage des pentes (recommandé par MapLibre)
  return {
    version: 8,
    sources: { osm: SOURCE_OSM, relief: SOURCE_ALTITUDE, ombrage: SOURCE_ALTITUDE },
    layers: [
      fond,
      { id: 'ombrage', type: 'hillshade', source: 'ombrage', paint: { 'hillshade-exaggeration': 0.45 } },
    ],
    sky: {
      'sky-color': '#bcd9ee',
      'horizon-color': '#eef3f6',
      'fog-color': '#eef3f6',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.85,
    },
  }
}

// Worker copié dans public/ par scripts/copier-worker-maplibre.mjs (Turbopack ne le sert pas tout seul)
const URL_WORKER = '/maplibre/maplibre-gl-worker.mjs'

// Le Gabon en entier
const LIMITES_GABON: [[number, number], [number, number]] = [
  [8.6, -4.1],
  [14.6, 2.4],
]

type Props = {
  apercus: ApercuSite[]
  /** Classes de hauteur, par exemple « h-80 » ou « h-[70vh] » */
  hauteur?: string
  /** Version réduite (accueil) : pas de boutons de zoom */
  compacte?: boolean
  siteMisEnAvant?: string
  /** Affiche le bouton « Vue 3D » (relief du terrain) */
  relief3d?: boolean
}

export default function CarteParcelles({ apercus, hauteur = 'h-[70vh]', compacte = false, siteMisEnAvant, relief3d = false }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<CarteMapLibre | null>(null)
  const [vue3d, setVue3d] = useState(false)
  const router = useRouter()

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!conteneur.current) return
    setWorkerUrl(URL_WORKER)
    const instance = new CarteMapLibre({
      container: conteneur.current,
      style: styleCarte(relief3d),
      bounds: LIMITES_GABON,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      cooperativeGestures: compacte,
      maxPitch: 70,
    })
    if (!compacte) {
      instance.addControl(new NavigationControl({ showCompass: relief3d, visualizePitch: true }), 'top-right')
    }
    carte.current = instance
    return () => {
      instance.remove()
      carte.current = null
    }
  }, [compacte, relief3d])

  // Passage 2D ↔ 3D : relief + inclinaison de la caméra
  useEffect(() => {
    const instance = carte.current
    if (!instance || !relief3d) return
    const appliquer = () => {
      instance.setTerrain(vue3d ? { source: 'relief', exaggeration: EXAGERATION_RELIEF } : null)
      instance.easeTo(vue3d ? { pitch: 60, bearing: -20, duration: 1200 } : { pitch: 0, bearing: 0, duration: 800 })
    }
    if (instance.isStyleLoaded()) appliquer()
    else instance.once('load', appliquer)
    return () => {
      instance.off('load', appliquer)
    }
  }, [vue3d, relief3d])

  // Marqueurs (recréés quand les données changent)
  useEffect(() => {
    const instance = carte.current
    if (!instance) return
    const marqueurs = apercus.map((a) => {
      const style = styleVerdict(a.verdict)
      const bouton = document.createElement('button')
      bouton.type = 'button'
      bouton.className = 'marqueur-site'
      bouton.style.background = style.marqueur
      bouton.style.borderColor = style.contour
      if (a.site.id === siteMisEnAvant) bouton.style.transform = 'scale(1.35)'
      const libelle = `${a.site.nom} : semis ${style.libelle.toLowerCase()}. Ouvrir la fiche.`
      bouton.setAttribute('aria-label', libelle)
      bouton.title = `${a.site.nom} · ${style.libelle}`
      bouton.addEventListener('click', () => router.push(`/parcelles/${a.site.id}`))
      return new Marker({ element: bouton }).setLngLat([a.site.lon, a.site.lat]).addTo(instance)
    })
    return () => marqueurs.forEach((m) => m.remove())
  }, [apercus, router, siteMisEnAvant])

  return (
    <div className={`relative w-full ${hauteur}`}>
      <div
        ref={conteneur}
        role="region"
        aria-label="Carte des sites suivis au Gabon"
        className="size-full overflow-hidden rounded-[20px] bg-info-soft"
      />
      {relief3d && (
        <button
          type="button"
          onClick={() => setVue3d((v) => !v)}
          aria-pressed={vue3d}
          title={vue3d ? 'Revenir à la carte à plat' : 'Voir le relief du terrain en 3D'}
          className="absolute top-3 left-3 z-10 min-h-11 rounded-full bg-surface px-4 font-display text-sm font-semibold text-ink shadow-md ring-1 ring-black/10 hover:ring-2 hover:ring-accent-light"
        >
          {vue3d ? 'Vue 2D' : 'Vue 3D'}
        </button>
      )}
    </div>
  )
}

/** Légende des couleurs de marqueurs */
export function LegendeCarte() {
  const entrees = (['favorable', 'risquée', 'défavorable', null] as const).map((v) => ({ v, s: styleVerdict(v) }))
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-[13px] text-muted-2">
      {entrees.map(({ v, s }) => (
        <li key={String(v)} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded-full border-2" style={{ background: s.marqueur, borderColor: s.contour }} />
          {s.libelle}
        </li>
      ))}
    </ul>
  )
}
