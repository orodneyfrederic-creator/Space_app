// Contrat d'API S'STACK : source unique de vérité entre le serveur et le front-end.
// ⚠️ web/src/lib/types.ts doit contenir EXACTEMENT les mêmes types (à recopier à chaque changement).

export type Site = { id: string; nom: string; lat: number; lon: number }

export type Verdict = 'favorable' | 'risquée' | 'défavorable'

export type ApercuSite = {
  site: Site
  verdict: Verdict | null // null si les données NASA sont indisponibles
  raison: string
  pluie30: number | null // mm
  ecart30: number | null // % par rapport à la normale
  etatSol: 'sec' | 'correct' | 'humide' | 'inconnu'
  dernierJour: string | null // AAAA-MM-JJ, dernière date de données NASA
}

export type PointPluie = { date: string; pluie: number; normale: number } // mm/jour

export type FicheComplete = {
  site: Site
  fiche: { texte: string; donnees: Record<string, unknown> } // sortie de ficheParcelle()
  serie: PointPluie[] // les 30 derniers jours connus, avec la normale du jour (moyenne mensuelle NASA)
}

export type DemandeConseil = {
  lat: number
  lon: number
  nomLieu?: string
  culture?: string
  question: string // 1 à 1000 caractères
  canal?: 'web' | 'telegram'
}

export type ReponseAgent = {
  texte: string
  fournisseur: 'groq' | 'gemini'
  modele: string
  fiche: { texte: string; donnees: Record<string, unknown> }
  transcription?: string
  conseilId?: string // id enregistré dans Supabase, si l'enregistrement a réussi
}

export type Conseil = {
  id: string
  date: string // ISO
  canal: 'web' | 'telegram'
  nomLieu: string | null
  question: string
  reponse: string
  fournisseur: string
}

// ── Comptes des producteurs (téléphone + mot de passe) ──
// Les routes /conseil, /voix et /conseils demandent l'en-tête « Authorization: Bearer <jeton> ».

export type Utilisateur = {
  id: string
  nom: string
  telephone: string // +2410XXXXXXXX
  siteId: string | null // ville S'STACK choisie à l'inscription
  telegramLie: boolean // vrai si le bot Telegram est relié à ce compte
}

export type DemandeInscription = {
  nom: string // 2 à 60 caractères
  telephone: string // numéro gabonais, écrit librement (« 077 12 34 56 », « +241 77 12 34 56 »…)
  motDePasse: string // 8 à 72 caractères
  siteId?: string // id d'un Site
}

export type DemandeConnexion = { telephone: string; motDePasse: string }

export type ReponseAuth = {
  jeton: string // valable 30 jours
  utilisateur: Utilisateur
}
