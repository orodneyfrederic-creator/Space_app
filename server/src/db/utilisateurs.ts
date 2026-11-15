// Comptes des producteurs : table public.utilisateurs (supabase/migrations/002_utilisateurs.sql).
// L'empreinte du mot de passe ne sort jamais de ce fichier vers le client.
import { z } from 'zod'
import type { Profil, Utilisateur } from '../types/api.js'
import { getClient } from './supabase.js'

// « * » plutôt qu'une liste : la colonne profil (migration 005) peut ne pas exister encore
const COLONNES = '*'

const Ligne = z.object({
  id: z.string(),
  nom: z.string(),
  telephone: z.string(),
  site_id: z.string().nullable(),
  telegram_id: z.number().nullable(),
  mot_de_passe: z.string(),
  profil: z.enum(['producteur', 'conseiller', 'organisation']).optional().default('producteur'),
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
  profil: l.profil,
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

export async function creerUtilisateur(compte: { nom: string; telephone: string; siteId: string | null; empreinte: string; profil: Profil }): Promise<Utilisateur> {
  // Le profil n'est écrit que s'il diffère du défaut : l'inscription marche même sans la migration 005
  const ligne = { nom: compte.nom, telephone: compte.telephone, site_id: compte.siteId, mot_de_passe: compte.empreinte }
  const avecProfil = { ...ligne, profil: compte.profil }
  const { data, error } = await client()
    .from('utilisateurs')
    .insert(compte.profil === 'producteur' ? ligne : avecProfil)
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

/** Change le profil et/ou la ville du compte. */
export async function majCompte(utilisateurId: string, maj: { profil?: Profil; siteId?: string }): Promise<Utilisateur | null> {
  const champs: Record<string, string> = {}
  if (maj.profil) champs.profil = maj.profil
  if (maj.siteId) champs.site_id = maj.siteId
  const { error } = await client().from('utilisateurs').update(champs).eq('id', utilisateurId)
  if (error) throw new Error(`Mise à jour du compte impossible (migration 005 exécutée ?) : ${error.message}`)
  return trouverParId(utilisateurId)
}

/** Relie un compte Telegram à un producteur (en le détachant d'un éventuel ancien compte). */
export async function lierTelegram(utilisateurId: string, telegramId: number): Promise<void> {
  const supabase = client()
  const detacher = await supabase.from('utilisateurs').update({ telegram_id: null }).eq('telegram_id', telegramId).neq('id', utilisateurId)
  if (detacher.error) throw new Error(`Liaison Telegram impossible : ${detacher.error.message}`)
  const { error } = await supabase.from('utilisateurs').update({ telegram_id: telegramId }).eq('id', utilisateurId)
  if (error) throw new Error(`Liaison Telegram impossible : ${error.message}`)
}
