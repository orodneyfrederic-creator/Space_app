// Affiche la fiche parcelle NASA de quelques sites.
// Utilisation (dans le dossier server) :
//   npx tsx src/scripts/fiche.ts                → Tchibanga et Libreville
//   npx tsx src/scripts/fiche.ts Mouila Oyem    → les sites demandés
import { ficheParcelle } from '../context/fiche-parcelle.js'
import { SITES, trouverSite } from '../context/sites.js'

const demandes = process.argv.slice(2)
const sites = demandes.length
  ? demandes.map((nom) => {
      const site = trouverSite(nom)
      if (!site) throw new Error(`Site inconnu : ${nom}. Sites connus : ${SITES.map((s) => s.nom).join(', ')}`)
      return site
    })
  : SITES.filter((s) => s.nom.startsWith('Tchibanga') || s.nom.startsWith('Libreville'))

for (const site of sites) {
  const fiche = await ficheParcelle(site.lat, site.lon, { nomLieu: site.nom, culture: 'manioc' })
  console.log(`\n${fiche.texte}\n`)
}
