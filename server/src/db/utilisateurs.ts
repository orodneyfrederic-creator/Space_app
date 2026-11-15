// Comptes des producteurs : table public.utilisateurs (supabase/migrations/002_utilisateurs.sql).
// L'empreinte du mot de passe ne sort jamais de ce fichier vers le client.
import { z } from 'zod'
import type { Utilisateur } from '../types/api.js'
import { getClient } from './supabase.js'

const COLONNES = 'id, nom, telephone, site_id, telegram_id, mot_de_passe'

const Ligne = z.object({
  id: z.string(),
  nom: z.string(),
  telephone: z.string(),
  site_id: z.string().nullable(),
  telegram_id: z.number().nullable(),
  mot_de_passe: z.string(),
})
type Ligne = z.infer<typeof Ligne>

export type CompteAvecEmpreinte = { utilisateur: Utilisateur; empreinte: string }

/** Erreur levée quand le numéro a déjà un compte. */
export class TelephoneDejaPris extends Error {}

function client() {
  const supabase = getClient()
  if (!supabase) throw new Error('Supabase n\'est pas configuré : les comptes sont indisponibles.')
  return supabase
}

const versUtilisateur = (l: Ligne): Utilisateur => ({
  id: l.id,
  nom: l.nom,
  telephone: l.telephone,
  siteId: l.site_id,
  telegramLie: l.telegram_id !== null,
})

async function unSeul(colonne: 'id' | 'telephone' | 'telegram_id', valeur: string | number): Promise<CompteAvecEmpreinte | null> {
  const { data, error } = await client().from('utilisateurs').select(COLONNES).eq(colonne, valeur).maybeSingle()
  if (error) throw new Error(`Lecture du compte impossible : ${error.message}`)
  if (!data) return null
  const ligne = Ligne.parse(data)
  return { utilisateur: versUtilisateur(ligne), empreinte: ligne.mot_de_passe }
}

export const trouverParTelephone = (telephone: string) => unSeul('telephone', telephone)
export const trouverParId = async (id: string) => (await unSeul('id', id))?.utilisateur ?? null
export const trouverParTelegram = async (telegramId: number) => (await unSeul('telegram_id', telegramId))?.utilisateur ?? null

export async function creerUtilisateur(compte: { nom: string; telephone: string; siteId: string | null; empreinte: string }): Promise<Utilisateur> {
  const { data, error } = await client()
    .from('utilisateurs')
    .insert({ nom: compte.nom, telephone: compte.telephone, site_id: compte.siteId, mot_de_passe: compte.empreinte })
    .select(COLONNES)
    .single()
  if (error?.code === '23505') throw new TelephoneDejaPris()
  if (error) throw new Error(`Création du compte impossible : ${error.message}`)
  return versUtilisateur(Ligne.parse(data))
}

/** Change la ville par défaut du producteur (choisie dans le bot ou sur le site). */
export async function changerSite(utilisateurId: string, siteId: string): Promise<void> {
  const { error } = await client().from('utilisateurs').update({ site_id: siteId }).eq('id', utilisateurId)
  if (error) throw new Error(`Changement de ville impossible : ${error.message}`)
}

/** Relie un compte Telegram à un producteur (en le détachant d'un éventuel ancien compte). */
export async function lierTelegram(utilisateurId: string, telegramId: number): Promise<void> {
  const supabase = client()
  const detacher = await supabase.from('utilisateurs').update({ telegram_id: null }).eq('telegram_id', telegramId).neq('id', utilisateurId)
  if (detacher.error) throw new Error(`Liaison Telegram impossible : ${detacher.error.message}`)
  const { error } = await supabase.from('utilisateurs').update({ telegram_id: telegramId }).eq('id', utilisateurId)
  if (error) throw new Error(`Liaison Telegram impossible : ${error.message}`)
}
