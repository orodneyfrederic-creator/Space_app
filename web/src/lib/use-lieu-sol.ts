'use client'
// Le lieu actif pour l'état du sol, dans cet ordre :
//  1. la position du champ (GPS ou point placé sur la carte), gardée sur l'appareil ;
//  2. sinon la ville choisie (ou celle du compte, voir site-choisi.ts).
// Puis charge GET /api/etat-sol pour ce lieu.
import { useCallback } from 'react'
import { getEtatSol, getSites } from './api'
import { useSiteChoisi } from './site-choisi'
import type { EtatSol, Site } from './types'
import { useApi } from './use-api'
import { usePosition, type PositionChamp } from './use-position'

export type LieuSol =
  | { source: 'gps' | 'carte'; lat: number; lon: number; position: PositionChamp }
  | { source: 'ville'; lat: number; lon: number; site: Site }

const enAttente = () => new Promise<never>(() => {}) // tant que la liste des villes n'est pas arrivée

export function useLieuSol() {
  const { position, etat, localiser, placer, oublier } = usePosition()
  const [siteId, choisirSite] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const listeSites = sites.statut === 'pret' ? sites.donnees : []
  const site = listeSites.find((s) => s.id === siteId) ?? null

  const lieu: LieuSol | null = position
    ? { source: position.source, lat: position.lat, lon: position.lon, position }
    : site
      ? { source: 'ville', lat: site.lat, lon: site.lon, site }
      : null

  const cle = lieu ? `etat-sol:${lieu.lat.toFixed(4)}:${lieu.lon.toFixed(4)}` : `etat-sol:attente:${sites.statut}`
  const etatSol = useApi<EtatSol>(() => (lieu ? getEtatSol(lieu.lat, lieu.lon) : enAttente()), cle)

  /** Choisir une ville : on oublie la position GPS ou le point placé. */
  const choisirVille = useCallback(
    (id: string) => {
      oublier()
      choisirSite(id)
    },
    [oublier, choisirSite],
  )

  return {
    lieu,
    etatSol,
    sites: listeSites,
    erreurSites: sites.statut === 'erreur' ? sites.message : null,
    rechargerSites: sites.recharger,
    localisation: etat,
    localiser,
    placer,
    choisirVille,
  }
}

/** « Libreville (Estuaire) » → « Libreville » */
export const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, '')
