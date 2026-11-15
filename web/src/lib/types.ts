// Contrat d'API S'STACK : copie EXACTE de server/src/types/api.ts (source unique de vérité).
// Si le serveur change un type, on recopie ce fichier à l'identique.

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

/** Profil professionnel : le tableau de bord et le menu s'adaptent. */
export type Profil = 'producteur' | 'conseiller' | 'organisation'

export type Utilisateur = {
  id: string
  nom: string
  telephone: string // +2410XXXXXXXX
  siteId: string | null // ville S'STACK choisie à l'inscription
  telegramLie: boolean // vrai si le bot Telegram est relié à ce compte
  profil: Profil
}

export type DemandeInscription = {
  nom: string // 2 à 60 caractères
  telephone: string // numéro gabonais, écrit librement (« 077 12 34 56 », « +241 77 12 34 56 »…)
  motDePasse: string // 8 à 72 caractères
  siteId?: string // id d'un Site
  profil?: Profil // « producteur » par défaut
}

export type DemandeMajCompte = { profil?: Profil; siteId?: string }

export type DemandeConnexion = { telephone: string; motDePasse: string }

export type ReponseAuth = {
  jeton: string // valable 30 jours
  utilisateur: Utilisateur
}

// ── Intelligence des sols (/soil) ──
// Analyses saisies par le producteur (laboratoire ou kit), amendements apportés, humidité NASA du site.
// Routes : GET /api/sols/humidite/:siteId (libre) ; GET et POST /api/sols/analyses, /api/sols/amendements (compte exigé).
// Les valeurs chimiques viennent UNIQUEMENT des analyses saisies : jamais d'une image satellite.

export type TypeSol = 'sableux' | 'sablo_argileux' | 'argilo_sableux' | 'argileux' | 'limoneux' | 'lateritique' | 'hydromorphe' | 'autre'

export type MethodeAnalyse = 'laboratoire' | 'kit_terrain' | 'autre'

export type ProprieteSol = 'ph' | 'matiere_organique' | 'azote' | 'phosphore' | 'potassium'

/** Unités acceptées pour chaque propriété (le serveur refuse les autres). */
export type UniteSol = 'pH' | '%' | 'g/kg' | 'mg/kg' | 'ppm' | 'cmol/kg'

export type MesureSol = { propriete: ProprieteSol; valeur: number; unite: UniteSol }

export type AnalyseSol = {
  id: string
  siteId: string
  parcelle: string | null // nom libre donné par le producteur (« champ du bas »)
  dateAnalyse: string // AAAA-MM-JJ
  methode: MethodeAnalyse
  laboratoire: string | null
  typeSol: TypeSol | null
  mesures: MesureSol[] // seulement ce qui a été mesuré
  document: { nom: string; url: string | null } | null // url signée valable 1 h
  creeLe: string // ISO
}

/**
 * POST /api/sols/analyses : formulaire multipart avec les champs
 * siteId, parcelle?, dateAnalyse, methode, laboratoire?, typeSol?,
 * mesures (texte JSON d'un MesureSol[]), document? (PDF, JPEG ou PNG, 10 Mo au maximum).
 */
export type DemandeAnalyseSol = Omit<AnalyseSol, 'id' | 'document' | 'creeLe'>

export type TypeAmendement = 'chaux' | 'compost' | 'fumier' | 'engrais_mineral' | 'cendres' | 'paillage' | 'autre'

export type Amendement = {
  id: string
  siteId: string
  parcelle: string | null
  date: string // AAAA-MM-JJ
  type: TypeAmendement
  produit: string | null // ex. « NPK 15-15-15 », « chaux agricole »
  quantite: number | null
  unite: string | null // ex. « kg », « sacs », « brouettes »
  notes: string | null
  creeLe: string // ISO
}

/** POST /api/sols/amendements (JSON) */
export type DemandeAmendement = Omit<Amendement, 'id' | 'creeLe'>

/** Humidité du sol au niveau des racines (indice NASA POWER GWETROOT, 0 = sec, 1 = saturé). */
export type PointHumidite = { date: string; racines: number | null; normale: number | null }

export type HumiditeSol = {
  site: Site
  source: string // ex. « NASA POWER (GWETROOT), modèle à environ 50 km »
  points: PointHumidite[] // les 60 derniers jours
}

// ── État du sol à une position (GET /api/etat-sol) ──

export type Tendance = 'hausse' | 'baisse' | 'stable'

export type CoucheSol = {
  nom: 'surface' | 'racines' | 'profondeur'
  indice: number | null // 0–1, dernier jour connu
  normale: number | null // normale du mois (climatologie NASA)
  etat: 'sec' | 'correct' | 'humide' | 'inconnu'
  tendance7j: Tendance | null
}

export type PointEtatSol = {
  date: string // AAAA-MM-JJ
  surface: number | null
  racines: number | null
  profondeur: number | null
  tempSurface: number | null // °C
  tmax: number | null // °C, air à 2 m
  pluie: number | null // mm/jour
}

export type CodeAction = 'indisponible' | 'engorge' | 'surface_seche' | 'semer' | 'saison' | 'sol_sec' | 'incertain'
export type NiveauAlerte = 'alerte' | 'vigilance' | 'ok'

export type EtatSol = {
  position: { lat: number; lon: number }
  lieuProche: { site: Site; distanceKm: number } | null // site S'STACK le plus proche (haversine)
  echelle: string // « Maille NASA POWER d'environ 50 km »
  dernierJour: string | null
  couches: CoucheSol[] // toujours dans l'ordre surface, racines, profondeur
  tempSurface: { actuelle: number | null; moyenne7j: number | null; normale: number | null; tendance7j: Tendance | null }
  pluie7: number | null
  ecartPluie7: number | null // % par rapport à la normale des 7 mêmes jours
  pluie30: number | null
  verdict: Verdict | null
  raison: string
  codeAction: CodeAction // la règle retenue (sert au titre de la carte d'action)
  action: string // UNE phrase d'action, calculée par règles
  serie: PointEtatSol[] // les 30 derniers jours connus
}

/** Résumé léger d'un site (GET /api/etat-sol/sites), pour les accueils conseiller et organisation. */
export type ResumeEtatSol = {
  site: Site
  dernierJour: string | null
  verdict: Verdict | null
  codeAction: CodeAction
  action: string
  racines: CoucheSol
  ecartRacines: number | null // points de % par rapport à la normale du mois
  tempSurface: number | null // °C, dernier jour connu
  pluie7: number | null
  pluie30: number | null
  alerte: NiveauAlerte
}

// ── Conseils du jour (GET /api/conseils-jour) : état de la terre en mots simples, prévisions, alertes, plan ──

export type Culture = 'manioc' | 'plantain'

export type PrevisionJour = {
  date: string // AAAA-MM-JJ
  pluie: number | null // mm prévus
  probaPluie: number | null // % de chances de pluie
  tmax: number | null // °C
  tmin: number | null // °C
}

export type TypeAlerte = 'chaleur' | 'forte_pluie' | 'secheresse' | 'engorgement' | 'pluie_utile'

export type AlerteMeteo = {
  type: TypeAlerte
  niveau: 'danger' | 'attention' | 'bonne_nouvelle'
  titre: string // « Vague de chaleur »
  quand: string // « jeudi 19 et vendredi 20 nov. »
  message: string // une phrase simple
  gestes: string[] // 2 à 3 gestes, dans l'ordre
}

export type EtatTerreSimple = {
  ton: 'seche' | 'bonne' | 'mouillee' | 'inconnu'
  titre: string // « Votre terre est gorgée d'eau »
  phrase: string // ce que ça veut dire, en une ou deux phrases
}

export type EtapePlan = { quand: string; geste: string }

export type ConseilsJour = {
  culture: Culture
  etatTerre: EtatTerreSimple
  previsions: { source: string; jours: PrevisionJour[] } | null // null si les prévisions sont indisponibles
  prochainePluie: string // « Prochaine pluie : demain, environ 17 mm. »
  alertes: AlerteMeteo[] // les plus urgentes d'abord
  plan: EtapePlan[] // le plan de la semaine, dans l'ordre
}
