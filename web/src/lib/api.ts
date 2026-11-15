// Appels au serveur S'STACK (server/, Hono, port 3001 en local).
// ⚠️ Ces routes n'existent pas encore côté serveur : elles seront créées par le back-end.
// En attendant, les pages utilisent lib/donnees-demo.ts.
import type {
  ActionProposee,
  Conseil,
  ConversationAssistant,
  JournalAction,
  ReponseAgent,
  ReponseAssistant,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function verifier<T>(reponse: Response): Promise<T> {
  if (!reponse.ok) throw new Error(`Erreur du serveur (${reponse.status}) : ${await reponse.text()}`)
  return (await reponse.json()) as T
}

/** POST /api/conseil : poser une question écrite à l'agent pour une parcelle */
export async function demanderConseil(params: {
  lat: number
  lon: number
  nomLieu?: string
  culture?: string
  question: string
}): Promise<ReponseAgent> {
  const reponse = await fetch(`${API_URL}/api/conseil`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  return verifier<ReponseAgent>(reponse)
}

/** POST /api/voix : envoyer un enregistrement du micro (le serveur transcrit puis répond) */
export async function envoyerVocal(audio: Blob, parcelle: { lat: number; lon: number; nomLieu?: string }): Promise<ReponseAgent> {
  const formulaire = new FormData()
  formulaire.append('audio', audio, 'vocal.webm')
  formulaire.append('lat', String(parcelle.lat))
  formulaire.append('lon', String(parcelle.lon))
  if (parcelle.nomLieu) formulaire.append('nomLieu', parcelle.nomLieu)
  const reponse = await fetch(`${API_URL}/api/voix`, { method: 'POST', body: formulaire })
  return verifier<ReponseAgent>(reponse)
}

/** GET /api/conseils : l'historique des conseils donnés */
export async function listerConseils(): Promise<Conseil[]> {
  return verifier<Conseil[]>(await fetch(`${API_URL}/api/conseils`))
}

// ─── MODULE 06 — Assistant intelligent ────────────────────────────────────────
// Le serveur est la couche d'autorisation : il vérifie l'utilisateur, ne donne à l'agent
// que les données autorisées (ai_agent_permissions) et range les pièces jointes dans un
// stockage privé. Le navigateur n'appelle jamais le LLM directement.

/** true quand le serveur expose les routes /api/assistant/* (sinon : moteur de démo). */
export const API_ASSISTANT_PRETE = process.env.NEXT_PUBLIC_ASSISTANT_API === 'on'

/** POST /api/assistant/messages : envoyer un message (et une pièce jointe facultative) */
export async function envoyerMessageAssistant(params: {
  conversationId: string | null
  message: string
  parcelleId: string | null
  pieceJointe?: File
}): Promise<ReponseAssistant> {
  const formulaire = new FormData()
  if (params.conversationId) formulaire.append('conversationId', params.conversationId)
  formulaire.append('message', params.message)
  if (params.parcelleId) formulaire.append('parcelleId', params.parcelleId)
  if (params.pieceJointe) formulaire.append('pieceJointe', params.pieceJointe, params.pieceJointe.name)
  const reponse = await fetch(`${API_URL}/api/assistant/messages`, { method: 'POST', body: formulaire })
  return verifier<ReponseAssistant>(reponse)
}

/** POST /api/assistant/actions/:id : confirmer ou annuler une action proposée par l'agent */
export async function repondreAction(actionId: string, decision: 'confirmer' | 'annuler'): Promise<ActionProposee> {
  const reponse = await fetch(`${API_URL}/api/assistant/actions/${encodeURIComponent(actionId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ decision }),
  })
  return verifier<ActionProposee>(reponse)
}

/** GET /api/assistant/conversations : les conversations passées */
export async function listerConversations(): Promise<ConversationAssistant[]> {
  return verifier<ConversationAssistant[]>(await fetch(`${API_URL}/api/assistant/conversations`))
}

/** GET /api/assistant/actions : le journal des actions (proposées, confirmées, annulées) */
export async function listerJournalActions(): Promise<JournalAction[]> {
  return verifier<JournalAction[]>(await fetch(`${API_URL}/api/assistant/actions`))
}
