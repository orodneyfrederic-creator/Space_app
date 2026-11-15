// Mise en forme de l'état du sol (GET /api/etat-sol). Aucun calcul agronomique ici : les états, tendances
// et la phrase d'action viennent du serveur. On ne fait que formater (français) et choisir des couleurs.
import type { CodeAction, CoucheSol, Tendance, Verdict } from './types'

/** 0,62 → « 62 % » ; null → « — » */
export const pourcent = (indice: number | null) => (indice === null ? '—' : `${Math.round(indice * 100)} %`)

/** 24.55 → « 24,6 °C » */
export const degres = (t: number | null) => (t === null ? '—' : `${(Math.round(t * 10) / 10).toString().replace('.', ',')} °C`)

/** 93.1 → « 93,1 mm » */
export const millimetres = (n: number | null) => (n === null ? '—' : `${(Math.round(n * 10) / 10).toString().replace('.', ',')} mm`)

export const NOMS_COUCHES: Record<CoucheSol['nom'], string> = { surface: 'Dessus de la terre', racines: 'Autour des racines', profondeur: 'En profondeur' }
export const ETATS_COUCHE: Record<CoucheSol['etat'], string> = { sec: 'sèche', correct: 'bonne humidité', humide: 'très mouillée', inconnu: 'inconnue' }

export const FLECHES: Record<Tendance, string> = { hausse: '↑', baisse: '↓', stable: '→' }
export const LIBELLES_TENDANCE: Record<Tendance, string> = { hausse: 'en hausse', baisse: 'en baisse', stable: 'stable' }

/** « ↑ en hausse » ; null → « tendance inconnue » */
export const tendanceFr = (t: Tendance | null) => (t === null ? 'tendance inconnue' : `${FLECHES[t]} ${LIBELLES_TENDANCE[t]}`)

/** Écart en points : 8 → « +8 pts vs normale » */
export const pointsFr = (n: number | null) => (n === null ? 'normale indisponible' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} pts vs normale`)

/** Écart en % : -40 → « −40 % vs normale » */
export const ecartPourcentFr = (n: number | null) => (n === null ? 'normale indisponible' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} % vs normale`)

/** « 2026-11-12 » → « 12/11 » */
export const jourMois = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** « 2026-10-28 » → « 28 oct. » */
export const jourCourt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Nombre de jours entre la dernière donnée NASA et aujourd'hui. */
export function joursDeRetard(dernierJour: string, aujourdhui = new Date()): number {
  const d = Date.UTC(Number(dernierJour.slice(0, 4)), Number(dernierJour.slice(5, 7)) - 1, Number(dernierJour.slice(8, 10)))
  const a = Date.UTC(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate())
  return Math.round((a - d) / 86_400_000)
}

/** Titre de la carte d'action, d'après la règle retenue par le serveur. */
export const TITRES_ACTION: Record<CodeAction, string> = {
  // Le titre dit QUOI faire ; la phrase en dessous dit POURQUOI
  semer: 'Vous pouvez planter',
  engorge: 'Attendez avant de planter',
  surface_seche: 'Attendez la pluie pour planter',
  sol_sec: 'Attendez la pluie pour planter',
  saison: 'Attendez le retour des pluies',
  incertain: 'Prudence avant de planter',
  indisponible: 'Pas de conseil pour le moment',
}

/** Ton de couleur de la carte d'action (mêmes couleurs que les verdicts). */
export const TON_ACTION: Record<CodeAction, Verdict | null> = {
  semer: 'favorable',
  engorge: 'risquée',
  incertain: 'risquée',
  surface_seche: 'défavorable',
  sol_sec: 'défavorable',
  saison: 'défavorable',
  indisponible: null,
}

// ── Couleur d'une couche selon l'humidité : échelle séquentielle sec → saturé ──
// Terre Latérite → ocre → sable humide → bleu clair → Bleu Océan, interpolée en OKLCH (clarté, intensité, teinte) :
// l'intensité reste franche entre le sable et le bleu (pas de gris au milieu).
const PALIERS = ['#B4532A', '#C98B5E', '#D6BE8A', '#6FA0D8', '#3A75C4']

type Lab = [number, number, number]

const versLineaire = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const versSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexVersOklab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) => versLineaire(parseInt(hex.slice(i, i + 2), 16) / 255)) as Lab
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabVersHex([L, a, b]: Lab): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return `#${rgb.map((c) => Math.round(Math.min(1, Math.max(0, versSrgb(c))) * 255).toString(16).padStart(2, '0')).join('')}`
}

const PALIERS_LAB = PALIERS.map(hexVersOklab)

/** OKLab → OKLCH (clarté, intensité, teinte en radians) */
const versLch = ([L, a, b]: Lab): Lab => [L, Math.hypot(a, b), Math.atan2(b, a)]
const PALIERS_LCH = PALIERS_LAB.map(versLch)

/** Couleur de remplissage pour un indice 0–1 ; null → gris neutre. */
export function couleurHumidite(indice: number | null): string {
  if (indice === null) return '#D2C9B1'
  const x = Math.min(1, Math.max(0, indice)) * (PALIERS.length - 1)
  const i = Math.min(PALIERS.length - 2, Math.floor(x))
  const t = x - i
  const a = PALIERS_LCH[i]
  const b = PALIERS_LCH[i + 1]
  if (!a || !b) return PALIERS[0] ?? '#B4532A'
  // Teinte : par le plus court chemin sur le cercle
  let dh = b[2] - a[2]
  if (dh > Math.PI) dh -= 2 * Math.PI
  if (dh < -Math.PI) dh += 2 * Math.PI
  const L = a[0] + (b[0] - a[0]) * t
  const C = a[1] + (b[1] - a[1]) * t
  const h = a[2] + dh * t
  return oklabVersHex([L, C * Math.cos(h), C * Math.sin(h)])
}

/** Texte lisible sur une couleur de fond : Noir Ébène sur fond clair, blanc sur fond foncé (luminance relative). */
export function texteSur(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => versLineaire(parseInt(hex.slice(i, i + 2), 16) / 255))
  const lum = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
  // Contraste avec le blanc (1,05 / (lum + 0,05)) contre le noir ébène (~(lum + 0,05) / 0,0125)
  return (lum + 0.05) / 0.0625 > 1.05 / (lum + 0.05) ? '#111A14' : '#FFFFFF'
}

/** Même teinte, plus sombre ou plus claire (facteur sur la clarté OKLab : 0,85 = 15 % plus sombre). Faces du bloc 3D. */
export function nuancer(hex: string, facteur: number): string {
  const [L, a, b] = hexVersOklab(hex)
  return oklabVersHex([Math.min(1, L * facteur), a, b])
}

// ── Phrases simples pour les 3 chiffres clés (les écarts viennent du serveur ; on ne fait que les dire avec des mots) ──

/** Pluie comparée à d'habitude, d'après l'écart en % (mêmes seuils que lectureEcart côté serveur : ±30 %). */
export function comparaisonPluie(ecart: number | null): string {
  if (ecart === null) return 'Pas de comparaison possible.'
  if (ecart < -30) return 'Beaucoup moins que d\'habitude.'
  if (ecart < -10) return 'Un peu moins que d\'habitude.'
  if (ecart <= 10) return 'Comme d\'habitude.'
  if (ecart <= 30) return 'Un peu plus que d\'habitude.'
  return 'Beaucoup plus que d\'habitude.'
}

/** Eau dans la terre comparée à d'habitude, d'après l'écart en points de %. */
export function comparaisonEau(points: number | null): string {
  if (points === null) return 'Pas de comparaison possible.'
  if (Math.abs(points) < 5) return 'Comme d\'habitude.'
  const sens = points > 0 ? 'plus' : 'moins'
  return Math.abs(points) <= 15 ? `Un peu ${sens} d'eau que d'habitude.` : `Beaucoup ${sens} d'eau que d'habitude.`
}

/** Chaleur de la terre comparée à d'habitude (moins de 1 °C d'écart : comme d'habitude). */
export function comparaisonChaleur(actuelle: number | null, normale: number | null): string {
  if (actuelle === null || normale === null) return 'Pas de comparaison possible.'
  const d = actuelle - normale
  if (Math.abs(d) < 1) return 'Comme d\'habitude.'
  return d > 0 ? 'Plus chaude que d\'habitude.' : 'Plus fraîche que d\'habitude.'
}

/** Ce que fait l'eau dans la terre depuis une semaine. */
export const TENDANCE_EAU: Record<Tendance, string> = { hausse: 'La terre se mouille.', baisse: 'La terre sèche.', stable: 'Ça ne bouge pas.' }
/** Ce que fait la chaleur de la terre depuis une semaine. */
export const TENDANCE_CHALEUR: Record<Tendance, string> = { hausse: 'Elle monte.', baisse: 'Elle baisse.', stable: 'Elle ne bouge pas.' }

/** 93.1 → « 93 mm » (arrondi : plus facile à lire) */
export const millimetresArrondis = (n: number | null) => (n === null ? '—' : `${Math.round(n)} mm`)
/** 24.55 → « 25 °C » */
export const degresArrondis = (t: number | null) => (t === null ? '—' : `${Math.round(t)} °C`)
