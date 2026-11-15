// Lancement de la visite guidée : automatique à la première visite du tableau de bord,
// puis à la demande (bouton « Comment ça marche ? » et entrée « Visite guidée » du menu).
export const PAGE_VISITE = '/tableau-de-bord'
export const CLE_VISITE_VUE = 'sstack:visite-vue'
const CLE_VISITE_DEMANDEE = 'sstack:visite-demandee'
export const EVENEMENT_LANCER_VISITE = 'sstack:lancer-visite'

/** Lecture / écriture protégées : le stockage peut être bloqué (navigation privée). */
export function lire(stockage: 'local' | 'session', cle: string): string | null {
  try {
    return (stockage === 'local' ? localStorage : sessionStorage).getItem(cle)
  } catch {
    return null
  }
}
export function ecrire(stockage: 'local' | 'session', cle: string, valeur: string | null) {
  try {
    const s = stockage === 'local' ? localStorage : sessionStorage
    if (valeur === null) s.removeItem(cle)
    else s.setItem(cle, valeur)
  } catch {
    // stockage indisponible : la visite se relancera simplement à la prochaine visite
  }
}

/** Demande une visite guidée. Hors du tableau de bord, `allerAuTableau` y emmène d'abord la personne. */
export function lancerVisite(allerAuTableau: () => void) {
  if (window.location.pathname === PAGE_VISITE) {
    window.dispatchEvent(new Event(EVENEMENT_LANCER_VISITE))
    return
  }
  ecrire('session', CLE_VISITE_DEMANDEE, '1')
  allerAuTableau()
}

/** Une visite a-t-elle été demandée depuis une autre page ? */
export const visiteDemandee = () => lire('session', CLE_VISITE_DEMANDEE) === '1'

/** Au démarrage de la visite : elle ne se relancera plus d'elle-même. */
export function marquerVisiteVue() {
  ecrire('session', CLE_VISITE_DEMANDEE, null)
  ecrire('local', CLE_VISITE_VUE, '1')
}

export const visiteDejaVue = () => lire('local', CLE_VISITE_VUE) === '1'
