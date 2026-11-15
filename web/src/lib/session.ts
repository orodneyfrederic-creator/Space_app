'use client'
// Session du producteur connecté : jeton + profil, gardés dans le navigateur (localStorage).
// lib/api.ts ajoute le jeton à chaque appel. Événement EVENEMENT_SESSION à chaque changement.
import { useSyncExternalStore } from 'react'
import type { ReponseAuth, Utilisateur } from './types'

const CLE = 'sstack:session'
export const EVENEMENT_SESSION = 'sstack:session'

// Dernière lecture : useSyncExternalStore exige le même objet tant que rien n'a changé
let dernierBrut: string | null = null
let derniereSession: ReponseAuth | null = null

export function lireSession(): ReponseAuth | null {
  let brut: string | null
  try {
    brut = window.localStorage.getItem(CLE)
  } catch {
    return null
  }
  if (brut === dernierBrut) return derniereSession
  dernierBrut = brut
  derniereSession = null
  if (brut) {
    try {
      const s: unknown = JSON.parse(brut)
      if (s && typeof s === 'object' && 'jeton' in s && typeof s.jeton === 'string' && 'utilisateur' in s) derniereSession = s as ReponseAuth
    } catch {
      // contenu abîmé : on fait comme s'il n'y avait pas de session
    }
  }
  return derniereSession
}

export const lireJeton = (): string | null => lireSession()?.jeton ?? null

export const utilisateurConnecte = (): Utilisateur | null => lireSession()?.utilisateur ?? null

export function enregistrerSession(session: ReponseAuth): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(session))
  } catch {
    // stockage bloqué (navigation privée) : on garde la session en mémoire pour cette page
    dernierBrut = JSON.stringify(session)
    derniereSession = session
  }
  window.dispatchEvent(new Event(EVENEMENT_SESSION))
}

/** Met à jour le profil gardé (ex. après la liaison Telegram), sans toucher au jeton. */
export function majUtilisateur(utilisateur: Utilisateur): void {
  const s = lireSession()
  if (s && JSON.stringify(s.utilisateur) !== JSON.stringify(utilisateur)) enregistrerSession({ ...s, utilisateur })
}

export function effacerSession(): void {
  try {
    window.localStorage.removeItem(CLE)
  } catch {
    // rien à faire
  }
  dernierBrut = null
  derniereSession = null
  window.dispatchEvent(new Event(EVENEMENT_SESSION))
}

function abonner(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT_SESSION, rappel)
  window.addEventListener('storage', rappel) // connexion ou déconnexion dans un autre onglet
  return () => {
    window.removeEventListener(EVENEMENT_SESSION, rappel)
    window.removeEventListener('storage', rappel)
  }
}

/**
 * Session courante, suivie en direct.
 * `undefined` pendant le rendu serveur et l'hydratation (on ne sait pas encore), puis la session ou null.
 */
export function useSession(): ReponseAuth | null | undefined {
  return useSyncExternalStore<ReponseAuth | null | undefined>(abonner, lireSession, () => undefined)
}
