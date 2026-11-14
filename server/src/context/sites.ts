// Sites connus de S'STACK (Nyanga = zone pilote). Sert quand le producteur donne un nom de ville
// au lieu de partager sa position.
export type Site = { id: string; nom: string; lat: number; lon: number }

export const SITES: Site[] = [
  { id: 'tchibanga', nom: 'Tchibanga (Nyanga)', lat: -2.85, lon: 11.02 },
  { id: 'mouila', nom: 'Mouila (Ngounié)', lat: -1.87, lon: 11.06 },
  { id: 'lambarene', nom: 'Lambaréné (Moyen-Ogooué)', lat: -0.7, lon: 10.24 },
  { id: 'libreville', nom: 'Libreville (Estuaire)', lat: 0.39, lon: 9.45 },
  { id: 'oyem', nom: 'Oyem (Woleu-Ntem)', lat: 1.6, lon: 11.58 },
  { id: 'makokou', nom: 'Makokou (Ogooué-Ivindo)', lat: 0.57, lon: 12.86 },
  { id: 'koulamoutou', nom: 'Koulamoutou (Ogooué-Lolo)', lat: -1.13, lon: 12.47 },
  { id: 'franceville', nom: 'Franceville (Haut-Ogooué)', lat: -1.63, lon: 13.58 },
]

/** Cherche un site par son nom (sans tenir compte des accents ni des majuscules). */
export function trouverSite(nom: string): Site | undefined {
  const simple = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const cherche = simple(nom)
  return SITES.find((s) => simple(s.nom).includes(cherche))
}
