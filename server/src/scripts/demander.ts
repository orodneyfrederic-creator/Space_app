// Pose une question à l'agent Climat pour une ville connue, et affiche la réponse.
// Utilisation (dans le dossier server) :
//   npx tsx src/scripts/demander.ts Tchibanga "Est-ce que je peux planter mon manioc cette semaine ?"
//   npx tsx src/scripts/demander.ts Tchibanga "..." --contexte   → affiche aussi le contexte complet
import 'dotenv/config'
import { compterMots, construireContexte } from '../context/construire-contexte.js'
import { SITES, trouverSite } from '../context/sites.js'
import { demanderLLM } from '../gateways/llm.js'

const args = process.argv.slice(2)
const afficherContexte = args.includes('--contexte')
const [ville, ...mots] = args.filter((a) => a !== '--contexte')
const question = mots.join(' ').trim()

if (!ville || !question) {
  console.error('Utilisation : npx tsx src/scripts/demander.ts <ville> "<question>" [--contexte]')
  console.error(`Villes connues : ${SITES.map((s) => s.nom).join(', ')}`)
  process.exit(1)
}

const site = trouverSite(ville)
if (!site) {
  console.error(`Ville inconnue : ${ville}. Villes connues : ${SITES.map((s) => s.nom).join(', ')}`)
  process.exit(1)
}

const { messages, fiche } = await construireContexte(
  { lat: site.lat, lon: site.lon, nomLieu: site.nom, culture: 'manioc' },
  question,
)

if (afficherContexte) {
  for (const m of messages) console.log(`\n===== ${m.role.toUpperCase()} =====\n${typeof m.content === 'string' ? m.content : ''}`)
}

console.log(`\n${fiche.texte}`)
console.log(`\nContexte : ${compterMots(messages)} mots (objectif < 6 000)`)
console.log(`\nQuestion : ${question}`)

const debut = Date.now()
const reponse = await demanderLLM(messages, { temperature: 0.2 })
console.log(`\nRéponse (${reponse.fournisseur}, ${reponse.modele}, ${((Date.now() - debut) / 1000).toFixed(1)} s) :\n${reponse.texte}\n`)
