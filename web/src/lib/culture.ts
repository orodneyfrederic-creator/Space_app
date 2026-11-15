'use client'
// Culture du producteur (manioc ou banane plantain), gardée sur l'appareil. Les conseils du dashboard s'y adaptent.
import { useCallback, useSyncExternalStore } from 'react'
import type { Culture } from './types'

const CLE = 'sstack:culture'
const EVENEMENT = 'sstack:culture-change'
export const CULTURES: readonly { id: Culture; nom: string; plants: string }[] = [
  { id: 'manioc', nom: 'Manioc', plants: 'boutures' },
  { id: 'plantain', nom: 'Banane plantain', plants: 'rejets' },
]

function lire(): Culture {
  try {
    return window.localStorage.getItem(CLE) === 'plantain' ? 'plantain' : 'manioc'
  } catch {
    return 'manioc'
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

export function useCulture(): [Culture, (c: Culture) => void] {
  const culture = useSyncExternalStore(abonner, lire, () => 'manioc' as const)
  const choisir = useCallback((c: Culture) => {
    try {
      window.localStorage.setItem(CLE, c)
    } catch {
      // stockage bloqué : le choix ne sera pas retenu
    }
    window.dispatchEvent(new Event(EVENEMENT))
  }, [])
  return [culture, choisir]
}
