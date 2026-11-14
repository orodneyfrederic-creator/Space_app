// Garde-fous : ce qui entre (question, position), le rythme des appels, et ce qui sort (pas de dose de produit).
import { z } from 'zod'

// Le Gabon et ses abords (latitude -4,5 à 2,5 ; longitude 8,5 à 14,8)
export const LIMITES_GABON = { latMin: -4.5, latMax: 2.5, lonMin: 8.5, lonMax: 14.8 } as const

const MESSAGE_HORS_GABON =
  'Cette position est en dehors du Gabon. S\'STACK conseille uniquement les parcelles situées au Gabon.'

/** Schéma d'une DemandeConseil (contrat src/types/api.ts), avec les règles d'entrée. */
export const SchemaDemandeConseil = z.object({
  lat: z.number({ error: 'La latitude doit être un nombre.' })
    .min(LIMITES_GABON.latMin, MESSAGE_HORS_GABON).max(LIMITES_GABON.latMax, MESSAGE_HORS_GABON),
  lon: z.number({ error: 'La longitude doit être un nombre.' })
    .min(LIMITES_GABON.lonMin, MESSAGE_HORS_GABON).max(LIMITES_GABON.lonMax, MESSAGE_HORS_GABON),
  nomLieu: z.string().trim().max(100).optional(),
  culture: z.string().trim().max(50).optional(),
  question: z.string({ error: 'La question est obligatoire.' }).trim()
    .min(1, 'La question est vide.').max(1000, 'La question est trop longue (1000 caractères au maximum).'),
  canal: z.enum(['web', 'telegram']).optional(),
})

/** Premier message d'erreur zod, lisible par un humain. */
export function premierMessage(erreur: z.ZodError): string {
  return erreur.issues[0]?.message ?? 'Demande invalide.'
}

// ── Limite d'appels : 10 questions par minute et par adresse IP (compteur en mémoire) ──
const FENETRE_MS = 60_000
const MAX_PAR_FENETRE = 10
const appelsParIp = new Map<string, number[]>()

/** Vrai si l'appel est autorisé (et le compte) ; faux si la limite est atteinte. */
export function autoriserAppel(ip: string, maintenant = Date.now()): boolean {
  const recents = (appelsParIp.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS)
  if (recents.length >= MAX_PAR_FENETRE) {
    appelsParIp.set(ip, recents)
    return false
  }
  recents.push(maintenant)
  appelsParIp.set(ip, recents)
  return true
}

// Nettoyage régulier pour que la Map ne grossisse pas indéfiniment
setInterval(() => {
  const maintenant = Date.now()
  for (const [ip, temps] of appelsParIp) {
    if (temps.every((t) => maintenant - t >= FENETRE_MS)) appelsParIp.delete(ip)
  }
}, FENETRE_MS).unref()

// ── Sortie : texte simple, aucune dose de produit, aucune promesse de rendement, 5 phrases au maximum ──
export const MAX_PHRASES = 5

const PRODUIT = /\b(engrais|pesticides?|herbicides?|insecticides?|fongicides?|npk|urée|uree)\b/i
const DOSE = /\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|litres?|grammes?)\s*(?:\/|par)\s*(?:ha|hectare|l|litre|m²|m2)\b/i
export const PHRASE_DOSE = 'Pour les doses de produits, demandez conseil à un agronome.'

// Une quantité récoltée (« 100 à 150 sacs », « 10 à 15 tonnes par hectare »)…
const QUANTITE = /\d+(?:[.,]\d+)?(?:\s*(?:à|-|–)\s*\d+(?:[.,]\d+)?)?\s*(?:sacs?|tonnes?|kilos?|kilogrammes?|kg|quintaux|régimes|tubercules)\b/i
// … dans une phrase qui parle de récolte ou de rendement
const CONTEXTE_RENDEMENT = /(récolt|rendement|produir|production|espérer|obtiendr|obtenir|par hectare|\/\s*ha\b)/i
export const PHRASE_RENDEMENT =
  'Je ne peux pas promettre de rendement : il dépend de votre parcelle, de la variété et de la saison ; un agronome local peut vous aider à l\'estimer.'

/**
 * Retire la mise en forme Markdown (titres, tableaux, listes, gras) : la réponse doit être un texte simple,
 * lisible sur Telegram et en synthèse vocale. Chaque élément de liste devient une phrase.
 */
export function texteSimple(texte: string): string {
  return texte
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^#{1,6}\s/.test(l) && !l.startsWith('|') && !/^[-*_]{3,}$/.test(l))
    .map((l) => l.replace(/^(?:[-*•]|\d+[.)])\s+/, ''))
    .map((l) => l.replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S[^*_]*\S|\S)[*_](?=\s|$|[.,;:!?])/g, '$1$2'))
    .map((l) => (/[.!?…:]$/.test(l) ? l : `${l}.`))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Découpe en phrases : coupure après . ! ? … suivie d'une majuscule (les décimales « 330,5 » ne coupent pas). */
export function decouperPhrases(texte: string): string[] {
  return texte
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«"(])/u)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Garde-fou de sortie, appliqué à toutes les réponses de l'agent :
 * 1. texte simple ; 2. phrase avec une dose de produit → renvoi vers un agronome ;
 * 3. phrase qui promet un rendement → refus poli ; 4. au maximum 5 phrases.
 */
export function filtrerSortie(texte: string): string {
  const remplacements = new Set<string>()
  const phrases = decouperPhrases(texteSimple(texte)).flatMap((phrase) => {
    let remplacement: string | null = null
    if (DOSE.test(phrase) && PRODUIT.test(phrase)) remplacement = PHRASE_DOSE
    else if (QUANTITE.test(phrase) && CONTEXTE_RENDEMENT.test(phrase)) remplacement = PHRASE_RENDEMENT
    if (remplacement === null) return [phrase]
    if (remplacements.has(remplacement)) return [] // une seule fois chaque renvoi
    remplacements.add(remplacement)
    return [remplacement]
  })
  return phrases.slice(0, MAX_PHRASES).join(' ').trim()
}
