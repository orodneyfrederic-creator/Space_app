// Routes /api/sols/... : Intelligence des sols (page /soil du site).
// - GET  /humidite/:siteId  : humidité du sol NASA POWER des 60 derniers jours (accès libre, comme /fiche)
// - GET  /analyses?siteId=  : analyses du producteur connecté
// - POST /analyses          : nouvelle analyse (multipart, document de laboratoire facultatif)
// - GET  /amendements?siteId=, POST /amendements : amendements apportés (chaux, compost…)
// Les valeurs chimiques ne viennent QUE des analyses saisies ; rien n'est déduit d'une image satellite.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { codeMois } from '../context/indicateurs.js'
import { getClimatologie, getQuotidien } from '../context/nasa-power.js'
import { SITES } from '../context/sites.js'
import { creerAmendement, creerAnalyse, listerAmendements, listerAnalyses, SolsIndisponibles, type DocumentRecu } from '../db/sols.js'
import type { Amendement, AnalyseSol, DemandeAmendement, DemandeAnalyseSol, HumiditeSol, ProprieteSol, UniteSol } from '../types/api.js'
import { exigerCompte, type VariablesAuth } from './auth.js'
import { premierMessage } from './guardrails.js'

function requeteInvalide(message: string): never {
  throw new HTTPException(400, { message })
}

/** Erreur de base de données : 503 avec un message clair, détail dans les journaux du serveur. */
function indisponible(erreur: unknown): never {
  console.error('[sols]', erreur)
  const message =
    erreur instanceof SolsIndisponibles
      ? 'Le carnet de sol est momentanément indisponible (base de données non configurée).'
      : 'Le carnet de sol est momentanément indisponible. Réessayez dans un instant.'
  throw new HTTPException(503, { message })
}

// ── Validation ──
const IDS_SITES = SITES.map((s) => s.id)
const SiteId = z.string({ message: 'Choisissez un site.' }).refine((id) => IDS_SITES.includes(id), { message: `Site inconnu. Sites possibles : ${IDS_SITES.join(', ')}.` })

const TexteFacultatif = (max: number, nom: string) =>
  z
    .string({ message: `${nom} : texte attendu.` })
    .trim()
    .max(max, { message: `${nom} : ${max} caractères au maximum.` })
    .optional()
    .nullable()
    .transform((t) => (t ? t : null))

const DateJour = (nom: string) =>
  z
    .string({ message: `${nom} : obligatoire.` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: `${nom} : format attendu AAAA-MM-JJ.` })
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), { message: `${nom} : date invalide.` })
    .refine((d) => d >= '1990-01-01', { message: `${nom} : date trop ancienne.` })
    .refine((d) => new Date(`${d}T00:00:00Z`).getTime() <= Date.now() + 24 * 3600 * 1000, { message: `${nom} : la date ne peut pas être dans le futur.` })

/** Unités acceptées par propriété, et bornes plausibles par unité. */
const UNITES: Record<ProprieteSol, readonly UniteSol[]> = {
  ph: ['pH'],
  matiere_organique: ['%', 'g/kg'],
  azote: ['%', 'g/kg', 'mg/kg'],
  phosphore: ['mg/kg', 'ppm'],
  potassium: ['cmol/kg', 'mg/kg', 'ppm'],
}
const BORNES: Record<UniteSol, number> = { pH: 14, '%': 100, 'g/kg': 1000, 'mg/kg': 100_000, ppm: 100_000, 'cmol/kg': 100 }

const Mesure = z
  .object({
    propriete: z.enum(['ph', 'matiere_organique', 'azote', 'phosphore', 'potassium'], { message: 'Propriété de sol inconnue.' }),
    valeur: z.number({ message: 'Chaque mesure doit être un nombre.' }).finite({ message: 'Chaque mesure doit être un nombre.' }),
    unite: z.enum(['pH', '%', 'g/kg', 'mg/kg', 'ppm', 'cmol/kg'], { message: 'Unité non acceptée pour cette mesure.' }),
  })
  .refine((m) => UNITES[m.propriete].includes(m.unite), { message: 'Unité non acceptée pour cette mesure.' })
  .refine((m) => m.valeur >= 0 && m.valeur <= BORNES[m.unite], { message: 'Une mesure est hors des valeurs possibles.' })

const SchemaAnalyse = z.object({
  siteId: SiteId,
  parcelle: TexteFacultatif(80, 'Nom de la parcelle'),
  dateAnalyse: DateJour('Date de l\'analyse'),
  methode: z.enum(['laboratoire', 'kit_terrain', 'autre'], { message: 'Méthode d\'analyse inconnue.' }),
  laboratoire: TexteFacultatif(100, 'Laboratoire'),
  typeSol: z
    .enum(['sableux', 'sablo_argileux', 'argilo_sableux', 'argileux', 'limoneux', 'lateritique', 'hydromorphe', 'autre'], { message: 'Type de sol inconnu.' })
    .optional()
    .nullable()
    .transform((t) => t ?? null),
  mesures: z
    .array(Mesure, { message: 'Le champ « mesures » doit être une liste.' })
    .max(5, { message: 'Cinq mesures au maximum.' })
    .refine((ms) => new Set(ms.map((m) => m.propriete)).size === ms.length, { message: 'Chaque propriété ne peut être mesurée qu\'une fois par analyse.' }),
})

const SchemaAmendement = z.object({
  siteId: SiteId,
  parcelle: TexteFacultatif(80, 'Nom de la parcelle'),
  date: DateJour('Date de l\'apport'),
  type: z.enum(['chaux', 'compost', 'fumier', 'engrais_mineral', 'cendres', 'paillage', 'autre'], { message: 'Type d\'amendement inconnu.' }),
  produit: TexteFacultatif(100, 'Produit'),
  quantite: z
    .number({ message: 'La quantité doit être un nombre.' })
    .finite({ message: 'La quantité doit être un nombre.' })
    .min(0, { message: 'La quantité ne peut pas être négative.' })
    .max(1_000_000, { message: 'La quantité est trop grande.' })
    .optional()
    .nullable()
    .transform((q) => q ?? null),
  unite: TexteFacultatif(30, 'Unité'),
  notes: TexteFacultatif(500, 'Notes'),
})

// Document de laboratoire : type déclaré ET premiers octets vérifiés
const TAILLE_MAX_DOC = 10 * 1024 * 1024
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  'application/pdf': (b) => b.subarray(0, 4).toString('latin1') === '%PDF',
  'image/png': (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
}

async function lireDocument(valeur: unknown): Promise<DocumentRecu | undefined> {
  if (valeur === undefined || valeur === '') return undefined
  if (!(valeur instanceof File)) requeteInvalide('Le champ « document » doit contenir un fichier.')
  if (valeur.size === 0) requeteInvalide('Le document est vide.')
  if (valeur.size > TAILLE_MAX_DOC) requeteInvalide('Le document est trop lourd (10 Mo au maximum).')
  const verifier = SIGNATURES[valeur.type]
  const contenu = Buffer.from(await valeur.arrayBuffer())
  if (!verifier || !verifier(contenu)) requeteInvalide('Document accepté : PDF, JPEG ou PNG.')
  return { nom: valeur.name.slice(0, 120), type: valeur.type, contenu }
}

const lireSiteFiltre = (brut: string | undefined) => {
  if (brut === undefined) return undefined
  const p = SiteId.safeParse(brut)
  return p.success ? p.data : requeteInvalide(premierMessage(p.error))
}

// ── Routes ──
export const routesSols = new Hono<VariablesAuth>()

routesSols.get('/humidite/:siteId', async (c) => {
  const site = SITES.find((s) => s.id === c.req.param('siteId'))
  if (!site) requeteInvalide(`Site inconnu. Sites possibles : ${IDS_SITES.join(', ')}.`)
  const fin = new Date()
  const debut = new Date(fin.getTime() - 75 * 24 * 3600 * 1000) // marge : les derniers jours NASA arrivent en retard
  try {
    const [jours, climato] = await Promise.all([getQuotidien(site.lat, site.lon, debut, fin), getClimatologie(site.lat, site.lon)])
    // On s'arrête au dernier jour publié par la NASA
    const dernier = jours.findLastIndex((j) => j.solRacines !== null)
    const points = jours
      .slice(0, dernier + 1)
      .slice(-60)
      .map((j) => ({ date: j.date, racines: j.solRacines, normale: climato.solRacines[codeMois(j.date)] ?? null }))
    return c.json<HumiditeSol>({ site, source: 'NASA POWER (GWETROOT, humidité de la zone des racines), modèle à environ 50 km', points })
  } catch (erreur) {
    console.error('[sols] humidité NASA indisponible :', erreur)
    throw new HTTPException(503, { message: 'Les données d\'humidité de la NASA sont momentanément indisponibles.' })
  }
})

routesSols.get('/analyses', exigerCompte, async (c) => {
  const siteId = lireSiteFiltre(c.req.query('siteId'))
  try {
    return c.json<AnalyseSol[]>(await listerAnalyses(c.get('utilisateurId'), siteId))
  } catch (erreur) {
    return indisponible(erreur)
  }
})

routesSols.post('/analyses', exigerCompte, async (c) => {
  const f = await c.req.parseBody().catch(() => requeteInvalide('Formulaire attendu (multipart/form-data).'))
  const texte = (champ: string) => (typeof f[champ] === 'string' ? String(f[champ]) : undefined)
  let mesures: unknown = []
  try {
    mesures = JSON.parse(texte('mesures') ?? '[]')
  } catch {
    requeteInvalide('Le champ « mesures » doit être une liste JSON.')
  }
  const p = SchemaAnalyse.safeParse({
    siteId: texte('siteId'),
    parcelle: texte('parcelle'),
    dateAnalyse: texte('dateAnalyse'),
    methode: texte('methode'),
    laboratoire: texte('laboratoire'),
    typeSol: texte('typeSol') || undefined,
    mesures,
  })
  if (!p.success) requeteInvalide(premierMessage(p.error))
  const demande: DemandeAnalyseSol = p.data
  if (demande.mesures.length === 0 && demande.typeSol === null) {
    requeteInvalide('Indiquez au moins une mesure ou le type de sol.')
  }
  const document = await lireDocument(f['document'])
  try {
    return c.json<AnalyseSol>(await creerAnalyse(c.get('utilisateurId'), demande, document), 201)
  } catch (erreur) {
    return indisponible(erreur)
  }
})

routesSols.get('/amendements', exigerCompte, async (c) => {
  const siteId = lireSiteFiltre(c.req.query('siteId'))
  try {
    return c.json<Amendement[]>(await listerAmendements(c.get('utilisateurId'), siteId))
  } catch (erreur) {
    return indisponible(erreur)
  }
})

routesSols.post('/amendements', exigerCompte, async (c) => {
  const corps: unknown = await c.req.json().catch(() => requeteInvalide('Le corps de la requête doit être du JSON.'))
  const p = SchemaAmendement.safeParse(corps)
  if (!p.success) requeteInvalide(premierMessage(p.error))
  const demande: DemandeAmendement = p.data
  try {
    return c.json<Amendement>(await creerAmendement(c.get('utilisateurId'), demande), 201)
  } catch (erreur) {
    return indisponible(erreur)
  }
})
