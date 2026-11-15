// Numéros de téléphone gabonais. En base, une seule écriture : +2410XXXXXXXX (ex. +241077123456).
//
// Saisie du producteur (site) : STRICTE, deux écritures acceptées seulement :
//   - « 077 12 34 56 » (ou collé : 077123456) ;
//   - « +241 77 12 34 56 » (ou collé : +24177123456 ; le 0 après +241 est toléré : +241 077 12 34 56).
// Tout le reste (tirets, points, chiffres manquants, 00241…) est refusé avec MESSAGE_TELEPHONE.
//
// Numéro transmis par Telegram (« Partager mon numéro ») : écrit par Telegram, pas par le producteur
// (ex. 24177123456) ; on le lit avec normaliserTelephoneTelegram.

export const MESSAGE_TELEPHONE_VIDE = 'Entrez votre numéro de téléphone.'
export const MESSAGE_TELEPHONE =
  'Ce numéro est mal écrit. Écrivez-le comme ceci : 077 12 34 56 ou +241 77 12 34 56.'

// Groupes : 0XX XX XX XX, espaces facultatifs mais seulement entre les groupes
const NATIONAL = /^0([1-7]\d) ?(\d{2}) ?(\d{2}) ?(\d{2})$/
// +241 puis XX XX XX XX (le 0 du numéro national est toléré)
const INTERNATIONAL = /^\+241 ?0?([1-7]\d) ?(\d{2}) ?(\d{2}) ?(\d{2})$/

/** Numéro écrit par le producteur → +2410XXXXXXXX, ou null s'il est mal écrit. */
export function normaliserTelephone(brut: string): string | null {
  const m = NATIONAL.exec(brut.trim()) ?? INTERNATIONAL.exec(brut.trim())
  return m ? `+2410${m.slice(1, 5).join('')}` : null
}

/** Numéro fourni par Telegram (chiffres seuls, avec ou sans +) → +2410XXXXXXXX, ou null s'il n'est pas gabonais. */
export function normaliserTelephoneTelegram(brut: string): string | null {
  const m = /^\+?2410?([1-7]\d{7})$/.exec(brut.trim())
  return m ? `+2410${m[1]}` : null
}

/** Affichage lisible : +241 077 12 34 56 */
export function afficherTelephone(normalise: string): string {
  const n = normalise.slice(4) // 077123456
  return `+241 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`
}
