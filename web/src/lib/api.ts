// Appels au serveur S'STACK (server/, Hono, port 3001 en local).
// ⚠️ Ces routes n'existent pas encore côté serveur : elles seront créées par le back-end.
// En attendant, les pages utilisent lib/donnees-demo.ts.
import type { Conseil, ReponseAgent } from './types'

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
