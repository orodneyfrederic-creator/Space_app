// Synthèse vocale : la réponse de l'agent devient une note vocale Telegram.
// Voix Gemini (même clé GEMINI_API_KEY, modèle GEMINI_TTS_MODEL) → audio 24 kHz → OGG/Opus avec ffmpeg-static
// (format exigé par Telegram pour afficher une « note vocale »). Aucune dépendance de plus.
// Ne lève jamais d'erreur : en cas d'échec (quota, délai…), renvoie null et le producteur garde la réponse écrite.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { z } from 'zod'

// ffmpeg-static exporte le chemin du programme (module CommonJS : ses types ne collent pas à l'import ESM)
const cheminFfmpeg: unknown = createRequire(import.meta.url)('ffmpeg-static')
const ffmpeg = typeof cheminFfmpeg === 'string' ? cheminFfmpeg : null

const MODELE = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.8-flash-lite-tts'
const VOIX = process.env.GEMINI_TTS_VOIX ?? 'Charon' // voix grave et posée
const DELAI_MS = 30_000

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Écrit en toutes lettres ce qui se lit mal à voix haute (unités, dates, pourcentages). */
export function texteAPrononcer(texte: string): string {
  return texte
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, (tout, j: string, m: string, a: string) => {
      const mois = MOIS[Number(m) - 1]
      return mois ? `${Number(j) === 1 ? '1er' : Number(j)} ${mois} ${a}` : tout
    })
    .replace(/(\d)\s*mm\b/g, '$1 millimètres')
    .replace(/(\d)\s*°\s*C\b/g, '$1 degrés')
    .replace(/\+\s*(\d+(?:,\d+)?)\s*%/g, 'plus $1 pour cent')
    .replace(/-\s*(\d+(?:,\d+)?)\s*%/g, 'moins $1 pour cent')
    .replace(/(\d)\s*%/g, '$1 pour cent')
}

const ReponseGemini = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ inlineData: z.object({ mimeType: z.string(), data: z.string() }).optional() })),
        }),
      }),
    )
    .min(1),
})

/** Audio Gemini (WAV, ou PCM 16 bits 24 kHz brut) → OGG/Opus mono 32 kb/s. */
function versOggOpus(audio: Buffer, typeMime: string): Promise<Buffer> {
  const programme = ffmpeg
  if (!programme) return Promise.reject(new Error('ffmpeg-static introuvable'))
  const entree = typeMime.includes('wav') ? ['-f', 'wav'] : ['-f', 's16le', '-ar', '24000', '-ac', '1']
  return new Promise((resoudre, rejeter) => {
    const p = spawn(programme, ['-hide_banner', '-loglevel', 'error', ...entree, '-i', 'pipe:0', '-c:a', 'libopus', '-b:a', '32k', '-ac', '1', '-f', 'ogg', 'pipe:1'])
    const morceaux: Buffer[] = []
    let erreurs = ''
    p.stdout.on('data', (d: Buffer) => morceaux.push(d))
    p.stderr.on('data', (d: Buffer) => (erreurs += d.toString()))
    p.on('error', rejeter)
    p.on('close', (code) => (code === 0 ? resoudre(Buffer.concat(morceaux)) : rejeter(new Error(`ffmpeg (${code}) : ${erreurs.trim()}`))))
    p.stdin.end(audio)
  })
}

/** Note vocale OGG/Opus de la réponse, ou null si la synthèse est indisponible. */
export async function synthetiser(texte: string): Promise<Buffer | null> {
  const cle = process.env.GEMINI_API_KEY
  if (!cle) return null
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': cle },
      signal: AbortSignal.timeout(DELAI_MS),
      body: JSON.stringify({
        // Le texte seul : une consigne de style (« lisez d'une voix calme… ») serait lue à voix haute par le modèle
        contents: [{ parts: [{ text: texteAPrononcer(texte) }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOIX } } } },
      }),
    })
    if (!r.ok) throw new Error(`Gemini TTS ${r.status} : ${(await r.text()).slice(0, 200)}`)
    const parts = ReponseGemini.parse(await r.json()).candidates[0]?.content.parts ?? []
    const audio = parts.find((p) => p.inlineData)?.inlineData
    if (!audio) throw new Error('Gemini TTS : aucune donnée audio')
    return await versOggOpus(Buffer.from(audio.data, 'base64'), audio.mimeType)
  } catch (erreur) {
    console.error('[voix] synthèse impossible, réponse écrite seulement :', erreur instanceof Error ? erreur.message : erreur)
    return null
  }
}
