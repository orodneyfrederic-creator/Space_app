'use client'
// Position du champ du producteur : GPS du téléphone (API Geolocation du navigateur) ou point placé sur la carte.
// - La demande de localisation part TOUJOURS d'un geste (bouton « Me localiser »), jamais au chargement.
// - La dernière position est gardée sur l'appareil (localStorage « sstack:position ») et n'est jamais envoyée
//   à Supabase : elle sert seulement à choisir la bonne zone NASA (maille d'environ 50 km).
// - L'API Geolocation exige HTTPS (ou localhost).
import { useCallback, useState, useSyncExternalStore } from 'react'

export type EtatLocalisation = 'inactif' | 'recherche' | 'trouve' | 'refuse' | 'indisponible' | 'delai'

export type PositionChamp = {
  lat: number
  lon: number
  precisionM: number | null // null : point placé à la main sur la carte
  date: string // ISO, moment où la position a été prise
  source: 'gps' | 'carte'
}

const CLE = 'sstack:position'
const EVENEMENT = 'sstack:position-change'

export const MESSAGES_LOCALISATION: Record<Exclude<EtatLocalisation, 'inactif' | 'trouve'>, string> = {
  recherche: 'Recherche de votre position…',
  refuse: 'La localisation est bloquée. Autorisez-la dans les réglages du navigateur, ou touchez la carte pour placer votre champ.',
  indisponible: 'Votre position est introuvable pour l\'instant. Touchez la carte pour placer votre champ, ou choisissez une ville.',
  delai: 'La recherche de position a pris trop de temps. Réessayez dehors, ou touchez la carte pour placer votre champ.',
}

// Instantané mis en cache : useSyncExternalStore exige le même objet tant que la valeur n'a pas changé
let brutEnCache: string | null = null
let positionEnCache: PositionChamp | null = null

function estPosition(v: unknown): v is PositionChamp {
  if (!v || typeof v !== 'object') return false
  const p = v as Record<string, unknown>
  return (
    typeof p.lat === 'number' && Math.abs(p.lat) <= 90 &&
    typeof p.lon === 'number' && Math.abs(p.lon) <= 180 &&
    (p.precisionM === null || typeof p.precisionM === 'number') &&
    typeof p.date === 'string' &&
    (p.source === 'gps' || p.source === 'carte')
  )
}

function lire(): PositionChamp | null {
  let brut: string | null = null
  try {
    brut = window.localStorage.getItem(CLE)
  } catch {
    return null // stockage bloqué
  }
  if (brut === brutEnCache) return positionEnCache
  brutEnCache = brut
  try {
    const v: unknown = brut ? JSON.parse(brut) : null
    positionEnCache = estPosition(v) ? v : null
  } catch {
    positionEnCache = null
  }
  return positionEnCache
}

function ecrire(p: PositionChamp | null): void {
  try {
    if (p) window.localStorage.setItem(CLE, JSON.stringify(p))
    else window.localStorage.removeItem(CLE)
  } catch {
    // stockage indisponible : la position ne sera pas retenue, ce n'est pas bloquant
  }
  window.dispatchEvent(new Event(EVENEMENT))
}

function abonner(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel)
  window.addEventListener('storage', rappel)
  return () => {
    window.removeEventListener(EVENEMENT, rappel)
    window.removeEventListener('storage', rappel)
  }
}

export function usePosition() {
  const position = useSyncExternalStore(abonner, lire, () => null)
  const [etat, setEtat] = useState<EtatLocalisation>('inactif')

  /** À appeler depuis un clic : demande la permission puis la position GPS. */
  const localiser = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEtat('indisponible')
      return
    }
    setEtat('recherche')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        ecrire({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          precisionM: Math.round(p.coords.accuracy),
          date: new Date().toISOString(),
          source: 'gps',
        })
        setEtat('trouve')
      },
      (erreur) => {
        setEtat(erreur.code === erreur.PERMISSION_DENIED ? 'refuse' : erreur.code === erreur.TIMEOUT ? 'delai' : 'indisponible')
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 600_000 },
    )
  }, [])

  /** Point placé à la main sur la carte. */
  const placer = useCallback((lat: number, lon: number) => {
    ecrire({ lat, lon, precisionM: null, date: new Date().toISOString(), source: 'carte' })
    setEtat('trouve')
  }, [])

  /** Oublie la position : on revient à la ville choisie. */
  const oublier = useCallback(() => {
    ecrire(null)
    setEtat('inactif')
  }, [])

  return { position, etat, localiser, placer, oublier }
}
