// Agent Climat : contexte (skill + fiches + fiche parcelle) → LLM → garde-fous de sortie.
// Il n'enregistre rien : l'enregistrement dans Supabase est fait par l'appelant (API, bot).
import { construireContexte } from '../context/construire-contexte.js'
import { filtrerSortie } from '../gateways/guardrails.js'
import { demanderLLM } from '../gateways/llm.js'
import type { DemandeConseil, ReponseAgent } from '../types/api.js'

export async function repondreClimat(demande: DemandeConseil): Promise<ReponseAgent> {
  const { messages, fiche } = await construireContexte(
    { lat: demande.lat, lon: demande.lon, nomLieu: demande.nomLieu, culture: demande.culture },
    demande.question,
  )
  const reponse = await demanderLLM(messages, { temperature: 0.2 })
  return {
    texte: filtrerSortie(reponse.texte),
    fournisseur: reponse.fournisseur,
    modele: reponse.modele,
    fiche,
  }
}
