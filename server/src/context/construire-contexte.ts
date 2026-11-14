// Assemblage du contexte envoyé au LLM, dans l'ordre des 4 couches :
// 1. skill  2. fiches de connaissances  3. extraits RAG (plus tard)  4. fiche parcelle
// puis la question du producteur, isolée entre balises.
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { ficheParcelle, type FicheParcelle } from './fiche-parcelle.js'
import { lireFiches, lireSkill } from './knowledge.js'

export type Producteur = {
  lat: number
  lon: number
  nomLieu?: string
  culture?: string
}

export type Contexte = {
  messages: ChatCompletionMessageParam[]
  /** La fiche calculée, pour l'afficher ou l'enregistrer à côté de la réponse */
  fiche: FicheParcelle
}

/**
 * Neutralise les balises dans la question : un producteur ne doit pas pouvoir « fermer »
 * la balise <question_producteur> et écrire des instructions en dehors (injection de prompt).
 */
function nettoyerQuestion(question: string): string {
  return question.replace(/[<>]/g, ' ').trim()
}

export async function construireContexte(producteur: Producteur, question: string, agent = 'climat'): Promise<Contexte> {
  const skill = lireSkill(agent) // couche 1
  const fiches = lireFiches() // couche 2
  const extraits = '' // couche 3 : RAG, plus tard (ÉTAPE 6)
  const fiche = await ficheParcelle(producteur.lat, producteur.lon, {
    nomLieu: producteur.nomLieu,
    culture: producteur.culture,
  }) // couche 4

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: `${skill}\n\n## CONNAISSANCES\n${fiches}` },
    {
      role: 'system',
      content: `## FICHE PARCELLE\n${fiche.texte}${extraits ? `\n\n## EXTRAITS DE GUIDES\n${extraits}` : ''}`,
    },
    { role: 'user', content: `<question_producteur>\n${nettoyerQuestion(question)}\n</question_producteur>` },
  ]
  return { messages, fiche }
}

/** Nombre de mots du contexte (le brief vise moins de 6 000 mots). */
export function compterMots(messages: ChatCompletionMessageParam[]): number {
  return messages
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}
