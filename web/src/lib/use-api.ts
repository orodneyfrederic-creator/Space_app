'use client'
// Hook de chargement : expose l'état (chargement, erreur, prêt) d'un appel au serveur.
import { useCallback, useEffect, useState } from 'react'
import { ErreurApi } from './api'

export type EtatApi<T> =
  | { statut: 'chargement' }
  | { statut: 'erreur'; message: string }
  | { statut: 'pret'; donnees: T }

/**
 * Lance `charger` au montage et à chaque changement de `cle`.
 * `recharger()` relance l'appel (bouton « Réessayer »).
 * L'état « chargement » est déduit : tant que le résultat ne correspond pas à la requête en cours, on charge.
 */
export function useApi<T>(charger: () => Promise<T>, cle: string): EtatApi<T> & { recharger: () => void } {
  const [essai, setEssai] = useState(0)
  const requete = `${cle}#${essai}`
  const [resultat, setResultat] = useState<{ requete: string; etat: EtatApi<T> } | null>(null)

  useEffect(() => {
    let actif = true
    charger()
      .then((donnees) => {
        if (actif) setResultat({ requete, etat: { statut: 'pret', donnees } })
      })
      .catch((erreur: unknown) => {
        if (!actif) return
        const message = erreur instanceof ErreurApi ? erreur.message : 'Une erreur inattendue est survenue.'
        setResultat({ requete, etat: { statut: 'erreur', message } })
      })
    return () => {
      actif = false
    }
    // `charger` change à chaque rendu : la requête en cours est identifiée par `requete` (cle + essai)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requete])

  const recharger = useCallback(() => setEssai((n) => n + 1), [])
  const etat: EtatApi<T> = resultat?.requete === requete ? resultat.etat : { statut: 'chargement' }
  return { ...etat, recharger }
}
