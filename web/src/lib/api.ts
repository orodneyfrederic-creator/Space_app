// Appels au serveur S'STACK (server/, Hono). Une fonction par route du contrat (lib/types.ts).
import { effacerSession, enregistrerSession, JETON_LOCAL, lireJeton } from './session'
import type {
  Amendement,
  AnalyseSol,
  DemandeAmendement,
  DemandeAnalyseSol,
  HumiditeSol,
  ApercuSite,
  Conseil,
  ConseilsJour,
  Culture,
  DemandeConnexion,
  DemandeConseil,
  DemandeInscription,
  DemandeMajCompte,
  EtatSol,
  FicheComplete,
  ReponseAgent,
  ReponseAuth,
  ResumeEtatSol,
  Site,
  Utilisateur,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const DELAI_MS = 30_000

export const MESSAGE_SERVEUR_ETEINT = 'Le serveur S\'STACK ne répond pas. Vérifiez qu\'il est lancé.'

/** Erreur lisible par le producteur, avec le statut HTTP quand le serveur a répondu. */
export class ErreurApi extends Error {
  constructor(message: string, readonly statut?: number) {
    super(message)
    this.name = 'ErreurApi'
  }
}

async function appeler<T>(chemin: string, init?: RequestInit): Promise<T> {
  // Jeton du producteur connecté (exigé par /conseil, /voix, /conseils et /auth/moi)
  const jeton = typeof window === 'undefined' ? null : lireJeton()
  const entetes = new Headers(init?.headers)
  if (jeton) entetes.set('authorization', `Bearer ${jeton}`)
  let reponse: Response
  try {
    reponse = await fetch(`${API_URL}${chemin}`, { ...init, headers: entetes, signal: AbortSignal.timeout(DELAI_MS) })
  } catch (erreur) {
    // Serveur éteint, réseau coupé ou délai dépassé
    if (erreur instanceof DOMException && erreur.name === 'TimeoutError') {
      throw new ErreurApi('Le serveur S\'STACK met trop de temps à répondre. Réessayez dans un instant.')
    }
    throw new ErreurApi(MESSAGE_SERVEUR_ETEINT)
  }
  if (!reponse.ok) {
    const corps: unknown = await reponse.json().catch(() => null)
    const message =
      corps && typeof corps === 'object' && 'erreur' in corps && typeof corps.erreur === 'string'
        ? corps.erreur
        : `Erreur du serveur (${reponse.status}).`
    // Jeton expiré ou refusé : on oublie la session, le producteur devra se reconnecter
    // (sauf en mode local sans compte : le serveur refuse forcément le jeton fictif)
    if (reponse.status === 401 && jeton && jeton !== JETON_LOCAL) effacerSession()
    throw new ErreurApi(message, reponse.status)
  }
  return (await reponse.json()) as T
}

export const getSites = () => appeler<Site[]>('/api/sites')

export const getApercu = () => appeler<ApercuSite[]>('/api/apercu')

export const getFiche = (siteId: string) => appeler<FicheComplete>(`/api/fiche/${encodeURIComponent(siteId)}`)

export const getFicheParPosition = (lat: number, lon: number, nom?: string) => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), ...(nom ? { nom } : {}) })
  return appeler<FicheComplete>(`/api/fiche?${params}`)
}

export const demanderConseil = (demande: DemandeConseil) =>
  appeler<ReponseAgent>('/api/conseil', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ canal: 'web', ...demande }),
  })

/** Envoie un enregistrement du micro (webm) : le serveur le transcrit puis l'agent répond. */
export function envoyerVocal(audio: Blob, lieu: { lat: number; lon: number; nomLieu?: string; culture?: string }) {
  const formulaire = new FormData()
  formulaire.append('audio', audio, audio.type.includes('ogg') ? 'vocal.ogg' : 'vocal.webm')
  formulaire.append('lat', String(lieu.lat))
  formulaire.append('lon', String(lieu.lon))
  if (lieu.nomLieu) formulaire.append('nomLieu', lieu.nomLieu)
  if (lieu.culture) formulaire.append('culture', lieu.culture)
  return appeler<ReponseAgent>('/api/voix', { method: 'POST', body: formulaire })
}

export const listerConseils = (limite = 20) => appeler<Conseil[]>(`/api/conseils?limit=${limite}`)

// ── Comptes : inscription et connexion par numéro de téléphone + mot de passe ──
// En cas de succès, la session est enregistrée (lib/session.ts) : les appels suivants portent le jeton.

/** Erreurs possibles : 400 (champ invalide, message prêt à afficher), 409 (numéro déjà inscrit), 429 (trop d'essais). */
export async function inscrire(demande: DemandeInscription): Promise<ReponseAuth> {
  const session = await appeler<ReponseAuth>('/api/auth/inscription', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(demande),
  })
  enregistrerSession(session)
  return session
}

/** Erreurs possibles : 400 (champ invalide), 401 (numéro ou mot de passe incorrect), 429 (trop d'essais). */
export async function connecter(demande: DemandeConnexion): Promise<ReponseAuth> {
  const session = await appeler<ReponseAuth>('/api/auth/connexion', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(demande),
  })
  enregistrerSession(session)
  return session
}

/** Profil du producteur connecté (401 si la session a expiré). */
export const getMoi = () => appeler<Utilisateur>('/api/auth/moi')

export const deconnecter = () => effacerSession()

/** Change le profil ou la ville du compte connecté. */
export const majCompte = (maj: DemandeMajCompte) =>
  appeler<Utilisateur>('/api/auth/moi', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(maj) })

// ── Intelligence des sols (/soil) ──

/** Humidité du sol des 60 derniers jours (NASA POWER), accès libre. */
/** État du sol à une position (3 couches, température de surface, verdict, phrase d'action). */
export const getEtatSol = (lat: number, lon: number) =>
  appeler<EtatSol>(`/api/etat-sol?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`)

/** Conseils du jour : état de la terre en mots simples, prévisions 7 jours, alertes et plan de la semaine. */
export const getConseilsJour = (lat: number, lon: number, culture: Culture) =>
  appeler<ConseilsJour>(`/api/conseils-jour?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&culture=${culture}`)

/** Résumé de l'état du sol des 8 sites (accueils conseiller et organisation). */
export const getResumesSites = () => appeler<ResumeEtatSol[]>('/api/etat-sol/sites')

/** Résumé de l'état du sol d'un point placé par le conseiller. */
export const getResumePoint = (lat: number, lon: number, nom: string) =>
  appeler<ResumeEtatSol>(`/api/etat-sol/resume?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&nom=${encodeURIComponent(nom)}`)

export const getHumiditeSol = (siteId: string) => appeler<HumiditeSol>(`/api/sols/humidite/${encodeURIComponent(siteId)}`)

const filtreSite = (siteId?: string) => (siteId ? `?siteId=${encodeURIComponent(siteId)}` : '')

export const listerAnalysesSol = (siteId?: string) => appeler<AnalyseSol[]>(`/api/sols/analyses${filtreSite(siteId)}`)

/** Enregistre une analyse ; le document de laboratoire (PDF, JPEG, PNG, 10 Mo) est facultatif. */
export function enregistrerAnalyseSol(demande: DemandeAnalyseSol, document?: File) {
  const formulaire = new FormData()
  formulaire.append('siteId', demande.siteId)
  if (demande.parcelle) formulaire.append('parcelle', demande.parcelle)
  formulaire.append('dateAnalyse', demande.dateAnalyse)
  formulaire.append('methode', demande.methode)
  if (demande.laboratoire) formulaire.append('laboratoire', demande.laboratoire)
  if (demande.typeSol) formulaire.append('typeSol', demande.typeSol)
  formulaire.append('mesures', JSON.stringify(demande.mesures))
  if (document) formulaire.append('document', document, document.name)
  return appeler<AnalyseSol>('/api/sols/analyses', { method: 'POST', body: formulaire })
}

export const listerAmendements = (siteId?: string) => appeler<Amendement[]>(`/api/sols/amendements${filtreSite(siteId)}`)

export const enregistrerAmendement = (demande: DemandeAmendement) =>
  appeler<Amendement>('/api/sols/amendements', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(demande),
  })
