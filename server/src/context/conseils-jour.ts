// Conseils du jour pour le producteur : fonctions PURES (aucun appel réseau, testables).
// Entrées : l'état du sol NASA (passé récent) + les prévisions à 7 jours (Open-Meteo) + la culture.
// Sorties : l'état de la terre en mots simples, la prochaine pluie, les alertes (chaleur, forte pluie,
// sécheresse, terre gorgée d'eau, pluie utile) avec 2 à 3 gestes chacune, et un plan de la semaine dans l'ordre.
// Règle d'or : le code calcule, le modèle explique. Seuils et gestes [À VALIDER] par un agronome.
// Aucune dose de produit, aucune promesse de récolte.
import type { AlerteMeteo, CodeAction, ConseilsJour, Culture, EtapePlan, EtatSol, EtatTerreSimple, PrevisionJour } from '../types/api.js'

// ── Seuils [À VALIDER] ──
export const SEUIL_CHALEUR = 33 // °C : jour chaud (au Gabon, les maximales habituelles tournent autour de 28 à 31 °C)
export const SEUIL_CHALEUR_FORTE = 35 // °C
export const SEUIL_PLUIE_FORTE = 30 // mm en un jour
export const SEUIL_PLUIE_TRES_FORTE = 50 // mm en un jour
export const SEUIL_PLUIE_3J_FORTE = 60 // mm en 3 jours
export const SEUIL_PLUIE_UTILE = 20 // mm en 3 jours : assez pour planter (règle du démarrage de saison)
export const JOURS_SECS_ALERTE = 5 // jours de suite sans pluie (< 1 mm)
export const PROBA_PLUIE_MIN = 50 // % : en dessous, on n'annonce pas la pluie

// ── Mots selon la culture ──
const MOTS: Record<Culture, { plants: string; jeunes: string; nom: string }> = {
  manioc: { plants: 'boutures', jeunes: 'jeunes plants de manioc', nom: 'manioc' },
  plantain: { plants: 'rejets', jeunes: 'jeunes bananiers', nom: 'banane plantain' },
}

// ── Dates en français simple ──
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const versDate = (iso: string) => new Date(`${iso}T12:00:00Z`)
const ecartJours = (a: string, b: string) => Math.round((versDate(b).getTime() - versDate(a).getTime()) / 86_400_000)

/** « aujourd'hui », « demain » ou « jeudi 19 nov. » */
export function jourFr(iso: string, aujourdhui: string): string {
  const e = ecartJours(aujourdhui, iso)
  if (e === 0) return 'aujourd\'hui'
  if (e === 1) return 'demain'
  const d = versDate(iso)
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`
}

/** Une période : « demain », « de demain à mardi 17 nov. » ou « du jeudi 19 nov. au samedi 21 nov. » */
export function periodeFr(debut: string, fin: string, aujourdhui: string): string {
  if (debut === fin) return jourFr(debut, aujourdhui)
  const d = jourFr(debut, aujourdhui)
  const f = jourFr(fin, aujourdhui)
  if (d === 'aujourd\'hui') return `d'aujourd'hui à ${f}`
  if (d === 'demain') return `de demain à ${f}`
  return `du ${d} au ${f}`
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Suites de jours consécutifs qui vérifient une condition. */
function suites(jours: PrevisionJour[], condition: (j: PrevisionJour) => boolean): PrevisionJour[][] {
  const resultat: PrevisionJour[][] = []
  let courante: PrevisionJour[] = []
  for (const j of jours) {
    if (condition(j)) courante.push(j)
    else {
      if (courante.length) resultat.push(courante)
      courante = []
    }
  }
  if (courante.length) resultat.push(courante)
  return resultat
}

// ── 1. L'état de la terre, en mots simples ──

export function etatTerreSimple(e: EtatSol, culture: Culture): EtatTerreSimple {
  const racines = e.couches.find((c) => c.nom === 'racines')
  const m = MOTS[culture]
  if (!racines || racines.indice === null) {
    return { ton: 'inconnu', titre: 'État de la terre inconnu', phrase: 'Les chiffres de la NASA ne sont pas encore arrivés pour votre zone.' }
  }
  const pct = Math.round(racines.indice * 100)
  const ecart = racines.normale === null ? null : Math.round((racines.indice - racines.normale) * 100)
  const habitude = ecart === null || Math.abs(ecart) < 5 ? 'comme d\'habitude à cette période' : ecart > 0 ? 'plus que d\'habitude' : 'moins que d\'habitude'
  const pluie = e.pluie7 === null ? '' : ` Il est tombé ${Math.round(e.pluie7)} mm de pluie ces 7 derniers jours.`
  const t = e.tempSurface
  const chaleur =
    t.actuelle === null
      ? ''
      : ` Le dessus de la terre est à ${Math.round(t.actuelle)} °C${
          t.normale === null || Math.abs(t.actuelle - t.normale) < 1 ? ', une chaleur normale' : t.actuelle > t.normale ? ', plus chaud que d\'habitude' : ', plus frais que d\'habitude'
        }.`
  const base = `Autour des racines, il y a ${pct} % d'eau, ${habitude}.${pluie}${chaleur}`

  if (racines.etat === 'humide') {
    return {
      ton: 'mouillee',
      titre: racines.indice >= 0.8 ? 'Votre terre est gorgée d\'eau' : 'Votre terre est très humide',
      phrase: `${base} Trop d'eau fait pourrir les ${m.plants} : attendez qu'elle sèche un peu.`,
    }
  }
  if (racines.etat === 'sec') {
    return { ton: 'seche', titre: 'Votre terre a soif', phrase: `${base} Les ${m.plants} auraient du mal à prendre racine.` }
  }
  return { ton: 'bonne', titre: 'Votre terre est bien humide', phrase: `${base} C'est une bonne terre pour vos ${m.plants}.` }
}

// ── 2. La prochaine pluie ──

export function prochainePluie(jours: PrevisionJour[] | null, aujourdhui: string): string {
  if (!jours) return 'Prévisions de pluie indisponibles pour le moment.'
  const j = jours.find((x) => (x.pluie ?? 0) >= 1 && (x.probaPluie ?? 100) >= PROBA_PLUIE_MIN)
  if (!j || j.pluie === null) return 'Pas de pluie prévue dans les 7 prochains jours.'
  const proba = j.probaPluie === null ? '' : ` (${j.probaPluie} % de chances)`
  return `Prochaine pluie : ${jourFr(j.date, aujourdhui)}, environ ${Math.round(j.pluie)} mm${proba}.`
}

// ── 3. Les alertes ──

type AlerteDatee = AlerteMeteo & { debut: string }

const GESTES = {
  chaleur: (c: Culture): string[] => [
    `Couvrez le pied des ${MOTS[c].jeunes} avec des herbes sèches ou des feuilles (paillage) : la terre garde son eau.`,
    'Ne plantez pas pendant ces jours chauds.',
    c === 'plantain' ? 'Si vous le pouvez, arrosez les jeunes rejets le soir.' : 'Si vous devez planter, faites-le tôt le matin ou en fin de journée.',
  ],
  forte_pluie: (c: Culture): string[] => [
    'Dégagez les rigoles avant la pluie pour que l\'eau sorte du champ.',
    `Ne plantez pas la veille : les ${MOTS[c].plants} pourraient être emportés.`,
    c === 'plantain' ? 'Vérifiez que les jeunes bananiers sont bien tenus contre le vent.' : 'Après la pluie, vérifiez que la terre n\'a pas découvert les boutures.',
  ],
  secheresse: (c: Culture): string[] => [
    'Paillez la terre pour garder l\'humidité.',
    `Gardez vos ${MOTS[c].plants} à l'ombre et attendez la pluie pour planter.`,
    'Profitez de ces jours secs pour désherber et préparer le terrain.',
  ],
  engorgement: (c: Culture): string[] => [
    'Creusez de petites rigoles pour que l\'eau ne reste pas dans le champ.',
    c === 'manioc' ? 'Quand vous planterez, faites des buttes : le manioc n\'aime pas l\'eau qui stagne.' : 'Ne plantez pas de rejets dans les creux où l\'eau stagne.',
    'Ne retournez pas la terre tant qu\'elle colle aux pieds.',
  ],
  pluie_utile: (c: Culture): string[] => [
    `Préparez vos ${MOTS[c].plants} et le terrain avant la pluie.`,
    `Plantez juste après la pluie, quand la terre est humide.`,
  ],
}

const RANG: Record<AlerteMeteo['niveau'], number> = { danger: 0, attention: 1, bonne_nouvelle: 2 }

export function alertes(e: EtatSol, jours: PrevisionJour[] | null, culture: Culture, aujourdhui: string): AlerteDatee[] {
  const resultat: AlerteDatee[] = []
  const racines = e.couches.find((c) => c.nom === 'racines')
  const surface = e.couches.find((c) => c.nom === 'surface')

  if (jours && jours.length) {
    // Vague de chaleur : au moins 2 jours de suite à 33 °C ou plus
    for (const s of suites(jours, (j) => (j.tmax ?? 0) >= SEUIL_CHALEUR).filter((x) => x.length >= 2)) {
      const max = Math.max(...s.map((j) => j.tmax ?? 0))
      const debut = s[0]?.date ?? aujourdhui
      const fin = s.at(-1)?.date ?? debut
      resultat.push({
        type: 'chaleur',
        niveau: max >= SEUIL_CHALEUR_FORTE ? 'danger' : 'attention',
        titre: 'Vague de chaleur',
        quand: periodeFr(debut, fin, aujourdhui),
        message: `Jusqu'à ${Math.round(max)} °C prévus pendant ${s.length} jours. La terre va sécher vite et les ${MOTS[culture].jeunes} peuvent souffrir.`,
        gestes: GESTES.chaleur(culture),
        debut,
      })
    }

    // Forte pluie : un jour à 30 mm ou plus, ou 60 mm en 3 jours
    const jourFort = jours.find((j) => (j.pluie ?? 0) >= SEUIL_PLUIE_FORTE)
    const fenetre = jours.findIndex((_, i) => i + 2 < jours.length && jours.slice(i, i + 3).reduce((t, j) => t + (j.pluie ?? 0), 0) >= SEUIL_PLUIE_3J_FORTE)
    if (jourFort && jourFort.pluie !== null) {
      resultat.push({
        type: 'forte_pluie',
        niveau: jourFort.pluie >= SEUIL_PLUIE_TRES_FORTE ? 'danger' : 'attention',
        titre: 'Forte pluie',
        quand: jourFr(jourFort.date, aujourdhui),
        message: `Environ ${Math.round(jourFort.pluie)} mm prévus en un jour. L'eau peut raviner la terre et noyer les jeunes plants.`,
        gestes: GESTES.forte_pluie(culture),
        debut: jourFort.date,
      })
    } else if (fenetre >= 0) {
      const t = jours.slice(fenetre, fenetre + 3)
      const total = t.reduce((s, j) => s + (j.pluie ?? 0), 0)
      const debut = t[0]?.date ?? aujourdhui
      resultat.push({
        type: 'forte_pluie',
        niveau: 'attention',
        titre: 'Beaucoup de pluie',
        quand: periodeFr(debut, t.at(-1)?.date ?? debut, aujourdhui),
        message: `Environ ${Math.round(total)} mm prévus en 3 jours.`,
        gestes: GESTES.forte_pluie(culture),
        debut,
      })
    }

    // Sécheresse : 5 jours de suite (ou plus) sans pluie
    const sec = suites(jours, (j) => (j.pluie ?? 0) < 1).find((x) => x.length >= JOURS_SECS_ALERTE)
    if (sec) {
      const debut = sec[0]?.date ?? aujourdhui
      resultat.push({
        type: 'secheresse',
        niveau: racines?.etat === 'sec' ? 'danger' : 'attention',
        titre: 'Jours sans pluie',
        quand: periodeFr(debut, sec.at(-1)?.date ?? debut, aujourdhui),
        message: `Pas de pluie prévue pendant ${sec.length} jours. La terre va sécher.`,
        gestes: GESTES.secheresse(culture),
        debut,
      })
    }

    // Terre gorgée d'eau : déjà très humide, et encore 20 mm ou plus prévus dans les 3 jours
    const pluie3 = jours.slice(0, 3).reduce((s, j) => s + (j.pluie ?? 0), 0)
    if (racines?.etat === 'humide' && pluie3 >= SEUIL_PLUIE_UTILE) {
      resultat.push({
        type: 'engorgement',
        niveau: 'attention',
        titre: 'Terre gorgée d\'eau',
        quand: 'ces 3 prochains jours',
        message: `La terre est déjà pleine d'eau et il va encore tomber environ ${Math.round(pluie3)} mm. L'eau risque de stagner.`,
        gestes: GESTES.engorgement(culture),
        debut: jours[0]?.date ?? aujourdhui,
      })
    }

    // Pluie utile : la terre a soif et 20 mm arrivent en 3 jours
    const aSoif = racines?.etat === 'sec' || surface?.etat === 'sec' || e.codeAction === 'saison'
    const utile = jours.findIndex((_, i) => i + 2 < jours.length && jours.slice(i, i + 3).reduce((s, j) => s + (j.pluie ?? 0), 0) >= SEUIL_PLUIE_UTILE)
    if (aSoif && utile >= 0) {
      const premier = jours.slice(utile).find((j) => (j.pluie ?? 0) >= 1) ?? jours[utile]
      if (premier) {
        resultat.push({
          type: 'pluie_utile',
          niveau: 'bonne_nouvelle',
          titre: 'La pluie arrive',
          quand: jourFr(premier.date, aujourdhui),
          message: `Assez de pluie est prévue pour mouiller la terre. Ce sera le bon moment pour planter vos ${MOTS[culture].plants}.`,
          gestes: GESTES.pluie_utile(culture),
          debut: premier.date,
        })
      }
    }
  } else if (racines?.etat === 'humide' && (e.pluie7 ?? 0) >= 50) {
    // Sans prévisions : on s'appuie seulement sur la NASA (passé récent)
    resultat.push({
      type: 'engorgement',
      niveau: 'attention',
      titre: 'Terre gorgée d\'eau',
      quand: 'en ce moment',
      message: `Il est tombé ${Math.round(e.pluie7 ?? 0)} mm cette semaine : la terre est pleine d'eau.`,
      gestes: GESTES.engorgement(culture),
      debut: aujourdhui,
    })
  } else if (racines?.etat === 'sec' && racines.tendance7j === 'baisse') {
    resultat.push({
      type: 'secheresse',
      niveau: 'attention',
      titre: 'La terre sèche',
      quand: 'en ce moment',
      message: 'La terre perd son eau depuis une semaine.',
      gestes: GESTES.secheresse(culture),
      debut: aujourdhui,
    })
  }

  return resultat.sort((a, b) => RANG[a.niveau] - RANG[b.niveau] || a.debut.localeCompare(b.debut))
}

// ── 4. Le plan de la semaine ──

/** Le premier geste, d'après la règle retenue pour la semaine (codeAction). */
export function gesteDuJour(code: CodeAction, culture: Culture): string {
  const m = MOTS[culture]
  switch (code) {
    case 'semer':
      return culture === 'manioc' ? 'Préparez des boutures saines et plantez-les cette semaine.' : 'Plantez vos rejets cette semaine, dans des trous déjà préparés.'
    case 'engorge':
      return 'Ne plantez pas cette semaine : la terre est trop mouillée.'
    case 'surface_seche':
    case 'sol_sec':
      return `Ne plantez pas encore. Préparez le terrain et gardez vos ${m.plants} à l'ombre.`
    case 'saison':
      return 'Désherbez et préparez le terrain en attendant les pluies.'
    case 'incertain':
      return 'Si vous plantez, commencez par une petite partie du champ.'
    case 'indisponible':
      return 'Revenez un peu plus tard : les chiffres de la NASA ne sont pas encore arrivés.'
  }
}

export function plan(code: CodeAction, liste: AlerteDatee[], culture: Culture): EtapePlan[] {
  const etapes: EtapePlan[] = [{ quand: 'Aujourd\'hui', geste: gesteDuJour(code, culture) }]
  const deja = new Set(etapes.map((e) => e.geste))
  for (const a of [...liste].sort((x, y) => x.debut.localeCompare(y.debut))) {
    const geste = a.gestes.find((g) => !deja.has(g))
    if (!geste) continue
    etapes.push({ quand: majuscule(a.quand), geste })
    deja.add(geste)
    if (etapes.length >= 4) break
  }
  etapes.push({ quand: 'Chaque matin', geste: 'Ouvrez le dashboard : les conseils changent avec la pluie et la chaleur.' })
  return etapes
}

// ── Tout ensemble ──

export function construireConseilsJour(e: EtatSol, jours: PrevisionJour[] | null, culture: Culture, aujourdhui: string, source: string): ConseilsJour {
  const liste = alertes(e, jours, culture, aujourdhui)
  return {
    culture,
    etatTerre: etatTerreSimple(e, culture),
    previsions: jours ? { source, jours } : null,
    prochainePluie: prochainePluie(jours, aujourdhui),
    alertes: liste.map(({ debut: _debut, ...a }) => a),
    plan: plan(e.codeAction, liste, culture),
  }
}
