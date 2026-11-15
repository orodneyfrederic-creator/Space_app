// Identité visuelle S'STACK : source unique pour le nom, le slogan, les couleurs et les logos.
// Référence : Documents/S'STACK/Visuel S'STACK (brand boards, codes couleurs, logos, polices).
// Les mêmes couleurs existent en CSS dans app/globals.css (variables --ss-* et classes Tailwind).

export const MARQUE = {
  nom: "S'STACK",
  slogan: 'Cultiver demain avec les données du ciel',
  description:
    "Des satellites de la NASA aux terres du Gabon : S'STACK aide chaque agriculteur à choisir le bon moment pour semer et la rotation de cultures qui protège son sol.",
  concours: 'NASA Space Apps Challenge 2026 · Field Shift: Adapting Farms with NASA Data',
} as const

/**
 * Les 8 couleurs de la charte. Le vert, le jaune et le bleu sont ceux du drapeau gabonais.
 * Règle : le Jaune Soleil n'est jamais du texte sur fond clair (accent sur Vert Forêt ou Noir Ébène).
 */
export const COULEURS = {
  noirEbene: '#111A14', // texte principal, fonds sombres
  vertForet: '#0B5D3B', // couleur principale : en-têtes, boutons
  vertGabon: '#009E60', // succès, sol sain, cultures
  jauneSoleil: '#FCD116', // accent, alertes chaleur (jamais en texte sur fond clair)
  bleuOcean: '#3A75C4', // eau, pluie, humidité du sol, données NASA
  terreLaterite: '#B4532A', // sol, érosion, risque
  pierreMbigou: '#E9E2CF', // fonds clairs, cartes
  blanc: '#FFFFFF', // surfaces, texte sur fond sombre
} as const

/** Fichiers des logos (dossier public/brand/), marges transparentes retirées. */
export const LOGOS = {
  principal: { src: '/brand/logo-principal.png', largeur: 1264, hauteur: 314 }, // fond clair
  tricolore: { src: '/brand/logo-tricolore.png', largeur: 1264, hauteur: 314 }, // fond clair, version drapeau
  negatif: { src: '/brand/logo-negatif.png', largeur: 1264, hauteur: 314 }, // fond sombre
  icone: { src: '/brand/icone.png', largeur: 728, hauteur: 728 }, // symbole seul : la feuille aux couleurs du Gabon
  iconeTricolore: { src: '/brand/icone-tricolore.png', largeur: 728, hauteur: 728 }, // symbole seul : la feuille (même image)
  feuille: { src: '/brand/feuille-gabon.png', largeur: 728, hauteur: 728 }, // la feuille seule, fond transparent
} as const

export type VarianteLogo = keyof typeof LOGOS
