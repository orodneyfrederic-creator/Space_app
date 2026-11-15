// Manifeste web : nom, couleurs et icônes quand le site est ajouté à l'écran d'accueil d'un téléphone.
import type { MetadataRoute } from 'next'
import { COULEURS, MARQUE } from '@/lib/marque'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${MARQUE.nom} · ${MARQUE.slogan}`,
    short_name: MARQUE.nom,
    description: MARQUE.description,
    lang: 'fr',
    start_url: '/tableau-de-bord',
    display: 'standalone',
    background_color: COULEURS.pierreMbigou,
    theme_color: COULEURS.vertForet,
    icons: [
      { src: '/brand/icone-app-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icone-app-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
