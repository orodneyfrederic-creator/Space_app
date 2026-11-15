// Mise en forme de l'état du sol (GET /api/etat-sol). Aucun calcul agronomique ici : les états, tendances
// et la phrase d'action viennent du serveur. On ne fait que formater (français) et choisir des couleurs.
import type { CodeAction, CoucheSol, Tendance, Verdict } from './types'

/** 0,62 → « 62 % » ; null → « — » */
export const pourcent = (indice: number | null) => (indice === null ? '—' : `${Math.round(indice * 100)} %`)

/** 24.55 → « 24,6 °C » */
export const degres = (t: number | null) => (t === null ? '—' : `${(Math.round(t * 10) / 10).toString().replace('.', ',')} °C`)

/** 93.1 → « 93,1 mm » */
export const millimetres = (n: number | null) => (n === null ? '—' : `${(Math.round(n * 10) / 10).toString().replace('.', ',')} mm`)

export const NOMS_COUCHES: Record<CoucheSol['nom'], string> = { surface: 'Surface', racines: 'Racines', profondeur: 'Profondeur' }
export const ETATS_COUCHE: Record<CoucheSol['etat'], string> = { sec: 'sec', correct: 'correct', humide: 'humide', inconnu: 'inconnu' }

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
  semer: 'Bon moment pour bouturer',
  engorge: 'Attendez que le sol ressuie',
  surface_seche: 'Sol trop sec pour bouturer',
  sol_sec: 'Sol trop sec pour bouturer',
  saison: 'Attendez le démarrage des pluies',
  incertain: 'Bouturage risqué en ce moment',
  indisponible: 'Évaluation indisponible',
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

// ── Couleur d'une couche selon l'humidité : échelle séquentielle sec → saturé, interpolée en OKLab ──
// Terre Latérite → ocre → Pierre de Mbigou → bleu clair → Bleu Océan
const PALIERS = ['#B4532A', '#C98B5E', '#E9E2CF', '#7FA6D6', '#3A75C4']

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

/** Couleur de remplissage pour un indice 0–1 ; null → gris neutre. */
export function couleurHumidite(indice: number | null): string {
  if (indice === null) return '#D2C9B1'
  const x = Math.min(1, Math.max(0, indice)) * (PALIERS.length - 1)
  const i = Math.min(PALIERS.length - 2, Math.floor(x))
  const t = x - i
  const a = PALIERS_LAB[i]
  const b = PALIERS_LAB[i + 1]
  if (!a || !b) return PALIERS[0] ?? '#B4532A'
  return oklabVersHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

/** Texte lisible sur une couleur de fond : Noir Ébène sur fond clair, blanc sur fond foncé (luminance relative). */
export function texteSur(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => versLineaire(parseInt(hex.slice(i, i + 2), 16) / 255))
  const lum = 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
  // Contraste avec le blanc (1,05 / (lum + 0,05)) contre le noir ébène (~(lum + 0,05) / 0,0125)
  return (lum + 0.05) / 0.0625 > 1.05 / (lum + 0.05) ? '#111A14' : '#FFFFFF'
}
