// Pose toutes les questions de knowledge/tests/questions-test.md à l'agent Climat pour Tchibanga,
// sans rien enregistrer dans Supabase, puis écrit docs/resultats-tests-AAAA-MM-JJ.md pour relecture humaine.
// Utilisation (dans le dossier server) : npx tsx src/scripts/tester-agent.ts
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { repondreClimat } from '../agents/climat.js'
import { trouverSite } from '../context/sites.js'

const RACINE = new URL('../../../', import.meta.url)
const PAUSE_MS = 3000 // respecte les quotas gratuits

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Lignes « 1. question → note » : on garde la question, et la note comme comportement attendu. */
function lireQuestions(): { question: string; attendu?: string }[] {
  const texte = readFileSync(fileURLToPath(new URL('knowledge/tests/questions-test.md', RACINE)), 'utf8').replace(/\r\n/g, '\n')
  return texte
    .split('\n')
    .map((l) => /^\d+\.\s+(.+)$/.exec(l.trim())?.[1])
    .filter((l): l is string => Boolean(l))
    .map((l) => {
      const [question = '', attendu] = l.split('→').map((s) => s.trim())
      return { question, attendu }
    })
}

const site = trouverSite('Tchibanga')
if (!site) throw new Error('Site Tchibanga introuvable')

const questions = lireQuestions()
const date = new Date().toISOString().slice(0, 10)
const blocs: string[] = []
let ficheTexte = ''

for (const [i, { question, attendu }] of questions.entries()) {
  if (i > 0) await pause(PAUSE_MS)
  process.stdout.write(`(${i + 1}/${questions.length}) ${question} … `)
  try {
    const r = await repondreClimat({ lat: site.lat, lon: site.lon, nomLieu: site.nom, culture: 'manioc', question })
    ficheTexte ||= r.fiche.texte
    console.log(`${r.fournisseur} ✓`)
    blocs.push(
      [
        `## ${i + 1}. ${question}`,
        attendu ? `*Attendu : ${attendu}*` : '',
        '',
        `**Réponse** (${r.fournisseur}, ${r.modele}) :`,
        '',
        r.texte.split('\n').map((l) => `> ${l}`).join('\n'),
        '',
        '- [ ] Réponse directe en premier',
        '- [ ] Au moins 2 chiffres de la fiche',
        '- [ ] Action concrète',
        '- [ ] Aucun chiffre inventé',
      ]
        .filter((l, j) => l !== '' || j !== 1)
        .join('\n'),
    )
  } catch (erreur) {
    console.log('ÉCHEC')
    blocs.push(`## ${i + 1}. ${question}\n\n**Erreur :** ${String(erreur)}`)
  }
}

const sortie = fileURLToPath(new URL(`docs/resultats-tests-${date}.md`, RACINE))
writeFileSync(
  sortie,
  [
    `# Résultats des tests de l'agent Climat — ${date}`,
    '',
    `Site : ${site.nom} (${site.lat}, ${site.lon}) · culture déclarée : manioc · ${questions.length} questions.`,
    'À relire par l\'équipe : cocher chaque case, puis corriger la fiche, le skill ou le calcul en cause (jamais la réponse toute faite).',
    '',
    '<details><summary>Fiche parcelle utilisée</summary>',
    '',
    '```',
    ficheTexte,
    '```',
    '',
    '</details>',
    '',
    blocs.join('\n\n'),
    '',
  ].join('\n'),
)
console.log(`\nRésultats écrits dans ${sortie}`)
