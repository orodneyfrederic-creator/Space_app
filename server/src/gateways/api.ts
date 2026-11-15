// API Gateway : les routes /api/... lues par le front-end (contrat dans src/types/api.ts).
// Données NASA en accès libre ; l'agent (/conseil, /voix) et l'historique demandent un compte (gateways/auth.ts).
import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono, type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { repondreClimat } from '../agents/climat.js'
import { etatSolPosition } from '../context/etat-sol.js'
import { ficheParcelle } from '../context/fiche-parcelle.js'
import { codeMois, debutSaisonCourante } from '../context/indicateurs.js'
import { getClimatologie, getQuotidien, type Jour } from '../context/nasa-power.js'
import { SITES } from '../context/sites.js'
import { enregistrerConseil, listerConseils } from '../db/supabase.js'
import type { ApercuSite, Conseil, DemandeConseil, EtatSol, FicheComplete, PointPluie, ReponseAgent, Site } from '../types/api.js'
import { exigerCompte, routesAuth, type VariablesAuth } from './auth.js'
import { autoriserAppel, premierMessage, SchemaDemandeConseil } from './guardrails.js'
import { routesSols } from './sols.js'
import { transcrire } from './voice.js'

const VERSION = '0.1.0'

export const api = new Hono<VariablesAuth>()

/** Erreur 400 avec un message clair, renvoyée en { erreur } par le gestionnaire global. */
function requeteInvalide(message: string): never {
  throw new HTTPException(400, { message })
}

/**
 * Les 30 derniers jours de pluie connus, avec la normale du jour (moyenne mensuelle NASA).
 * Même période que ficheParcelle() : les données viennent alors du cache de 6 h.
 * En cas d'échec de la NASA, renvoie une série vide (la fiche dit déjà « indisponible »).
 */
async function seriePluie(lat: number, lon: number): Promise<PointPluie[]> {
  const aujourdhui = new Date()
  const debutSaison = new Date(`${debutSaisonCourante(aujourdhui)}T00:00:00Z`)
  const ilYa60Jours = new Date(aujourdhui.getTime() - 60 * 24 * 3600 * 1000)
  const debut = debutSaison < ilYa60Jours ? debutSaison : ilYa60Jours
  try {
    const [jours, climato] = await Promise.all([getQuotidien(lat, lon, debut, aujourdhui), getClimatologie(lat, lon)])
    return jours
      .filter((j): j is Jour & { pluie: number } => j.pluie !== null)
      .slice(-30)
      .map((j) => ({ date: j.date, pluie: j.pluie, normale: climato.pluieMmParJour[codeMois(j.date)] }))
  } catch (erreur) {
    console.error('[api] série de pluie indisponible :', erreur)
    return []
  }
}

/** Fiche détaillée + série de pluie d'un lieu. La fiche d'abord : la série profite ensuite du cache. */
async function ficheComplete(site: Site): Promise<FicheComplete> {
  const fiche = await ficheParcelle(site.lat, site.lon, { nomLieu: site.nom })
  const serie = await seriePluie(site.lat, site.lon)
  return { site, fiche, serie }
}

// Champs de la fiche utilisés par l'aperçu (validés : `donnees` est un objet libre)
const DonneesApercu = z.object({
  evaluation: z.object({ verdict: z.enum(['favorable', 'risquée', 'défavorable']), raison: z.string() }),
  pluie30: z.number(),
  ecart30: z.number().nullable(),
  etatSol: z.enum(['sec', 'correct', 'humide', 'inconnu']),
  dernierJour: z.string(),
})

async function apercuSite(site: Site): Promise<ApercuSite> {
  const indisponible: ApercuSite = {
    site, verdict: null, raison: 'Données NASA indisponibles', pluie30: null, ecart30: null, etatSol: 'inconnu', dernierJour: null,
  }
  try {
    const fiche = await ficheParcelle(site.lat, site.lon, { nomLieu: site.nom })
    const d = DonneesApercu.safeParse(fiche.donnees)
    if (!d.success) return indisponible
    return {
      site,
      verdict: d.data.evaluation.verdict,
      raison: d.data.evaluation.raison,
      pluie30: d.data.pluie30,
      ecart30: d.data.ecart30,
      etatSol: d.data.etatSol,
      dernierJour: d.data.dernierJour,
    }
  } catch (erreur) {
    console.error(`[api] aperçu indisponible pour ${site.nom} :`, erreur)
    return indisponible
  }
}

api.get('/sante', (c) => c.json({ ok: true as const, version: VERSION }))

api.get('/sites', (c) => c.json<Site[]>(SITES))

// Les 8 sites en parallèle ; un site en échec n'empêche pas les autres de répondre
api.get('/apercu', async (c) => c.json<ApercuSite[]>(await Promise.all(SITES.map(apercuSite))))

api.get('/fiche/:siteId', async (c) => {
  const site = SITES.find((s) => s.id === c.req.param('siteId'))
  if (!site) requeteInvalide(`Site inconnu. Sites possibles : ${SITES.map((s) => s.id).join(', ')}`)
  return c.json<FicheComplete>(await ficheComplete(site))
})

const RequetePosition = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  nom: z.string().trim().min(1).max(100).optional(),
})

api.get('/fiche', async (c) => {
  const p = RequetePosition.safeParse(c.req.query())
  if (!p.success) requeteInvalide('Paramètres attendus : lat (entre -90 et 90), lon (entre -180 et 180) et nom (facultatif).')
  const { lat, lon, nom } = p.data
  return c.json<FicheComplete>(await ficheComplete({ id: 'position', nom: nom ?? 'Parcelle du producteur', lat, lon }))
})

// État du sol à une position : 3 couches, température de surface, verdict et phrase d'action (accès libre, comme /fiche)
api.get('/etat-sol', async (c) => {
  const p = RequetePosition.safeParse(c.req.query())
  if (!p.success) requeteInvalide('Paramètres attendus : lat (entre -90 et 90) et lon (entre -180 et 180).')
  try {
    return c.json<EtatSol>(await etatSolPosition(p.data.lat, p.data.lon))
  } catch (erreur) {
    console.error('[api] état du sol indisponible :', erreur)
    throw new HTTPException(503, { message: 'Les données du sol de la NASA sont momentanément indisponibles. Réessayez dans un instant.' })
  }
})

// ── Phase 2 et 3 : l'agent répond (texte, voix) et l'historique ──

/** Adresse IP de l'appelant (derrière un hébergeur : en-tête x-forwarded-for). */
function adresseIp(c: Context): string {
  const transmise = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  if (transmise) return transmise
  try {
    return getConnInfo(c).remote.address ?? 'inconnue'
  } catch {
    return 'inconnue'
  }
}

function verifierRythme(c: Context): void {
  if (!autoriserAppel(adresseIp(c))) {
    throw new HTTPException(429, { message: 'Trop de questions, réessayez dans une minute.' })
  }
}

/** Valide la demande, interroge l'agent, enregistre le conseil (sans bloquer la réponse si Supabase échoue). */
async function traiterDemande(utilisateurId: string, brute: unknown, transcription?: string): Promise<ReponseAgent> {
  const resultat = SchemaDemandeConseil.safeParse(brute)
  if (!resultat.success) requeteInvalide(premierMessage(resultat.error))
  const demande: DemandeConseil = resultat.data
  const reponse: ReponseAgent = { ...(await repondreClimat(demande)), ...(transcription ? { transcription } : {}) }
  const conseilId = await enregistrerConseil(demande, reponse, demande.canal ?? 'web', utilisateurId)
  return conseilId ? { ...reponse, conseilId } : reponse
}

// Inscription, connexion et profil : /api/auth/...
api.route('/auth', routesAuth(adresseIp))

// Intelligence des sols : analyses, amendements, humidité NASA (gateways/sols.ts)
api.route('/sols', routesSols)

api.post('/conseil', exigerCompte, async (c) => {
  verifierRythme(c)
  const corps: unknown = await c.req.json().catch(() => requeteInvalide('Le corps de la requête doit être du JSON.'))
  return c.json<ReponseAgent>(await traiterDemande(c.get('utilisateurId'), corps))
})

const TAILLE_MAX_AUDIO = 10 * 1024 * 1024 // 10 Mo

api.post('/voix', exigerCompte, async (c) => {
  verifierRythme(c)
  const formulaire = await c.req.parseBody().catch(() => requeteInvalide('Formulaire attendu (multipart/form-data).'))
  const audio = formulaire['audio']
  if (!(audio instanceof File)) requeteInvalide('Le champ « audio » doit contenir un fichier audio.')
  if (audio.size === 0) requeteInvalide('Le fichier audio est vide.')
  if (audio.size > TAILLE_MAX_AUDIO) requeteInvalide('Le fichier audio est trop lourd (10 Mo au maximum).')

  const texte = (champ: string) => (typeof formulaire[champ] === 'string' ? String(formulaire[champ]) : undefined)
  const nombre = (champ: string) => {
    const v = texte(champ)
    return v === undefined || v.trim() === '' ? Number.NaN : Number(v)
  }

  // On garde l'extension d'origine (.webm navigateur, .ogg Telegram) : Whisper s'en sert pour reconnaître le format
  const extension = /\.[a-z0-9]+$/i.exec(audio.name)?.[0] ?? (audio.type.includes('ogg') ? '.ogg' : '.webm')
  const transcription = await transcrire(Buffer.from(await audio.arrayBuffer()), `vocal${extension}`)
  if (!transcription) requeteInvalide('Je n\'ai pas compris le message vocal. Pouvez-vous répéter ou écrire votre question ?')

  return c.json<ReponseAgent>(
    await traiterDemande(
      c.get('utilisateurId'),
      {
        lat: nombre('lat'),
        lon: nombre('lon'),
        nomLieu: texte('nomLieu'),
        culture: texte('culture'),
        question: transcription,
        canal: 'web',
      },
      transcription,
    ),
  )
})

// L'historique du producteur connecté uniquement
api.get('/conseils', exigerCompte, async (c) => {
  const limite = z.coerce.number().int().min(1).max(50).catch(20).parse(c.req.query('limit') ?? 20)
  try {
    return c.json<Conseil[]>(await listerConseils(c.get('utilisateurId'), limite))
  } catch (erreur) {
    console.error('[api]', erreur)
    throw new HTTPException(503, { message: 'L\'historique des conseils est momentanément indisponible.' })
  }
})
