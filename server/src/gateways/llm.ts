// LLM Gateway : point d'accès unique aux modèles de langage.
// Fournisseur principal : Groq. Secours : Gemini Flash.
// Les deux exposent une API compatible OpenAI : on utilise le SDK `openai` pour les deux.
import OpenAI, { APIConnectionTimeoutError, RateLimitError } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
const TIMEOUT_MS = 20_000

export type Fournisseur = 'groq' | 'gemini'

export type OptionsLLM = {
  /** Température : basse (0.2–0.3) pour des conseils stables. */
  temperature?: number
  /** Nombre maximal de jetons générés (raisonnement compris pour les modèles qui raisonnent). */
  maxTokens?: number
}

export type ReponseLLM = {
  texte: string
  fournisseur: Fournisseur
  modele: string
}

/** Lit une variable d'environnement obligatoire, avec un message clair si elle manque. */
function envObligatoire(nom: string): string {
  const valeur = process.env[nom]
  if (!valeur) {
    throw new Error(`Variable d'environnement manquante : ${nom} (voir .env.example à la racine)`)
  }
  return valeur
}

// Clients créés à la première utilisation : le serveur peut démarrer même si une clé manque.
let clientGroq: OpenAI | undefined
let clientGemini: OpenAI | undefined

/** Client Groq, partagé avec la Voice Gateway (Whisper). */
export function getClientGroq(): OpenAI {
  clientGroq ??= new OpenAI({
    apiKey: envObligatoire('GROQ_API_KEY'),
    baseURL: GROQ_BASE_URL,
    timeout: TIMEOUT_MS,
    // Pas de nouvelle tentative : en cas de 429 ou de timeout, on bascule tout de suite sur Gemini.
    maxRetries: 0,
  })
  return clientGroq
}

function getClientGemini(): OpenAI {
  clientGemini ??= new OpenAI({
    apiKey: envObligatoire('GEMINI_API_KEY'),
    baseURL: GEMINI_BASE_URL,
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  })
  return clientGemini
}

/** Réponse vide (par exemple tout le budget de jetons consommé par le raisonnement) : on bascule aussi. */
class ReponseVide extends Error {}

/** Vrai si l'erreur justifie de passer au fournisseur de secours (quota, délai dépassé ou réponse vide). */
function doitBasculer(erreur: unknown): boolean {
  return erreur instanceof RateLimitError || erreur instanceof APIConnectionTimeoutError || erreur instanceof ReponseVide
}

// Effort de raisonnement de Groq (gpt-oss) : « low » divise par ~8 les jetons de raisonnement
// (mesuré : 302 → 36 par question), ce qui ménage le quota gratuit. Valeurs : low, medium, high.
const EFFORTS = ['low', 'medium', 'high'] as const
type Effort = (typeof EFFORTS)[number]
function effortGroq(): Effort {
  const valeur = process.env.GROQ_REASONING_EFFORT ?? 'low'
  return EFFORTS.find((e) => e === valeur) ?? 'low'
}

// Plafond de jetons générés : une réponse de 5 phrases + un raisonnement court tiennent largement dedans
const MAX_JETONS_PAR_DEFAUT = 1024

async function appeler(
  client: OpenAI,
  fournisseur: Fournisseur,
  modele: string,
  messages: ChatCompletionMessageParam[],
  options: OptionsLLM,
): Promise<ReponseLLM> {
  const reponse = await client.chat.completions.create({
    model: modele,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? MAX_JETONS_PAR_DEFAUT,
    ...(fournisseur === 'groq' ? { reasoning_effort: effortGroq() } : {}),
  })
  const texte = reponse.choices[0]?.message.content?.trim()
  if (!texte) {
    throw new ReponseVide(`Réponse vide du fournisseur ${fournisseur} (modèle ${modele})`)
  }
  return { texte, fournisseur, modele }
}

/**
 * Envoie une conversation au LLM et renvoie le texte de la réponse.
 * Essaie Groq d'abord ; si Groq renvoie une erreur 429 ou dépasse le délai, réessaie avec Gemini.
 */
export async function demanderLLM(
  messages: ChatCompletionMessageParam[],
  options: OptionsLLM = {},
): Promise<ReponseLLM> {
  try {
    return await appeler(getClientGroq(), 'groq', envObligatoire('GROQ_MODEL'), messages, options)
  } catch (erreur) {
    if (!doitBasculer(erreur)) throw erreur
    const motif = erreur instanceof RateLimitError ? 'quota dépassé (429)' : erreur instanceof ReponseVide ? 'réponse vide' : 'délai dépassé'
    console.warn(`[LLM] Groq indisponible (${motif}), bascule sur Gemini.`)
    return appeler(getClientGemini(), 'gemini', envObligatoire('GEMINI_MODEL'), messages, options)
  }
}
