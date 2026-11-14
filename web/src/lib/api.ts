// Appels au serveur S'STACK (server/, Hono). Une fonction par route du contrat (lib/types.ts).
import type { ApercuSite, Conseil, DemandeConseil, FicheComplete, ReponseAgent, Site } from './types'

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
  let reponse: Response
  try {
    reponse = await fetch(`${API_URL}${chemin}`, { ...init, signal: AbortSignal.timeout(DELAI_MS) })
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
