// Lecture des connaissances de S'STACK : le skill d'un agent (couche 1) et les fiches (couche 2).
// Les fichiers sont relus à chaque appel : une fiche modifiée est prise en compte sans redémarrer le serveur.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Dossier knowledge/ à la racine du projet, trouvé à partir de ce fichier
// (server/src/context/ ou server/dist/context/ → ../../../knowledge), quel que soit le dossier de lancement.
const DOSSIER_KNOWLEDGE = fileURLToPath(new URL('../../../knowledge/', import.meta.url))

/** Lit un fichier texte en normalisant les fins de ligne Windows (\r\n → \n). */
function lireTexte(chemin: string): string {
  return readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n')
}

/** Retire l'en-tête YAML (entre deux lignes « --- ») au début d'un fichier Markdown. */
export function retirerEnTete(texte: string): string {
  return texte.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
}

/** Couche 1 : le skill d'un agent (rôle, règles, format de réponse), sans son en-tête. */
export function lireSkill(agent: string): string {
  const chemin = join(DOSSIER_KNOWLEDGE, 'skills', agent, 'SKILL.md')
  try {
    return retirerEnTete(lireTexte(chemin))
  } catch {
    throw new Error(`Skill introuvable pour l'agent « ${agent} » : ${chemin}`)
  }
}

/** Couche 2 : toutes les fiches de connaissances, chacune précédée d'un titre « ### nom ». */
export function lireFiches(): string {
  const dossier = join(DOSSIER_KNOWLEDGE, 'fiches')
  return readdirSync(dossier)
    .filter((nom) => nom.endsWith('.md'))
    .sort()
    .map((nom) => `### ${nom.replace(/\.md$/, '')}\n${retirerEnTete(lireTexte(join(dossier, nom)))}`)
    .join('\n\n')
}
