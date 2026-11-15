// Tests des fonctions pures de l'état du sol, avec des séries fabriquées à la main (aucun appel réseau).
// Lancer : npx tsx src/scripts/tester-indicateurs.ts
import assert from 'node:assert/strict'
import { alertes, construireConseilsJour, jourFr, prochainePluie } from '../context/conseils-jour.js'
import { construireEtatSol } from '../context/etat-sol.js'
import {
  actionRecommandee,
  codeAction,
  niveauAlerte,
  ecartNormaleIndice,
  etatCouche,
  SEUIL_TENDANCE_INDICE,
  SEUIL_TENDANCE_TEMP,
  tendance,
  type EntreeAction,
} from '../context/indicateurs.js'
import { MOIS, type Climatologie, type CodeMois, type Jour } from '../context/nasa-power.js'
import { distanceKm, siteLePlusProche } from '../context/sites.js'
import type { PrevisionJour } from '../types/api.js'

let reussis = 0
function test(nom: string, f: () => void): void {
  f()
  reussis++
  console.log(`  ✓ ${nom}`)
}

console.log('tendance')
const sept = (v: number) => Array<number>(7).fill(v)
test('hausse de l\'humidité', () => assert.equal(tendance([...sept(0.5), ...sept(0.6)], SEUIL_TENDANCE_INDICE), 'hausse'))
test('baisse de l\'humidité', () => assert.equal(tendance([...sept(0.6), ...sept(0.5)], SEUIL_TENDANCE_INDICE), 'baisse'))
test('stable sous 0,03 point', () => assert.equal(tendance([...sept(0.5), ...sept(0.52)], SEUIL_TENDANCE_INDICE), 'stable'))
test('température stable sous 0,5 °C', () => assert.equal(tendance([...sept(25), ...sept(25.4)], SEUIL_TENDANCE_TEMP), 'stable'))
test('température en hausse', () => assert.equal(tendance([...sept(25), ...sept(26)], SEUIL_TENDANCE_TEMP), 'hausse'))
test('valeurs manquantes ignorées', () => assert.equal(tendance([...sept(0.5), null, null, ...sept(0.6)], SEUIL_TENDANCE_INDICE), 'hausse'))
test('trop peu de valeurs → null', () => assert.equal(tendance([0.5, 0.6, 0.7], SEUIL_TENDANCE_INDICE), null))

console.log('etatCouche et ecartNormaleIndice')
test('sec / correct / humide / inconnu', () => {
  assert.equal(etatCouche(0.39), 'sec')
  assert.equal(etatCouche(0.4), 'correct')
  assert.equal(etatCouche(0.7), 'correct')
  assert.equal(etatCouche(0.71), 'humide')
  assert.equal(etatCouche(null), 'inconnu')
})
test('écart en points de pourcentage', () => {
  assert.equal(ecartNormaleIndice(0.62, 0.54), 8)
  assert.equal(ecartNormaleIndice(0.41, 0.6), -19)
  assert.equal(ecartNormaleIndice(null, 0.6), null)
})

console.log('actionRecommandee')
const base: EntreeAction = { verdict: 'favorable', saisonDemarree: true, surface: 'correct', racines: 'correct', tendanceRacines: 'stable', pluie7: 30 }
test('données manquantes', () => assert.equal(codeAction({ ...base, verdict: null }), 'indisponible'))
test('racines inconnues', () => assert.equal(codeAction({ ...base, racines: 'inconnu' }), 'indisponible'))
test('sol gorgé d\'eau', () =>
  assert.equal(codeAction({ ...base, racines: 'humide', tendanceRacines: 'hausse', pluie7: 80 }), 'engorge'))
test('humide mais pluie modérée → pas gorgé', () =>
  assert.equal(codeAction({ ...base, racines: 'humide', tendanceRacines: 'hausse', pluie7: 30 }), 'semer'))
test('surface sèche sans pluie', () => assert.equal(codeAction({ ...base, surface: 'sec', pluie7: 4 }), 'surface_seche'))
test('bon moment', () => assert.match(actionRecommandee(base), /planter vos boutures/))
test('saison pas démarrée', () =>
  assert.equal(codeAction({ ...base, verdict: 'défavorable', saisonDemarree: false }), 'saison'))
test('racines sèches', () => assert.equal(codeAction({ ...base, verdict: 'défavorable', racines: 'sec' }), 'sol_sec'))
test('conditions incertaines', () => assert.equal(codeAction({ ...base, verdict: 'risquée' }), 'incertain'))

test('code d\'action', () => {
  assert.equal(codeAction(base), 'semer')
  assert.equal(codeAction({ ...base, racines: 'humide', tendanceRacines: 'hausse', pluie7: 80 }), 'engorge')
})

console.log('niveauAlerte')
test('sec et en baisse → alerte', () => assert.equal(niveauAlerte('sec', 'baisse', null), 'alerte'))
test('humide et pluie en hausse → alerte', () => assert.equal(niveauAlerte('humide', 'stable', 'hausse'), 'alerte'))
test('sec mais stable → vigilance', () => assert.equal(niveauAlerte('sec', 'stable', null), 'vigilance'))
test('correct → ok', () => assert.equal(niveauAlerte('correct', 'baisse', 'hausse'), 'ok'))

console.log('lieu le plus proche (haversine)')
test('Libreville → Lambaréné ≈ 150 km', () => {
  const d = distanceKm(0.39, 9.45, -0.7, 10.24)
  assert.ok(d > 140 && d < 160, String(d))
})
test('près de Tchibanga', () => {
  const p = siteLePlusProche(-2.88, 11.0)
  assert.equal(p?.site.id, 'tchibanga')
  assert.equal(p?.distanceKm, 4)
})

console.log('construireEtatSol')
const mois = (v: number | null) => Object.fromEntries(MOIS.map((m) => [m, v])) as Record<CodeMois, number | null>
const climato: Climatologie = {
  pluieMmParJour: mois(5) as Record<CodeMois, number>,
  solRacines: mois(0.6) as Record<CodeMois, number>,
  solSurface: mois(0.65),
  solProfond: mois(0.62),
  tempSurface: mois(25),
}
// 40 jours de pluie régulière depuis le 1er octobre, puis 2 jours non publiés (-999 → null)
const jours: Jour[] = Array.from({ length: 42 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10)
  const publie = i < 40
  return {
    date,
    pluie: publie ? 8 : null,
    tmax: publie ? 29 : null,
    tmin: publie ? 21 : null,
    humiditeAir: publie ? 85 : null,
    solSurface: publie ? 0.6 : null,
    solRacines: publie ? 0.5 + i * 0.005 : null,
    solProfond: publie ? 0.55 : null,
    tempSurface: publie ? 26 : null,
  }
})
test('série coupée au dernier jour publié, 3 couches, verdict', () => {
  const e = construireEtatSol(-2.85, 11.02, jours, climato, new Date(Date.UTC(2026, 10, 12)))
  assert.equal(e.dernierJour, '2026-11-09')
  assert.equal(e.serie.length, 30)
  assert.equal(e.serie.at(-1)?.date, '2026-11-09')
  assert.deepEqual(e.couches.map((c) => c.nom), ['surface', 'racines', 'profondeur'])
  assert.equal(e.couches[1]?.tendance7j, 'hausse')
  assert.equal(e.couches[1]?.normale, 0.6)
  assert.equal(e.pluie7, 56)
  assert.equal(e.verdict, 'favorable')
  assert.equal(e.codeAction, 'semer')
  assert.equal(e.lieuProche?.site.id, 'tchibanga')
})
test('aucune donnée publiée', () => {
  const vides = jours.map((j) => ({ ...j, solRacines: null }))
  const e = construireEtatSol(-2.85, 11.02, vides, climato, new Date(Date.UTC(2026, 10, 12)))
  assert.equal(e.verdict, null)
  assert.equal(e.serie.length, 0)
  assert.equal(e.codeAction, 'indisponible')
})

console.log('conseils du jour (prévisions)')
const prev = (pluies: number[], tmax: number[]): PrevisionJour[] =>
  pluies.map((p, i) => ({ date: `2026-11-${String(15 + i).padStart(2, '0')}`, pluie: p, probaPluie: 90, tmax: tmax[i] ?? 30, tmin: 22 }))
const etatTest = construireEtatSol(-2.85, 11.02, jours, climato, new Date(Date.UTC(2026, 10, 12)))
test('dates en français', () => {
  assert.equal(jourFr('2026-11-15', '2026-11-15'), "aujourd'hui")
  assert.equal(jourFr('2026-11-16', '2026-11-15'), 'demain')
  assert.equal(jourFr('2026-11-19', '2026-11-15'), 'jeudi 19 nov.')
})
test('vague de chaleur : 2 jours à 33 °C ou plus', () => {
  const a = alertes(etatTest, prev([0, 5, 5, 5, 5, 5, 5], [30, 34, 36, 31, 30, 30, 30]), 'manioc', '2026-11-15')
  const c = a.find((x) => x.type === 'chaleur')
  assert.equal(c?.niveau, 'danger')
  assert.equal(c?.quand, 'de demain à mardi 17 nov.')
})
test('un seul jour chaud : pas de vague', () => {
  assert.equal(alertes(etatTest, prev([5, 5, 5, 5, 5, 5, 5], [34, 30, 30, 30, 30, 30, 30]), 'manioc', '2026-11-15').some((x) => x.type === 'chaleur'), false)
})
test('forte pluie et jours secs', () => {
  const a = alertes(etatTest, prev([0, 0, 0, 0, 0, 35, 2], [30, 30, 30, 30, 30, 30, 30]), 'plantain', '2026-11-15')
  assert.ok(a.some((x) => x.type === 'forte_pluie'))
  assert.ok(a.some((x) => x.type === 'secheresse'))
})
test('prochaine pluie', () => {
  assert.match(prochainePluie(prev([0, 0, 12, 0, 0, 0, 0], [30, 30, 30, 30, 30, 30, 30]), '2026-11-15'), /mardi 17 nov\., environ 12 mm/)
  assert.match(prochainePluie(null, '2026-11-15'), /indisponibles/)
})
test('sans prévisions : conseils quand même', () => {
  const c = construireConseilsJour(etatTest, null, 'manioc', '2026-11-15', 'test')
  assert.equal(c.previsions, null)
  assert.equal(c.plan[0]?.quand, "Aujourd'hui")
  assert.match(c.etatTerre.titre, /terre/)
})

console.log(`\n${reussis} tests réussis.`)
