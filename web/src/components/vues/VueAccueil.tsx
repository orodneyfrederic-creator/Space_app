'use client'
// Accueil : aiguillage selon le profil du compte (le changement de profil s'applique tout de suite).
//  - producteur   : mon champ, ici et maintenant (décision, coupe du sol, 3 indicateurs)
//  - conseiller   : mes zones, triées par urgence
//  - organisation : synthèse des sites, carte, tableau comparatif exportable
import { useProfil } from '@/lib/profil'
import AccueilConseiller from '../accueil/AccueilConseiller'
import AccueilOrganisation from '../accueil/AccueilOrganisation'
import AccueilProducteur from '../accueil/AccueilProducteur'

export default function VueAccueil() {
  const profil = useProfil()
  if (profil === 'conseiller') return <AccueilConseiller />
  if (profil === 'organisation') return <AccueilOrganisation />
  return <AccueilProducteur />
}
