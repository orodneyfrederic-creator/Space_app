// Comptes des producteurs : inscription et connexion par numéro de téléphone + mot de passe (sans SMS).
// Jeton signé (JWT HS256, secret JWT_SECRET dans server/.env) valable 30 jours,
// envoyé ensuite dans l'en-tête « Authorization: Bearer <jeton> ».
import type { Context } from 'hono'
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { sign, verify } from 'hono/jwt'
import { z } from 'zod'
import { empreinteLeurre, hacherMotDePasse, verifierMotDePasse } from '../auth/mot-de-passe.js'
import { MESSAGE_TELEPHONE, MESSAGE_TELEPHONE_VIDE, normaliserTelephone } from '../auth/telephone.js'
import { SITES } from '../context/sites.js'
import { creerUtilisateur, majCompte, TelephoneDejaPris, trouverParId, trouverParTelephone } from '../db/utilisateurs.js'
import type { ReponseAuth, Utilisateur } from '../types/api.js'
import { premierMessage } from './guardrails.js'

const DUREE_JETON_S = 30 * 24 * 3600
const MESSAGE_INDISPONIBLE = 'Les comptes sont momentanément indisponibles. Réessayez dans quelques minutes.'
const MESSAGE_IDENTIFIANTS = 'Numéro de téléphone ou mot de passe incorrect.'

export type VariablesAuth = { Variables: { utilisateurId: string } }

function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    console.error('[auth] JWT_SECRET absent ou trop court (32 caractères au minimum) dans server/.env.')
    throw new HTTPException(503, { message: MESSAGE_INDISPONIBLE })
  }
  return s
}

async function creerJeton(utilisateurId: string): Promise<string> {
  const maintenant = Math.floor(Date.now() / 1000)
  return sign({ sub: utilisateurId, iat: maintenant, exp: maintenant + DUREE_JETON_S }, secret(), 'HS256')
}

// ── Entrées ──
const Telephone = z
  .string({ error: MESSAGE_TELEPHONE_VIDE })
  .transform((brut, ctx) => {
    if (brut.trim() === '') {
      ctx.addIssue({ code: 'custom', message: MESSAGE_TELEPHONE_VIDE })
      return z.NEVER
    }
    const n = normaliserTelephone(brut)
    if (!n) {
      ctx.addIssue({ code: 'custom', message: MESSAGE_TELEPHONE })
      return z.NEVER
    }
    return n
  })

const MotDePasse = z
  .string({ error: 'Le mot de passe est obligatoire.' })
  .min(8, 'Le mot de passe doit avoir au moins 8 caractères.')
  .max(72, 'Le mot de passe est trop long (72 caractères au maximum).')

const SchemaInscription = z.object({
  nom: z.string({ error: 'Le nom est obligatoire.' }).trim()
    .min(2, 'Le nom doit avoir au moins 2 lettres.').max(60, 'Le nom est trop long (60 caractères au maximum).'),
  telephone: Telephone,
  motDePasse: MotDePasse,
  siteId: z
    .string()
    .refine((id) => SITES.some((s) => s.id === id), 'Ville inconnue.')
    .optional(),
  profil: z.enum(['producteur', 'conseiller', 'organisation'], { error: 'Profil inconnu.' }).optional(),
})

const SchemaMajCompte = z
  .object({
    profil: z.enum(['producteur', 'conseiller', 'organisation'], { error: 'Profil inconnu.' }).optional(),
    siteId: z.string().refine((id) => SITES.some((s) => s.id === id), 'Ville inconnue.').optional(),
  })
  .refine((d) => d.profil !== undefined || d.siteId !== undefined, 'Rien à modifier : indiquez un profil ou une ville.')

const SchemaConnexion = z.object({
  telephone: Telephone,
  motDePasse: z.string({ error: 'Le mot de passe est obligatoire.' }).min(1, 'Le mot de passe est obligatoire.').max(72),
})

// ── Limite des tentatives : 10 essais par quart d'heure et par adresse (contre les essais de mots de passe en série) ──
const FENETRE_MS = 15 * 60_000
const MAX_TENTATIVES = 10
const tentatives = new Map<string, number[]>()

function compterTentative(cle: string): void {
  const maintenant = Date.now()
  const recentes = (tentatives.get(cle) ?? []).filter((t) => maintenant - t < FENETRE_MS)
  if (recentes.length >= MAX_TENTATIVES) {
    tentatives.set(cle, recentes)
    throw new HTTPException(429, { message: 'Trop d\'essais. Patientez un quart d\'heure avant de réessayer.' })
  }
  recentes.push(maintenant)
  tentatives.set(cle, recentes)
}

setInterval(() => {
  const maintenant = Date.now()
  for (const [cle, temps] of tentatives) if (temps.every((t) => maintenant - t >= FENETRE_MS)) tentatives.delete(cle)
}, FENETRE_MS).unref()

async function lireCorps<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const brut: unknown = await c.req.json().catch(() => {
    throw new HTTPException(400, { message: 'Le corps de la requête doit être du JSON.' })
  })
  const r = schema.safeParse(brut)
  if (!r.success) throw new HTTPException(400, { message: premierMessage(r.error) })
  return r.data
}

/** Exécute un accès à la base ; une panne devient une 503 lisible (le détail reste dans le journal). */
async function base<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (erreur) {
    if (erreur instanceof HTTPException || erreur instanceof TelephoneDejaPris) throw erreur
    console.error('[auth]', erreur)
    throw new HTTPException(503, { message: MESSAGE_INDISPONIBLE })
  }
}

/**
/** Middleware : exige un jeton valide et place l'id du producteur dans c.get('utilisateurId'). */
export const exigerCompte = createMiddleware<VariablesAuth>(async (c, next) => {
  const entete = c.req.header('authorization') ?? ''
  const jeton = /^Bearer\s+(.+)$/i.exec(entete)?.[1]
  if (!jeton) throw new HTTPException(401, { message: 'Connectez-vous pour utiliser l\'agent S\'STACK.' })
  let sujet: unknown
  try {
    sujet = (await verify(jeton, secret(), 'HS256')).sub
  } catch (erreur) {
    if (erreur instanceof HTTPException) throw erreur
    throw new HTTPException(401, { message: 'Votre session a expiré. Reconnectez-vous.' })
  }
  if (typeof sujet !== 'string') throw new HTTPException(401, { message: 'Votre session a expiré. Reconnectez-vous.' })
  c.set('utilisateurId', sujet)
  await next()
})

/** Routes /api/auth/... ; `adresseIp` vient de l'API (même lecture que pour la limite des questions). */
export function routesAuth(adresseIp: (c: Context) => string) {
  const auth = new Hono<VariablesAuth>()

  auth.post('/inscription', async (c) => {
    compterTentative(`ip:${adresseIp(c)}`)
    const d = await lireCorps(c, SchemaInscription)
    const empreinte = await hacherMotDePasse(d.motDePasse)
    let utilisateur: Utilisateur
    try {
      utilisateur = await base(() => creerUtilisateur({ nom: d.nom, telephone: d.telephone, siteId: d.siteId ?? null, empreinte, profil: d.profil ?? 'producteur' }))
    } catch (erreur) {
      if (erreur instanceof TelephoneDejaPris) {
        throw new HTTPException(409, { message: 'Ce numéro a déjà un compte. Connectez-vous avec votre mot de passe.' })
      }
      throw erreur
    }
    return c.json<ReponseAuth>({ jeton: await creerJeton(utilisateur.id), utilisateur }, 201)
  })

  auth.post('/connexion', async (c) => {
    compterTentative(`ip:${adresseIp(c)}`)
    const d = await lireCorps(c, SchemaConnexion)
    const compte = await base(() => trouverParTelephone(d.telephone))
    // Même calcul que le numéro existe ou non : la réponse ne révèle pas quels numéros ont un compte
    const valide = await verifierMotDePasse(d.motDePasse, compte?.empreinte ?? (await empreinteLeurre()))
    if (!compte || !valide) throw new HTTPException(401, { message: MESSAGE_IDENTIFIANTS })
    return c.json<ReponseAuth>({ jeton: await creerJeton(compte.utilisateur.id), utilisateur: compte.utilisateur })
  })

  auth.get('/moi', exigerCompte, async (c) => {
    const utilisateur = await base(() => trouverParId(c.get('utilisateurId')))
    if (!utilisateur) throw new HTTPException(401, { message: 'Ce compte n\'existe plus. Créez un nouveau compte.' })
    return c.json<Utilisateur>(utilisateur)
  })

  // Changer de profil ou de ville (page Paramètres)
  auth.patch('/moi', exigerCompte, async (c) => {
    const d = await lireCorps(c, SchemaMajCompte)
    const utilisateur = await base(() => majCompte(c.get('utilisateurId'), d))
    if (!utilisateur) throw new HTTPException(401, { message: "Ce compte n'existe plus. Créez un nouveau compte." })
    return c.json<Utilisateur>(utilisateur)
  })

  return auth
}
