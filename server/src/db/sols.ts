// Intelligence des sols : tables soil_analyses, soil_properties, soil_amendments
// (supabase/migrations/004_sols.sql) et bucket privé « sols-documents » pour les rapports de laboratoire.
// Toujours filtré par le compte du producteur : on ne lit jamais les analyses d'un autre.
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Amendement, AnalyseSol, DemandeAmendement, DemandeAnalyseSol } from '../types/api.js'
import { getClient } from './supabase.js'

const BUCKET = 'sols-documents'
const DUREE_LIEN_S = 3600 // lien de téléchargement valable 1 h

/** Erreur levée quand Supabase n'est pas configuré (l'API répond alors 503). */
export class SolsIndisponibles extends Error {}

function client() {
  const supabase = getClient()
  if (!supabase) throw new SolsIndisponibles('Supabase n\'est pas configuré : le carnet de sol est indisponible.')
  return supabase
}

const LigneAnalyse = z.object({
  id: z.string(),
  created_at: z.string(),
  site_id: z.string(),
  parcelle: z.string().nullable(),
  date_analyse: z.string(),
  methode: z.enum(['laboratoire', 'kit_terrain', 'autre']),
  laboratoire: z.string().nullable(),
  type_sol: z.enum(['sableux', 'sablo_argileux', 'argilo_sableux', 'argileux', 'limoneux', 'lateritique', 'hydromorphe', 'autre']).nullable(),
  document_chemin: z.string().nullable(),
  document_nom: z.string().nullable(),
  soil_properties: z.array(
    z.object({
      propriete: z.enum(['ph', 'matiere_organique', 'azote', 'phosphore', 'potassium']),
      valeur: z.coerce.number(), // numeric arrive parfois en texte
      unite: z.enum(['pH', '%', 'g/kg', 'mg/kg', 'ppm', 'cmol/kg']),
    }),
  ),
})

/** Analyses du producteur (toutes, ou celles d'un site), de la plus récente à la plus ancienne. */
export async function listerAnalyses(utilisateurId: string, siteId?: string): Promise<AnalyseSol[]> {
  const supabase = client()
  let requete = supabase
    .from('soil_analyses')
    .select('id, created_at, site_id, parcelle, date_analyse, methode, laboratoire, type_sol, document_chemin, document_nom, soil_properties (propriete, valeur, unite)')
    .eq('utilisateur_id', utilisateurId)
    .order('date_analyse', { ascending: false })
    .limit(100)
  if (siteId) requete = requete.eq('site_id', siteId)
  const { data, error } = await requete
  if (error) throw new Error(`Lecture des analyses impossible : ${error.message}`)

  const lignes = z.array(LigneAnalyse).parse(data)
  return Promise.all(
    lignes.map(async (l): Promise<AnalyseSol> => {
      let document: AnalyseSol['document'] = null
      if (l.document_chemin) {
        const { data: lien } = await supabase.storage.from(BUCKET).createSignedUrl(l.document_chemin, DUREE_LIEN_S)
        document = { nom: l.document_nom ?? 'document', url: lien?.signedUrl ?? null }
      }
      return {
        id: l.id,
        siteId: l.site_id,
        parcelle: l.parcelle,
        dateAnalyse: l.date_analyse,
        methode: l.methode,
        laboratoire: l.laboratoire,
        typeSol: l.type_sol,
        mesures: l.soil_properties,
        document,
        creeLe: l.created_at,
      }
    }),
  )
}

export type DocumentRecu = { nom: string; type: string; contenu: Buffer }

/**
 * Enregistre une analyse, ses mesures et son document. Si une étape échoue, l'analyse est supprimée
 * (les mesures partent avec elle) : jamais d'analyse à moitié enregistrée.
 */
export async function creerAnalyse(utilisateurId: string, d: DemandeAnalyseSol, doc?: DocumentRecu): Promise<AnalyseSol> {
  const supabase = client()
  const id = randomUUID()
  const { error } = await supabase.from('soil_analyses').insert({
    id,
    utilisateur_id: utilisateurId,
    site_id: d.siteId,
    parcelle: d.parcelle,
    date_analyse: d.dateAnalyse,
    methode: d.methode,
    laboratoire: d.laboratoire,
    type_sol: d.typeSol,
  })
  if (error) throw new Error(`Enregistrement de l'analyse impossible : ${error.message}`)

  try {
    if (d.mesures.length) {
      const { error: e } = await supabase
        .from('soil_properties')
        .insert(d.mesures.map((m) => ({ analyse_id: id, propriete: m.propriete, valeur: m.valeur, unite: m.unite })))
      if (e) throw new Error(`Enregistrement des mesures impossible : ${e.message}`)
    }
    if (doc) {
      const nomSur = doc.nom.replace(/[^\w.-]+/g, '_').slice(-80) || 'document'
      const chemin = `${utilisateurId}/${id}/${nomSur}`
      const { error: e1 } = await supabase.storage.from(BUCKET).upload(chemin, doc.contenu, { contentType: doc.type })
      if (e1) throw new Error(`Envoi du document impossible : ${e1.message}`)
      const { error: e2 } = await supabase.from('soil_analyses').update({ document_chemin: chemin, document_nom: doc.nom }).eq('id', id)
      if (e2) throw new Error(`Rattachement du document impossible : ${e2.message}`)
    }
  } catch (erreur) {
    await supabase.from('soil_analyses').delete().eq('id', id)
    throw erreur
  }

  const [creee] = (await listerAnalyses(utilisateurId, d.siteId)).filter((a) => a.id === id)
  if (!creee) throw new Error('Analyse enregistrée mais introuvable à la relecture.')
  return creee
}

const LigneAmendement = z.object({
  id: z.string(),
  created_at: z.string(),
  site_id: z.string(),
  parcelle: z.string().nullable(),
  date_application: z.string(),
  type: z.enum(['chaux', 'compost', 'fumier', 'engrais_mineral', 'cendres', 'paillage', 'autre']),
  produit: z.string().nullable(),
  quantite: z.coerce.number().nullable(),
  unite: z.string().nullable(),
  notes: z.string().nullable(),
})

const versAmendement = (l: z.infer<typeof LigneAmendement>): Amendement => ({
  id: l.id,
  siteId: l.site_id,
  parcelle: l.parcelle,
  date: l.date_application,
  type: l.type,
  produit: l.produit,
  quantite: l.quantite,
  unite: l.unite,
  notes: l.notes,
  creeLe: l.created_at,
})

const COLONNES_AMENDEMENT = 'id, created_at, site_id, parcelle, date_application, type, produit, quantite, unite, notes'

export async function listerAmendements(utilisateurId: string, siteId?: string): Promise<Amendement[]> {
  let requete = client()
    .from('soil_amendments')
    .select(COLONNES_AMENDEMENT)
    .eq('utilisateur_id', utilisateurId)
    .order('date_application', { ascending: false })
    .limit(100)
  if (siteId) requete = requete.eq('site_id', siteId)
  const { data, error } = await requete
  if (error) throw new Error(`Lecture des amendements impossible : ${error.message}`)
  return z.array(LigneAmendement).parse(data).map(versAmendement)
}

export async function creerAmendement(utilisateurId: string, d: DemandeAmendement): Promise<Amendement> {
  const { data, error } = await client()
    .from('soil_amendments')
    .insert({
      utilisateur_id: utilisateurId,
      site_id: d.siteId,
      parcelle: d.parcelle,
      date_application: d.date,
      type: d.type,
      produit: d.produit,
      quantite: d.quantite,
      unite: d.unite,
      notes: d.notes,
    })
    .select(COLONNES_AMENDEMENT)
    .single()
  if (error) throw new Error(`Enregistrement de l'amendement impossible : ${error.message}`)
  return versAmendement(LigneAmendement.parse(data))
}
