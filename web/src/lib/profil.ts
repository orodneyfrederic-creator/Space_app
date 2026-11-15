'use client'
// Profil professionnel du compte : producteur (par défaut), conseiller, organisation.
// Le menu et la page d'accueil s'adaptent tout de suite (la session est suivie en direct).
import { majCompte } from './api'
import { JETON_LOCAL, lireSession, majUtilisateur, useSession } from './session'
import type { Profil } from './types'

export const PROFILS: readonly { id: Profil; titre: string; description: string }[] = [
  { id: 'producteur', titre: 'Producteur·rice', description: 'Je cultive mon champ : que faire cette semaine ?' },
  { id: 'conseiller', titre: 'Conseiller·ère agricole', description: 'Je suis plusieurs zones : lesquelles demandent une visite ?' },
  { id: 'organisation', titre: 'Coopérative ou organisation', description: 'Je veux la tendance sur l\'ensemble des sites.' },
]

/** Profil du compte connecté. Une session enregistrée avant l'ajout des profils compte comme « producteur ». */
export function useProfil(): Profil {
  const session = useSession()
  return session?.utilisateur.profil ?? 'producteur'
}

/** Change le profil : au serveur (PATCH /api/auth/moi), puis dans la session. En mode local : seulement dans la session. */
export async function changerProfil(profil: Profil): Promise<void> {
  const session = lireSession()
  if (!session) return
  if (session.jeton === JETON_LOCAL) {
    majUtilisateur({ ...session.utilisateur, profil })
    return
  }
  majUtilisateur(await majCompte({ profil }))
}
