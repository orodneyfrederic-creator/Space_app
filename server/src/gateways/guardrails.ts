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

// ── Sortie : aucune dose de produit chimique ──
const PRODUIT = /\b(engrais|pesticides?|herbicides?|insecticides?|fongicides?|npk|urée|uree)\b/i
const DOSE = /\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|litres?|grammes?)\s*(?:\/|par)\s*(?:ha|hectare|l|litre|m²|m2)\b/i
export const PHRASE_DOSE = 'Pour les doses de produits, demandez conseil à un agronome.'

/** Remplace chaque phrase qui donne une dose de produit chimique par un renvoi vers un agronome. */
export function filtrerSortie(texte: string): string {
  const phrases = texte.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [texte]
  let dejaRemplace = false
  return phrases
    .map((phrase) => {
      if (!(DOSE.test(phrase) && PRODUIT.test(phrase))) return phrase
      const remplacement = dejaRemplace ? '' : `${PHRASE_DOSE} `
      dejaRemplace = true
      return remplacement
    })
    .join('')
    .trim()
}
