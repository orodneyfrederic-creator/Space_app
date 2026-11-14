// DONNÉES DE DÉMONSTRATION : permettent de construire l'interface avant que l'API du serveur soit prête.
// Les coordonnées sont celles des sites connus du serveur (server/src/context/sites.ts).
// La fiche de Tchibanga reprend une vraie sortie du serveur (calculée le 14/11/2026).
// L'historique et la série de pluie sont INVENTÉS : à remplacer par les vraies données dès que possible.
import type { Conseil, DonneesFiche, Parcelle, PointPluie } from './types'

export const PARCELLES_DEMO: Parcelle[] = [
  { id: 'tchibanga', nom: 'Tchibanga (Nyanga)', lat: -2.85, lon: 11.02, culture: 'manioc' },
  { id: 'mouila', nom: 'Mouila (Ngounié)', lat: -1.87, lon: 11.06 },
  { id: 'lambarene', nom: 'Lambaréné (Moyen-Ogooué)', lat: -0.7, lon: 10.24 },
  { id: 'libreville', nom: 'Libreville (Estuaire)', lat: 0.39, lon: 9.45 },
  { id: 'oyem', nom: 'Oyem (Woleu-Ntem)', lat: 1.6, lon: 11.58 },
  { id: 'makokou', nom: 'Makokou (Ogooué-Ivindo)', lat: 0.57, lon: 12.86 },
  { id: 'koulamoutou', nom: 'Koulamoutou (Ogooué-Lolo)', lat: -1.13, lon: 12.47 },
  { id: 'franceville', nom: 'Franceville (Haut-Ogooué)', lat: -1.63, lon: 13.58 },
]

export const FICHE_DEMO_TCHIBANGA: DonneesFiche = {
  dernierJour: '2026-11-11',
  pluie30: 330.5,
  normale30: 220.7,
  ecart30: 50,
  pluie7: 129.9,
  normale7: 65.2,
  ecart7: 99,
  secs14: 1,
  secheresse14: 1,
  etatSol: 'humide',
  tmax7: 27.8,
  solTexture: { site: 'Tchibanga (Nyanga)', ph: 5, argile: 37.4, sable: 39, carbone: 26.9 },
  evaluation: { verdict: 'favorable', raison: 'saison démarrée, sol suffisamment humide et pluies régulières' },
}

// Série inventée (30 jours) pour dessiner le graphique de pluie
export const PLUIE_DEMO: PointPluie[] = Array.from({ length: 30 }, (_, i) => {
  const jour = new Date(Date.UTC(2026, 9, 13 + i))
  return { date: jour.toISOString().slice(0, 10), pluie: [0, 2, 15, 8, 0, 22, 30, 4, 11, 0][i % 10] }
})

export const HISTORIQUE_DEMO: Conseil[] = [
  {
    id: 'demo-1',
    date: '2026-11-14T09:12:00Z',
    parcelleId: 'tchibanga',
    question: 'Est-ce que je peux planter mon manioc cette semaine ?',
    reponse:
      "Oui, c'est un bon moment pour planter votre manioc cette semaine. La parcelle a reçu 330,5 mm de pluie en 30 jours, soit +50 % par rapport à la normale. Plantez sur des buttes et paillez pour limiter l'érosion.",
    canal: 'telegram',
  },
]
