'use client'
// Le site choisi par l'utilisateur, mémorisé dans le navigateur (Tchibanga par défaut).
import { useCallback, useSyncExternalStore } from 'react'

const CLE = 'sstack:site'
export const SITE_PAR_DEFAUT = 'tchibanga'
const EVENEMENT = 'sstack:site-change'

function lire(): string {
  try {
    return window.localStorage.getItem(CLE) ?? SITE_PAR_DEFAUT
  } catch {
    return SITE_PAR_DEFAUT // navigation privée ou stockage bloqué
  }
}

function abonner(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT, rappel)
  window.addEventListener('storage', rappel)
  return () => {
    window.removeEventListener(EVENEMENT, rappel)
    window.removeEventListener('storage', rappel)
  }
}

/** [id du site choisi, fonction pour le changer] — partagé entre toutes les pages. */
export function useSiteChoisi(): [string, (id: string) => void] {
  const siteId = useSyncExternalStore(abonner, lire, () => SITE_PAR_DEFAUT)
  const choisir = useCallback((id: string) => {
    try {
      window.localStorage.setItem(CLE, id)
    } catch {
      // stockage indisponible : le choix ne sera pas mémorisé, ce n'est pas bloquant
    }
    window.dispatchEvent(new Event(EVENEMENT))
  }, [])
  return [siteId, choisir]
}
