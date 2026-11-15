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

// ─── MODULE 06 — Assistant intelligent (/assistant) ───────────────────────────
// Ces types suivent les tables ai_* de supabase/migrations/002_assistant_ia.sql.

/** Outils métier que l'agent peut appeler (table ai_agent_permissions). */
export type OutilAssistant =
  | 'lister_parcelles' // lecture
  | 'consulter_parcelle' // lecture
  | 'lire_indicateurs' // lecture
  | 'rechercher_connaissances' // lecture
  | 'analyser_photo' // lecture (diagnostic indicatif)
  | 'planifier_activite' // ÉCRITURE : toujours soumise à confirmation

/** Un appel d'outil fait par l'agent (table ai_tool_calls) */
export type AppelOutil = {
  id: string
  outil: OutilAssistant
  libelle: string // phrase lisible : « Lecture de la fiche de Tchibanga »
  arguments: Record<string, unknown>
  statut: 'ok' | 'erreur' | 'refuse'
  resume?: string // résultat en une ligne
}

/** Fichier joint à un message (photo de culture, document) */
export type PieceJointe = {
  nom: string
  type: string // type MIME
  taille: number // octets
  apercuUrl?: string // URL locale (blob:) ou URL signée renvoyée par le serveur
}

/** Conseil ou diagnostic produit par l'agent (table ai_recommendations) */
export type Recommandation = {
  type: 'conseil' | 'diagnostic'
  estHypothese: boolean // true pour tout diagnostic sur image : à vérifier sur le terrain
  confiance?: number // 0 à 1
  sources: string[] // ex. « NASA POWER », « Fiche calendrier-cultures »
}

export type StatutAction = 'proposee' | 'confirmee' | 'annulee' | 'executee' | 'echec'

/** Écriture proposée par l'agent, exécutée seulement après confirmation (table ai_action_logs) */
export type ActionProposee = {
  id: string
  outil: OutilAssistant
  titre: string
  details: { label: string; valeur: string }[] // aperçu montré avant confirmation
  statut: StatutAction
}

/** Un message de la conversation (table ai_messages) */
export type MessageAssistant = {
  id: string
  role: 'user' | 'assistant'
  texte: string
  date: string // ISO
  parcelleId: string | null
  pieceJointe?: PieceJointe
  outils?: AppelOutil[]
  recommandation?: Recommandation
  action?: ActionProposee
}

/** Réponse de POST /api/assistant/messages */
export type ReponseAssistant = {
  conversationId: string
  message: MessageAssistant // le message de l'agent
}

/** Une conversation passée (table ai_conversations) */
export type ConversationAssistant = {
  id: string
  titre: string
  date: string // ISO, dernier message
  parcelleId: string | null
  canal: 'web' | 'telegram'
  nbMessages: number
}

/** Une ligne du journal des actions (table ai_action_logs) */
export type JournalAction = {
  id: string
  date: string // ISO
  titre: string
  parcelleId: string | null
  statut: StatutAction
}
