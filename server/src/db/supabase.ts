// Accès à Supabase côté serveur (clé secrète service_role : jamais dans web/).
// Tables : public.conseils (001_schema.sql) et public.utilisateurs (002_utilisateurs.sql).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Conseil, DemandeConseil, ReponseAgent } from '../types/api.js'

let client: SupabaseClient | null | undefined

/** Client serveur, ou null si les variables Supabase manquent (le serveur continue sans historique). */
export function getClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.SUPABASE_URL
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !cle) {
    console.warn('[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant : historique désactivé.')
    client = null
  } else {
    client = createClient(url, cle, { auth: { persistSession: false } })
  }
  return client
}

/**
 * Enregistre un conseil donné. Ne lève jamais d'erreur : si Supabase échoue, on journalise
 * et on renvoie undefined (la réponse au producteur part quand même).
 * Le conseil est rattaché au compte du producteur (utilisateurId), sans recopier ni nom ni numéro.
 */
export async function enregistrerConseil(
  demande: DemandeConseil,
  reponse: ReponseAgent,
  canal: 'web' | 'telegram',
  utilisateurId: string,
): Promise<string | undefined> {
  const supabase = getClient()
  if (!supabase) return undefined
  try {
    const { data, error } = await supabase
      .from('conseils')
      .insert({
        canal,
        utilisateur_id: utilisateurId,
        nom_lieu: demande.nomLieu ?? null,
        lat: demande.lat,
        lon: demande.lon,
        culture: demande.culture ?? null,
        question: reponse.transcription ?? demande.question,
        reponse: reponse.texte,
        fournisseur: reponse.fournisseur,
        modele: reponse.modele,
        fiche: reponse.fiche,
      })
      .select('id')
      .single()
    if (error) throw error
    return z.object({ id: z.string() }).parse(data).id
  } catch (erreur) {
    console.error('[supabase] enregistrement du conseil impossible :', erreur)
    return undefined
  }
}

const LigneConseil = z.object({
  id: z.string(),
  created_at: z.string(),
  canal: z.enum(['web', 'telegram']),
  nom_lieu: z.string().nullable(),
  question: z.string(),
  reponse: z.string(),
  fournisseur: z.string(),
})

/** Les derniers conseils d'un producteur, du plus récent au plus ancien (en camelCase pour le front-end). */
export async function listerConseils(utilisateurId: string, limite: number): Promise<Conseil[]> {
  const supabase = getClient()
  if (!supabase) throw new Error('Historique indisponible : Supabase n\'est pas configuré.')
  const { data, error } = await supabase
    .from('conseils')
    .select('id, created_at, canal, nom_lieu, question, reponse, fournisseur')
    .eq('utilisateur_id', utilisateurId)
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) throw new Error(`Lecture de l'historique impossible : ${error.message}`)
  return z.array(LigneConseil).parse(data).map((l) => ({
    id: l.id,
    date: l.created_at,
    canal: l.canal,
    nomLieu: l.nom_lieu,
    question: l.question,
    reponse: l.reponse,
    fournisseur: l.fournisseur,
  }))
}
