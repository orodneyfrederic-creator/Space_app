// Constantes partagées par les composants de la landing (serveur et client).

/** Marges latérales communes : pleine largeur, pas de conteneur centré. */
export const GOUTTIERE = 'px-5 sm:px-10 lg:px-16 xl:px-24'

/** Ancres de la page (navigation du hero, menu mobile, pied de page). */
export const ANCRES = [
  { href: '#accueil', label: 'Accueil' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#outils', label: 'Outils' },
  { href: '#cultures', label: 'Cultures' },
  { href: '#a-propos', label: 'À propos' },
] as const
