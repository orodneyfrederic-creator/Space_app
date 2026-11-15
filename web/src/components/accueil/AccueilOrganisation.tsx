'use client'
// Accueil de l'organisation (coopérative, décideur local) : « Quelle est la tendance sur l'ensemble des sites ? »
// Synthèse par verdict, carte des sites colorée par verdict, tableau comparatif triable, export CSV (Excel).
import { useState } from 'react'
import { getResumesSites } from '@/lib/api'
import { degres, millimetres, pointsFr, pourcent, TITRES_ACTION } from '@/lib/etat-sol'
import type { ApercuSite, ResumeEtatSol, Verdict } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { nomCourt } from '@/lib/use-lieu-sol'
import BoutonVisite from '../aide/BoutonVisite'
import CarteParcelles, { LegendeCarte } from '../carte/CarteParcelles'
import { BadgeVerdict, Erreur, Panneau } from '../ui/elements'
import { DetailZone } from './AccueilConseiller'
import SelecteurProfilDemo from './SelecteurProfilDemo'

type Colonne = 'site' | 'racines' | 'ecart' | 'pluie30' | 'temp' | 'verdict'
const COLONNES: { id: Colonne; titre: string }[] = [
  { id: 'site', titre: 'Site' },
  { id: 'racines', titre: 'Racines' },
  { id: 'ecart', titre: 'Écart normale' },
  { id: 'pluie30', titre: 'Pluie 30 j' },
  { id: 'temp', titre: 'Temp. surface' },
  { id: 'verdict', titre: 'Verdict' },
]
const RANG_VERDICT: Record<Verdict, number> = { favorable: 0, risquée: 1, défavorable: 2 }

function valeurTri(r: ResumeEtatSol, c: Colonne): number | string {
  switch (c) {
    case 'site':
      return r.site.nom
    case 'racines':
      return r.racines.indice ?? -1
    case 'ecart':
      return r.ecartRacines ?? -999
    case 'pluie30':
      return r.pluie30 ?? -1
    case 'temp':
      return r.tempSurface ?? -999
    case 'verdict':
      return r.verdict === null ? 9 : RANG_VERDICT[r.verdict]
  }
}

/** Nombre au format français pour Excel (virgule décimale), vide si la donnée manque */
const csvNombre = (n: number | null, decimales = 1) => (n === null ? '' : n.toFixed(decimales).replace('.', ','))
const csvTexte = (t: string) => (/[;"\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t)

function exporterCsv(resumes: ResumeEtatSol[]) {
  const entete = ['Site', 'Latitude', 'Longitude', 'Dernier jour NASA', 'Humidité racines (%)', 'Écart à la normale (points)', 'Pluie 7 j (mm)', 'Pluie 30 j (mm)', 'Température de surface (°C)', 'Verdict', 'Action', 'Alerte']
  const lignes = resumes.map((r) =>
    [
      csvTexte(r.site.nom),
      csvNombre(r.site.lat, 2),
      csvNombre(r.site.lon, 2),
      r.dernierJour ?? '',
      r.racines.indice === null ? '' : String(Math.round(r.racines.indice * 100)),
      r.ecartRacines === null ? '' : String(r.ecartRacines),
      csvNombre(r.pluie7),
      csvNombre(r.pluie30),
      csvNombre(r.tempSurface),
      r.verdict ?? 'indisponible',
      csvTexte(r.action),
      r.alerte,
    ].join(';'),
  )
  // BOM UTF-8 : Excel lit correctement les accents ; fin de ligne Windows
  const contenu = '﻿' + [entete.join(';'), ...lignes].join('\r\n')
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `sstack-sites-${new Date().toISOString().slice(0, 10)}.csv`
  lien.click()
  URL.revokeObjectURL(url)
}

export default function AccueilOrganisation() {
  const resumes = useApi(getResumesSites, 'resumes-sites')
  const [tri, setTri] = useState<{ col: Colonne; sens: 1 | -1 }>({ col: 'verdict', sens: 1 })
  const [ouvert, setOuvert] = useState<ResumeEtatSol | null>(null)

  if (ouvert) return <DetailZone nom={ouvert.site.nom} lat={ouvert.site.lat} lon={ouvert.site.lon} onRetour={() => setOuvert(null)} />

  const donnees = resumes.statut === 'pret' ? resumes.donnees : []
  const compte = (v: Verdict) => donnees.filter((r) => r.verdict === v).length
  const tries = [...donnees].sort((a, b) => {
    const x = valeurTri(a, tri.col)
    const y = valeurTri(b, tri.col)
    const d = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y, 'fr') : Number(x) - Number(y)
    return d * tri.sens || a.site.nom.localeCompare(b.site.nom, 'fr')
  })
  // La carte existante attend des ApercuSite : on lui passe le verdict et l'état des racines
  const apercus: ApercuSite[] = donnees.map((r) => ({
    site: r.site,
    verdict: r.verdict,
    raison: r.action,
    pluie30: r.pluie30,
    ecart30: null,
    etatSol: r.racines.etat,
    dernierJour: r.dernierJour,
  }))
  const s = (n: number) => (n > 1 ? 's' : '')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Vue d&apos;ensemble des sites</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SelecteurProfilDemo />
          <BoutonVisite className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-sans text-sm font-semibold text-accent hover:border-accent" />
        </div>
      </div>

      {resumes.statut === 'erreur' && <Erreur message={resumes.message} onReessayer={resumes.recharger} />}
      {resumes.statut === 'chargement' && <div aria-hidden="true" className="h-24 animate-pulse rounded-3xl bg-line-soft" />}

      {resumes.statut === 'pret' && (
        <>
          <section data-visite="synthese" aria-label="Synthèse" className="flex flex-col gap-1 rounded-3xl bg-profond px-5 py-5 text-white">
            <p className="m-0 font-display text-[22px] leading-tight font-semibold tracking-[-0.02em] sm:text-[26px]">
              {compte('favorable')} site{s(compte('favorable'))} favorable{s(compte('favorable'))} · {compte('risquée')} risqué{s(compte('risquée'))} · {compte('défavorable')} défavorable{s(compte('défavorable'))}
            </p>
            <p className="m-0 text-sm text-white/80">
              Fenêtre de semis sur {donnees.length} sites, d&apos;après les données NASA POWER (zones d&apos;environ 50 km).
              {donnees.some((r) => r.verdict === null) && ` ${donnees.filter((r) => r.verdict === null).length} site(s) sans données.`}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 min-[1700px]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <Panneau titre="Carte des sites" etiquette={<LegendeCarte />}>
              <CarteParcelles apercus={apercus} hauteur="h-80" compacte />
            </Panneau>

            <Panneau
              titre="Comparatif"
              etiquette={
                <button
                  type="button"
                  onClick={() => exporterCsv(tries)}
                  className="min-h-11 rounded-xl border border-line bg-surface px-3.5 font-sans text-sm font-semibold text-accent hover:border-accent"
                >
                  Exporter en CSV
                </button>
              }
            >
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {COLONNES.map((c) => {
                        const actif = tri.col === c.id
                        return (
                          <th key={c.id} scope="col" aria-sort={actif ? (tri.sens === 1 ? 'ascending' : 'descending') : 'none'} className="px-1 py-1">
                            <button
                              type="button"
                              onClick={() => setTri((t) => ({ col: c.id, sens: t.col === c.id ? (t.sens === 1 ? -1 : 1) : 1 }))}
                              className={`flex min-h-11 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-sans text-[13px] font-semibold ${actif ? 'text-accent' : 'text-muted-2'}`}
                            >
                              {c.titre}
                              <span aria-hidden="true">{actif ? (tri.sens === 1 ? '▲' : '▼') : '↕'}</span>
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {tries.map((r) => (
                      <tr key={r.site.id} className="border-b border-line-soft">
                        <th scope="row" className="px-1 py-2 font-semibold">
                          <button type="button" onClick={() => setOuvert(r)} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-sm font-semibold text-ink underline-offset-2 hover:text-accent hover:underline">
                            {nomCourt(r.site.nom)}
                          </button>
                        </th>
                        <td className="px-1 py-2 font-mono">{pourcent(r.racines.indice)}</td>
                        <td className="px-1 py-2 font-mono text-[13px]">{r.ecartRacines === null ? '—' : pointsFr(r.ecartRacines).replace(' vs normale', '')}</td>
                        <td className="px-1 py-2 font-mono">{millimetres(r.pluie30)}</td>
                        <td className="px-1 py-2 font-mono">{degres(r.tempSurface)}</td>
                        <td className="px-1 py-2" title={TITRES_ACTION[r.codeAction]}>
                          <BadgeVerdict verdict={r.verdict} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="m-0 text-[12px] text-muted">Source : NASA POWER (GWETROOT, PRECTOTCORR, TS). Cliquez sur un site pour voir son détail.</p>
            </Panneau>
          </div>
        </>
      )}
    </div>
  )
}
