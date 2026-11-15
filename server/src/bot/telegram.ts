// Bot Telegram S'STACK (grammY) : texte et vocaux.
// - Il faut un compte S'STACK (créé sur le site) : le producteur le relie en touchant « Partager mon numéro ».
// - Question écrite → réponse écrite. Question vocale → réponse en note vocale seulement (écrite si la voix échoue).
// - Le lieu, sans le redemander à chaque fois : 1) la ville citée dans la question (« … à Libreville ») ;
//   2) la position ou la ville choisie pendant la conversation ; 3) la ville du compte (gardée en base).
import { Bot, type Context, InputFile, Keyboard } from 'grammy'
import { repondreClimat } from '../agents/climat.js'
import { afficherTelephone, normaliserTelephoneTelegram } from '../auth/telephone.js'
import { SITES, type Site } from '../context/sites.js'
import { enregistrerConseil } from '../db/supabase.js'
import { changerSite, lierTelegram, trouverParTelegram, trouverParTelephone } from '../db/utilisateurs.js'
import { LIMITES_GABON, SchemaDemandeConseil } from '../gateways/guardrails.js'
import { synthetiser } from '../gateways/synthese.js'
import { transcrire } from '../gateways/voice.js'
import type { DemandeConseil, Utilisateur } from '../types/api.js'

type Lieu = { lat: number; lon: number; nomLieu: string }
type Mode = 'texte' | 'voix'

// Lieu choisi pendant la conversation (chat.id) ; perdu au redémarrage : on retombe alors sur la ville du compte
const lieux = new Map<number, Lieu>()

// Compte S'STACK relié, par identifiant Telegram (simple cache : la base fait foi)
const comptes = new Map<number, Utilisateur>()

const BOUTON_POSITION = '📍 Partager ma position'
const BOUTON_NUMERO = '📱 Partager mon numéro'
const MESSAGE_ERREUR = 'Désolé, je n\'arrive pas à répondre pour le moment. Réessayez dans quelques minutes.'
const ADRESSE_SITE = process.env.FRONTEND_URL ?? 'http://localhost:3000'
const MESSAGE_SANS_COMPTE =
  `Pour utiliser S'STACK, il faut un compte.\n\n1. Créez votre compte sur le site : ${ADRESSE_SITE}/inscription\n` +
  `2. Revenez ici et touchez « ${BOUTON_NUMERO} » : je relierai votre compte à Telegram.`
const MESSAGE_SANS_LIEU =
  'Pour quelle ville voulez-vous un conseil ? Touchez la ville la plus proche de vos champs, ou partagez votre position. Je la retiendrai pour la suite.'

/** Clavier : partage de position + les 8 villes connues (2 par ligne). */
function clavier(): Keyboard {
  const k = new Keyboard().requestLocation(BOUTON_POSITION).row()
  SITES.forEach((s, i) => {
    k.text(s.nom)
    if (i % 2 === 1) k.row()
  })
  return k.resized()
}

/** Clavier avec le seul bouton de partage du numéro (pour relier le compte). */
const clavierNumero = () => new Keyboard().requestContact(BOUTON_NUMERO).resized()

const lieuDuSite = (s: Site): Lieu => ({ lat: s.lat, lon: s.lon, nomLieu: s.nom })
const nomCourt = (nomLieu: string) => nomLieu.split(' (')[0] ?? nomLieu
const sansAccents = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Ville S'STACK citée dans la question (« planter à Libreville », « lambarene »…), sinon undefined. */
function villeCitee(texte: string): Site | undefined {
  const mots = new Set(sansAccents(texte).split(/[^a-z0-9]+/))
  return SITES.find((s) => mots.has(sansAccents(nomCourt(s.nom))))
}

/** Compte S'STACK relié à cet utilisateur Telegram, ou null. */
async function compteDe(ctx: Context): Promise<Utilisateur | null> {
  const telegramId = ctx.from?.id
  if (telegramId === undefined) return null
  const enCache = comptes.get(telegramId)
  if (enCache) return enCache
  const utilisateur = await trouverParTelegram(telegramId)
  if (utilisateur) comptes.set(telegramId, utilisateur)
  return utilisateur
}

/** Lieu de la question : ville citée, sinon lieu de la conversation, sinon ville du compte. */
function lieuDeLaQuestion(chatId: number, utilisateur: Utilisateur, question: string): Lieu | null {
  const citee = villeCitee(question)
  if (citee) return lieuDuSite(citee)
  const memorise = lieux.get(chatId)
  if (memorise) return memorise
  const duCompte = SITES.find((s) => s.id === utilisateur.siteId)
  return duCompte ? lieuDuSite(duCompte) : null
}

const dansLeGabon = (lat: number, lon: number) =>
  lat >= LIMITES_GABON.latMin && lat <= LIMITES_GABON.latMax && lon >= LIMITES_GABON.lonMin && lon <= LIMITES_GABON.lonMax

/** Affiche « en train d'écrire » (ou « enregistre un vocal ») pendant tout le calcul (Telegram l'efface au bout de 5 s). */
async function avecIndicateur<T>(ctx: Context, mode: Mode, action: () => Promise<T>): Promise<T> {
  const envoyer = () => ctx.replyWithChatAction(mode === 'voix' ? 'record_voice' : 'typing').catch(() => undefined)
  void envoyer()
  const minuterie = setInterval(envoyer, 4000)
  try {
    return await action()
  } finally {
    clearInterval(minuterie)
  }
}

/**
 * Interroge l'agent pour ce lieu, répond dans le même format que la question, enregistre le conseil.
 * Mode « voix » : note vocale seule (la source NASA est dite à la fin) ; si la voix échoue, réponse écrite.
 */
async function conseiller(ctx: Context, utilisateur: Utilisateur, lieu: Lieu, question: string, mode: Mode): Promise<void> {
  const verifiee = SchemaDemandeConseil.safeParse({ ...lieu, question, canal: 'telegram' })
  if (!verifiee.success) {
    await ctx.reply(verifiee.error.issues[0]?.message ?? 'Je n\'ai pas compris votre question.')
    return
  }
  const demande: DemandeConseil = verifiee.data
  const source = `📡 Données NASA POWER · ${lieu.nomLieu} · conseil à valider avec un agronome`

  const { reponse, vocal } = await avecIndicateur(ctx, mode, async () => {
    const r = await repondreClimat(demande)
    if (mode === 'texte') return { reponse: r, vocal: null }
    const dit = `${r.texte} Ces conseils viennent des données de la NASA pour ${nomCourt(lieu.nomLieu)}. Vérifiez-les avec un agronome.`
    return { reponse: r, vocal: await synthetiser(dit) }
  })

  if (vocal) await ctx.replyWithVoice(new InputFile(vocal, 'conseil-sstack.ogg'))
  else await ctx.reply(`${reponse.texte}\n\n${source}`)
  await enregistrerConseil(demande, mode === 'voix' ? { ...reponse, transcription: question } : reponse, 'telegram', utilisateur.id)
}

/** Message d'accueil d'un producteur relié : sa ville actuelle, et comment poser sa question. */
function accueil(utilisateur: Utilisateur, chatId: number): string {
  const lieu = lieuDeLaQuestion(chatId, utilisateur, '')
  if (!lieu) return MESSAGE_SANS_LIEU
  return (
    `Votre ville : ${lieu.nomLieu}.\n\nPosez directement votre question, par écrit ou par message vocal ` +
    '(je réponds par écrit à l\'écrit, et par vocal au vocal).\n\nPour une autre ville, touchez-la ci-dessous ou citez-la dans votre question.'
  )
}

export function creerBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command('start', async (ctx) => {
    const bonjour = 'Bonjour, je suis S\'STACK 🌱\nJe vous dis quand planter, à partir des données de la NASA pour votre parcelle.\n\n'
    const utilisateur = await compteDe(ctx).catch((erreur: unknown) => {
      console.error('[telegram] lecture du compte :', erreur)
      return null
    })
    if (!utilisateur) {
      await ctx.reply(bonjour + MESSAGE_SANS_COMPTE, { reply_markup: clavierNumero() })
      return
    }
    await ctx.reply(bonjour + accueil(utilisateur, ctx.chat.id), { reply_markup: clavier() })
  })

  // Relier le compte : le producteur partage SON numéro (Telegram le garantit) et on cherche le compte correspondant
  bot.on('message:contact', async (ctx) => {
    const contact = ctx.message.contact
    if (contact.user_id !== ctx.from.id) {
      await ctx.reply('Partagez votre propre numéro avec le bouton ci-dessous.', { reply_markup: clavierNumero() })
      return
    }
    const telephone = normaliserTelephoneTelegram(contact.phone_number)
    if (!telephone) {
      await ctx.reply('Ce numéro n\'est pas un numéro gabonais. S\'STACK fonctionne avec les numéros du Gabon (+241).')
      return
    }
    const compte = await trouverParTelephone(telephone).catch((erreur: unknown) => {
      console.error('[telegram] recherche du compte :', erreur)
      return undefined
    })
    if (compte === undefined) {
      await ctx.reply(MESSAGE_ERREUR)
      return
    }
    if (!compte) {
      await ctx.reply(
        `Aucun compte S'STACK avec le numéro ${afficherTelephone(telephone)}.\n\n` +
          `Créez votre compte avec ce numéro sur ${ADRESSE_SITE}/inscription, puis touchez à nouveau « ${BOUTON_NUMERO} ».`,
        { reply_markup: clavierNumero() },
      )
      return
    }
    try {
      await lierTelegram(compte.utilisateur.id, ctx.from.id)
    } catch (erreur) {
      console.error('[telegram] liaison du compte :', erreur)
      await ctx.reply(MESSAGE_ERREUR)
      return
    }
    for (const [id, u] of comptes) if (u.id === compte.utilisateur.id) comptes.delete(id)
    const utilisateur = { ...compte.utilisateur, telegramLie: true }
    comptes.set(ctx.from.id, utilisateur)
    await ctx.reply(`✅ Bienvenue ${utilisateur.nom} ! Votre compte est relié à Telegram.\n\n${accueil(utilisateur, ctx.chat.id)}`, {
      reply_markup: clavier(),
    })
  })

  // Tous les autres messages demandent un compte relié
  bot.use(async (ctx, next) => {
    if (!ctx.message) return next()
    let relie: boolean
    try {
      relie = (await compteDe(ctx)) !== null
    } catch (erreur) {
      console.error('[telegram] lecture du compte :', erreur)
      await ctx.reply(MESSAGE_ERREUR)
      return
    }
    if (relie) return next()
    await ctx.reply(MESSAGE_SANS_COMPTE, { reply_markup: clavierNumero() })
  })

  bot.on('message:location', async (ctx) => {
    const { latitude, longitude } = ctx.message.location
    if (!dansLeGabon(latitude, longitude)) {
      await ctx.reply('Cette position est en dehors du Gabon. Choisissez plutôt une ville dans la liste.', { reply_markup: clavier() })
      return
    }
    lieux.set(ctx.chat.id, { lat: latitude, lon: longitude, nomLieu: 'votre parcelle' })
    await ctx.reply('📍 Position enregistrée. Posez maintenant votre question, par écrit ou par message vocal.')
  })

  bot.on('message:voice', async (ctx) => {
    const utilisateur = comptes.get(ctx.from.id)
    if (!utilisateur) return
    try {
      const texte = await avecIndicateur(ctx, 'voix', async () => {
        const fichier = await ctx.getFile()
        if (!fichier.file_path) throw new Error('Chemin du fichier vocal absent')
        const r = await fetch(`https://api.telegram.org/file/bot${token}/${fichier.file_path}`, { signal: AbortSignal.timeout(20_000) })
        if (!r.ok) throw new Error(`Téléchargement du vocal impossible (${r.status})`)
        return transcrire(Buffer.from(await r.arrayBuffer()), 'vocal.ogg')
      })
      if (!texte) {
        await ctx.reply('🎙️ Je n\'ai pas compris le message vocal. Pouvez-vous répéter, ou écrire votre question ?')
        return
      }
      const lieu = lieuDeLaQuestion(ctx.chat.id, utilisateur, texte)
      if (!lieu) {
        await ctx.reply(MESSAGE_SANS_LIEU, { reply_markup: clavier() })
        return
      }
      await conseiller(ctx, utilisateur, lieu, texte, 'voix')
    } catch (erreur) {
      console.error('[telegram] vocal :', erreur)
      await ctx.reply(MESSAGE_ERREUR)
    }
  })

  bot.on('message:text', async (ctx) => {
    const utilisateur = comptes.get(ctx.from.id)
    if (!utilisateur) return
    const texte = ctx.message.text.trim()

    // Bouton d'une ville : elle devient la ville par défaut du compte
    const site = SITES.find((s) => s.nom === texte)
    if (site) {
      lieux.set(ctx.chat.id, lieuDuSite(site))
      comptes.set(ctx.from.id, { ...utilisateur, siteId: site.id })
      await changerSite(utilisateur.id, site.id).catch((erreur: unknown) => console.error('[telegram] ville du compte :', erreur))
      await ctx.reply(`📍 ${site.nom} enregistré : je m'en souviendrai. Posez maintenant votre question, par écrit ou par message vocal.`)
      return
    }

    const lieu = lieuDeLaQuestion(ctx.chat.id, utilisateur, texte)
    if (!lieu) {
      await ctx.reply(MESSAGE_SANS_LIEU, { reply_markup: clavier() })
      return
    }
    try {
      await conseiller(ctx, utilisateur, lieu, texte, 'texte')
    } catch (erreur) {
      console.error('[telegram] texte :', erreur)
      await ctx.reply(MESSAGE_ERREUR)
    }
  })

  // Une erreur dans un message ne doit jamais arrêter le bot
  bot.catch((erreur) => console.error('[telegram] erreur non gérée :', erreur.error))
  return bot
}

/** Démarre le bot en long polling si TELEGRAM_BOT_TOKEN existe. Un échec n'arrête pas le serveur web. */
export function demarrerBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN absent : bot non démarré.')
    return
  }
  const bot = creerBot(token)
  bot
    .start({ onStart: (infos) => console.log(`[telegram] bot @${infos.username} démarré (long polling)`) })
    .catch((erreur: unknown) => console.error('[telegram] le bot n\'a pas pu démarrer :', erreur))
  // Arrêt propre (redémarrage de tsx watch) pour éviter deux instances qui se disputent les messages
  const arreter = () => void bot.stop()
  process.once('SIGINT', arreter)
  process.once('SIGTERM', arreter)
}
