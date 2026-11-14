// Bot Telegram S'STACK (grammY) : texte et vocaux, position partagée ou ville choisie.
// Aucune donnée personnelle conservée : seule la position est gardée en mémoire, par conversation.
import { Bot, type Context, Keyboard } from 'grammy'
import { repondreClimat } from '../agents/climat.js'
import { SITES } from '../context/sites.js'
import { enregistrerConseil } from '../db/supabase.js'
import { LIMITES_GABON, SchemaDemandeConseil } from '../gateways/guardrails.js'
import { transcrire } from '../gateways/voice.js'
import type { DemandeConseil } from '../types/api.js'

type Lieu = { lat: number; lon: number; nomLieu: string }

// Position mémorisée par conversation (chat.id) ; perdue au redémarrage du serveur, ce qui est acceptable pour la démo
const lieux = new Map<number, Lieu>()

const BOUTON_POSITION = '📍 Partager ma position'
const MESSAGE_ERREUR = 'Désolé, je n\'arrive pas à répondre pour le moment. Réessayez dans quelques minutes.'

/** Clavier : partage de position + les 8 villes connues (2 par ligne). */
function clavier(): Keyboard {
  const k = new Keyboard().requestLocation(BOUTON_POSITION).row()
  SITES.forEach((s, i) => {
    k.text(s.nom)
    if (i % 2 === 1) k.row()
  })
  return k.resized()
}

const dansLeGabon = (lat: number, lon: number) =>
  lat >= LIMITES_GABON.latMin && lat <= LIMITES_GABON.latMax && lon >= LIMITES_GABON.lonMin && lon <= LIMITES_GABON.lonMax

/** Affiche « en train d'écrire » pendant tout le calcul (Telegram l'efface au bout de 5 s). */
async function avecIndicateur<T>(ctx: Context, action: () => Promise<T>): Promise<T> {
  const envoyer = () => ctx.replyWithChatAction('typing').catch(() => undefined)
  void envoyer()
  const minuterie = setInterval(envoyer, 4000)
  try {
    return await action()
  } finally {
    clearInterval(minuterie)
  }
}

/** Interroge l'agent pour ce lieu, envoie la réponse, enregistre le conseil (sans bloquer si Supabase échoue). */
async function conseiller(ctx: Context, lieu: Lieu, question: string, transcription?: string): Promise<void> {
  const verifiee = SchemaDemandeConseil.safeParse({ ...lieu, question, canal: 'telegram' })
  if (!verifiee.success) {
    await ctx.reply(verifiee.error.issues[0]?.message ?? 'Je n\'ai pas compris votre question.')
    return
  }
  const demande: DemandeConseil = verifiee.data
  const reponse = await avecIndicateur(ctx, () => repondreClimat(demande))
  await ctx.reply(`${reponse.texte}\n\n📡 Données NASA POWER · ${lieu.nomLieu} · conseil à valider avec un agronome`)
  await enregistrerConseil(demande, transcription ? { ...reponse, transcription } : reponse, 'telegram')
}

export function creerBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command('start', (ctx) =>
    ctx.reply(
      'Bonjour, je suis S\'STACK 🌱\nJe vous dis quand planter, à partir des données de la NASA pour votre parcelle.\n\n' +
        'Partagez votre position, ou choisissez la ville la plus proche. Ensuite, posez votre question par écrit ou par message vocal.',
      { reply_markup: clavier() },
    ),
  )

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
    const lieu = lieux.get(ctx.chat.id)
    if (!lieu) {
      await ctx.reply('Avant votre question, partagez votre position ou choisissez une ville.', { reply_markup: clavier() })
      return
    }
    try {
      const fichier = await ctx.getFile()
      if (!fichier.file_path) throw new Error('Chemin du fichier vocal absent')
      const reponse = await fetch(`https://api.telegram.org/file/bot${token}/${fichier.file_path}`, { signal: AbortSignal.timeout(20_000) })
      if (!reponse.ok) throw new Error(`Téléchargement du vocal impossible (${reponse.status})`)
      const audio = Buffer.from(await reponse.arrayBuffer())
      const texte = await avecIndicateur(ctx, () => transcrire(audio, 'vocal.ogg'))
      if (!texte) {
        await ctx.reply('🎙️ Je n\'ai pas compris le message vocal. Pouvez-vous répéter, ou écrire votre question ?')
        return
      }
      await ctx.reply(`🎙️ J'ai compris : « ${texte} »`)
      await conseiller(ctx, lieu, texte, texte)
    } catch (erreur) {
      console.error('[telegram] vocal :', erreur)
      await ctx.reply(MESSAGE_ERREUR)
    }
  })

  bot.on('message:text', async (ctx) => {
    const texte = ctx.message.text.trim()
    const site = SITES.find((s) => s.nom === texte)
    if (site) {
      lieux.set(ctx.chat.id, { lat: site.lat, lon: site.lon, nomLieu: site.nom })
      await ctx.reply(`📍 ${site.nom} enregistré. Posez maintenant votre question, par écrit ou par message vocal.`)
      return
    }
    const lieu = lieux.get(ctx.chat.id)
    if (!lieu) {
      await ctx.reply('Avant votre question, partagez votre position ou choisissez une ville.', { reply_markup: clavier() })
      return
    }
    try {
      await conseiller(ctx, lieu, texte)
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
