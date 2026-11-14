'use client'
// Carte MapLibre des sites suivis. Couleur du marqueur selon le verdict de semis.
// Fond de carte : tuiles raster OpenStreetMap (gratuites, sans clé ; attribution obligatoire, usage léger).
// Pour un usage public à grande échelle, passer à un fournisseur de tuiles dédié.
import 'maplibre-gl/dist/maplibre-gl.css'
import { Map as CarteMapLibre, Marker, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import type { ApercuSite } from '@/lib/types'
import { styleVerdict } from '@/lib/verdict'

const STYLE_CARTE: StyleSpecification = {
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
}

export default function CarteParcelles({ apercus, hauteur = 'h-[70vh]', compacte = false, siteMisEnAvant }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const carte = useRef<CarteMapLibre | null>(null)
  const router = useRouter()

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!conteneur.current) return
    setWorkerUrl(URL_WORKER)
    const instance = new CarteMapLibre({
      container: conteneur.current,
      style: STYLE_CARTE,
      bounds: LIMITES_GABON,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      cooperativeGestures: compacte,
    })
    if (!compacte) instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    carte.current = instance
    return () => {
      instance.remove()
      carte.current = null
    }
  }, [compacte])

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
    <div
      ref={conteneur}
      role="region"
      aria-label="Carte des sites suivis au Gabon"
      className={`w-full overflow-hidden rounded-[20px] bg-info-soft ${hauteur}`}
    />
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
