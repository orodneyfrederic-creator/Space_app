// Tests des fonctions pures de l'état du sol, avec des séries fabriquées à la main (aucun appel réseau).
// Lancer : npx tsx src/scripts/tester-indicateurs.ts
import assert from 'node:assert/strict'
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
test('données manquantes', () => assert.match(actionRecommandee({ ...base, verdict: null }), /indisponibles/))
test('racines inconnues', () => assert.match(actionRecommandee({ ...base, racines: 'inconnu' }), /indisponibles/))
test('sol gorgé d\'eau', () =>
  assert.match(actionRecommandee({ ...base, racines: 'humide', tendanceRacines: 'hausse', pluie7: 80 }), /gorgé d'eau/))
test('humide mais pluie modérée → pas gorgé', () =>
  assert.match(actionRecommandee({ ...base, racines: 'humide', tendanceRacines: 'hausse', pluie7: 30 }), /Conditions réunies/))
test('surface sèche sans pluie', () => assert.match(actionRecommandee({ ...base, surface: 'sec', pluie7: 4 }), /Sol sec en surface/))
test('bon moment', () => assert.match(actionRecommandee(base), /Conditions réunies/))
test('saison pas démarrée', () =>
  assert.match(actionRecommandee({ ...base, verdict: 'défavorable', saisonDemarree: false }), /pas encore démarré/))
test('racines sèches', () => assert.match(actionRecommandee({ ...base, verdict: 'défavorable', racines: 'sec' }), /trop sec/))
test('conditions incertaines', () => assert.match(actionRecommandee({ ...base, verdict: 'risquée' }), /incertaines/))

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
  assert.match(e.action, /Conditions réunies/)
  assert.equal(e.lieuProche?.site.id, 'tchibanga')
})
test('aucune donnée publiée', () => {
  const vides = jours.map((j) => ({ ...j, solRacines: null }))
  const e = construireEtatSol(-2.85, 11.02, vides, climato, new Date(Date.UTC(2026, 10, 12)))
  assert.equal(e.verdict, null)
  assert.equal(e.serie.length, 0)
  assert.match(e.action, /indisponibles/)
})

console.log(`\n${reussis} tests réussis.`)
