// Voice Gateway : transcription de la voix en texte (STT) avec le Whisper de Groq.
// La synthèse vocale (TTS) et la conversion OGG/Opus viendront plus tard.
import { toFile } from 'openai'
import { getClientGroq } from './llm.js'

/**
 * Transcrit un message vocal (par exemple un .ogg reçu de Telegram) en texte français.
 * @param audio contenu du fichier audio
 * @param nomFichier nom avec extension : Groq s'en sert pour reconnaître le format
 */
export async function transcrire(audio: Buffer, nomFichier = 'vocal.ogg'): Promise<string> {
  const modele = process.env.GROQ_STT_MODEL
  if (!modele) {
    throw new Error("Variable d'environnement manquante : GROQ_STT_MODEL (voir .env.example à la racine)")
  }
  const transcription = await getClientGroq().audio.transcriptions.create({
    file: await toFile(audio, nomFichier),
    model: modele,
    language: 'fr',
  })
  return transcription.text.trim()
}
