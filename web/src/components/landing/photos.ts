// Photos de la landing (Unsplash, licence libre : https://unsplash.com/license).
// Import statique : Next.js connaît leurs dimensions et génère un flou de chargement.
import arachide from '../../../public/landing/arachide.jpg'
import hero from '../../../public/landing/hero.jpg'
import impact from '../../../public/landing/impact.jpg'
import mais from '../../../public/landing/mais.jpg'
import manioc from '../../../public/landing/manioc.jpg'
import numerique from '../../../public/landing/numerique.jpg'
import pastille1 from '../../../public/landing/pastille-1.jpg'
import pastille2 from '../../../public/landing/pastille-2.jpg'
import pastille3 from '../../../public/landing/pastille-3.jpg'
import plantain from '../../../public/landing/plantain.jpg'
import telegram from '../../../public/landing/telegram.jpg'

export const PHOTOS = { arachide, hero, impact, mais, manioc, numerique, pastille1, pastille2, pastille3, plantain, telegram }

/** Crédits affichés dans le pied de page (l'attribution n'est pas obligatoire, mais elle est appréciée). */
export const CREDITS: readonly { auteur: string; lien: string }[] = [
  { auteur: 'Richard Nyoni', lien: 'https://unsplash.com/photos/1AoGjqdyDLU' },
  { auteur: 'Annie Spratt', lien: 'https://unsplash.com/photos/QYcSeY7vuZM' },
  { auteur: "Land O'Lakes, Inc.", lien: 'https://unsplash.com/photos/5vVjIErxZlo' },
  { auteur: 'Ali Mkumbwa', lien: 'https://unsplash.com/photos/s8Kzx7C6yqo' },
  { auteur: 'Tim Oun', lien: 'https://unsplash.com/photos/FjE-FyxDmlw' },
  { auteur: 'Lisa Marie Theck', lien: 'https://unsplash.com/photos/uBsAfl1t4dE' },
  { auteur: 'Daniel Dan', lien: 'https://unsplash.com/photos/0_GtcvY4Mj4' },
  { auteur: 'Samuel Boadi', lien: 'https://unsplash.com/photos/tXDDrSoQ44A' },
  { auteur: 'Iboyi Ejiro', lien: 'https://unsplash.com/photos/h7ZHGoGlkyM' },
  { auteur: 'Zoshua Colah', lien: 'https://unsplash.com/photos/3lsG4h8pUZY' },
]
