// Types partagés du front-end. Ils suivent ce que renvoie le serveur (server/src/context/).
// Si le serveur change un format, on met à jour ce fichier en premier.

/** Un site ou une parcelle affichée sur la carte */
export type Parcelle = {
  id: string
  nom: string
  lat: number
  lon: number
  culture?: string
}

/** Les chiffres de la fiche parcelle (champ `donnees` de ficheParcelle() côté serveur) */
export type DonneesFiche = {
  dernierJour: string // AAAA-MM-JJ : dernière date de données NASA
  pluie30: number // mm
  normale30: number // mm
  ecart30: number | null // %
  pluie7: number // mm
  normale7: number // mm
  ecart7: number | null // %
  secs14: number // jours secs sur 14 jours
  secheresse14: number // plus longue suite sèche (jours)
  etatSol: 'sec' | 'correct' | 'humide' | 'inconnu'
  tmax7: number | null // °C
  solTexture: { site: string; ph: number; argile: number; sable: number; carbone: number } | null
  evaluation: { verdict: string; raison: string }
}

/** Ce que renvoie l'agent après une question */
export type ReponseAgent = {
  texte: string // le conseil rédigé
  fournisseur: 'groq' | 'gemini'
  fiche: { texte: string; donnees: DonneesFiche }
  transcription?: string // si la question était un vocal
}

/** Un conseil enregistré dans l'historique */
export type Conseil = {
  id: string
  date: string // ISO
  parcelleId: string
  question: string
  reponse: string
  canal: 'web' | 'telegram'
}

/** Pluie d'un jour, pour les graphiques */
export type PointPluie = { date: string; pluie: number }
