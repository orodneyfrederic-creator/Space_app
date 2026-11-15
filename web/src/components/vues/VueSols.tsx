'use client'
// Intelligence des sols (/soil) : bilan croisé, analyses (saisie + comparaison), humidité NASA, amendements.
// Le pH et les nutriments viennent UNIQUEMENT des analyses saisies ; SoilGrids est affiché comme une estimation.
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getFiche, getHumiditeSol, getSites, listerAmendements, listerAnalysesSol } from '@/lib/api'
import { lireFiche, nombreFr } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import { bilanSol, questionPourAgent, type Constat } from '@/lib/sols'
import type { Site } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import SelecteurSite from '../SelecteurSite'
import { FormAmendement, ListeAmendements } from '../sols/Amendements'
import FormAnalyse from '../sols/FormAnalyse'
import GraphiqueHumidite from '../sols/GraphiqueHumidite'
import TableauAnalyses from '../sols/TableauAnalyses'
import { Chargement, EnTetePage, Erreur, EtiquetteNasa, Panneau } from '../ui/elements'

const ONGLETS = [
  { id: 'bilan', libelle: 'Bilan' },
  { id: 'analyses', libelle: 'Analyses' },
  { id: 'humidite', libelle: 'Humidité' },
  { id: 'amendements', libelle: 'Amendements' },
] as const
type Onglet = (typeof ONGLETS)[number]['id']

const STYLE_CONSTAT: Record<Constat['niveau'], { classe: string; marque: string; libelle: string }> = {
  manque: { classe: 'border-warn-line bg-warn-bg text-warn-ink', marque: '?', libelle: 'Donnée manquante' },
  attention: { classe: 'border-risk-bg bg-risk-bg/50 text-risk', marque: '!', libelle: 'À surveiller' },
  info: { classe: 'border-line-soft bg-paper text-ink', marque: 'i', libelle: 'Information' },
}

function ContenuSols({ site }: { site: Site }) {
  // L'onglet suit l'adresse (?onglet=…) : les liens du menu ouvrent la bonne rubrique, même depuis /soil
  const ongletDemande = useSearchParams().get('onglet')
  const onglet: Onglet = ONGLETS.find((o) => o.id === ongletDemande)?.id ?? 'bilan'
  const router = useRouter()
  const chemin = usePathname()
  const setOnglet = (o: Onglet) => router.replace(o === 'bilan' ? chemin : `${chemin}?onglet=${o}`, { scroll: false })
  const fiche = useApi(() => getFiche(site.id), `fiche:${site.id}`)
  const humidite = useApi(() => getHumiditeSol(site.id), `humidite:${site.id}`)
  const analyses = useApi(() => listerAnalysesSol(site.id), `analyses-sol:${site.id}`)
  const amendements = useApi(() => listerAmendements(site.id), `amendements:${site.id}`)

  const ficheLue = fiche.statut === 'pret' ? lireFiche(fiche.donnees.fiche.donnees) : null
  const pret = analyses.statut !== 'chargement' && amendements.statut !== 'chargement' && humidite.statut !== 'chargement' && fiche.statut !== 'chargement'
  const listeAnalyses = analyses.statut === 'pret' ? analyses.donnees : null
  const listeAmendements = amendements.statut === 'pret' ? amendements.donnees : null
  const constats = pret
    ? bilanSol({ analyses: listeAnalyses, amendements: listeAmendements, fiche: ficheLue, humidite: humidite.statut === 'pret' ? humidite.donnees : null })
    : []
  const question = questionPourAgent(listeAnalyses?.[0], listeAmendements ?? [])

  return (
    <>
      <div role="tablist" aria-label="Rubriques du sol" className="mb-5 grid grid-cols-2 gap-1.5 rounded-[14px] bg-segmented p-1 sm:max-w-xl sm:grid-cols-4">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            onClick={() => setOnglet(o.id)}
            className={`min-h-11 cursor-pointer rounded-[10px] border-none font-sans text-sm font-semibold ${
              onglet === o.id ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'bg-transparent text-muted'
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      {onglet === 'bilan' && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panneau titre={`Bilan du sol · ${site.nom}`} className="min-w-0">
            {!pret && <Chargement texte="Croisement des analyses et des données NASA…" />}
            {pret && (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {constats.map((c) => {
                  const s = STYLE_CONSTAT[c.niveau]
                  return (
                    <li key={c.texte} className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${s.classe}`}>
                      <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/70 font-mono text-xs font-bold">
                        {s.marque}
                      </span>
                      <span>
                        <span className="sr-only">{s.libelle} : </span>
                        {c.texte}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link
              href={`/assistant?question=${encodeURIComponent(question)}`}
              className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-[15px] font-semibold text-white no-underline hover:bg-accent-hover sm:self-start"
            >
              Demander conseil à l&apos;assistant
            </Link>
            <p className="m-0 text-xs text-muted">
              L&apos;assistant reçoit uniquement vos valeurs mesurées et la liste de ce qui manque. Il ne déduit jamais la chimie du sol d&apos;une image satellite.
            </p>
          </Panneau>

          <div className="flex min-w-0 flex-col gap-5">
            <Panneau titre="Dernière analyse">
              {analyses.statut === 'chargement' && <Chargement texte="Lecture du carnet de sol…" hauteur="h-24" />}
              {analyses.statut === 'erreur' && <Erreur message={analyses.message} onReessayer={analyses.recharger} />}
              {listeAnalyses && listeAnalyses.length === 0 && <p className="m-0 text-sm text-muted">Aucune analyse pour ce site.</p>}
              {listeAnalyses?.[0] && <TableauAnalyses analyses={listeAnalyses.slice(0, 1)} />}
              <button type="button" onClick={() => setOnglet('analyses')} className="min-h-11 cursor-pointer self-start rounded-xl border border-line bg-surface px-4 font-sans text-sm font-semibold text-accent">
                Ajouter une analyse
              </button>
            </Panneau>
            <Panneau titre="Estimation SoilGrids" etiquette={<EtiquetteNasa texte="Estimation ~250 m" />}>
              {ficheLue?.sol ? (
                <dl className="m-0 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted">pH</dt><dd className="m-0 font-mono">{nombreFr(ficheLue.sol.ph)}</dd>
                  <dt className="text-muted">Argile</dt><dd className="m-0 font-mono">{nombreFr(ficheLue.sol.argile, 0)} %</dd>
                  <dt className="text-muted">Sable</dt><dd className="m-0 font-mono">{nombreFr(ficheLue.sol.sable, 0)} %</dd>
                  <dt className="text-muted">Carbone</dt><dd className="m-0 font-mono">{nombreFr(ficheLue.sol.carbone)} g/kg</dd>
                </dl>
              ) : (
                <p className="m-0 text-sm text-muted">{fiche.statut === 'chargement' ? 'Chargement…' : 'Estimation indisponible.'}</p>
              )}
              <p className="m-0 text-xs text-muted">Tendance de la zone, pas une mesure de votre parcelle.</p>
            </Panneau>
          </div>
        </div>
      )}

      {onglet === 'analyses' && (
        <div className="flex flex-col gap-5">
          <Panneau titre="Comparer les analyses dans le temps">
            {analyses.statut === 'chargement' && <Chargement texte="Lecture du carnet de sol…" />}
            {analyses.statut === 'erreur' && <Erreur message={analyses.message} onReessayer={analyses.recharger} />}
            {listeAnalyses && <TableauAnalyses analyses={listeAnalyses} />}
          </Panneau>
          <Panneau titre="Nouvelle analyse de sol">
            <FormAnalyse site={site} onCreee={analyses.recharger} />
          </Panneau>
        </div>
      )}

      {onglet === 'humidite' && (
        <Panneau titre="Humidité du sol (zone des racines)" etiquette={<EtiquetteNasa />}>
          {humidite.statut === 'chargement' && <Chargement />}
          {humidite.statut === 'erreur' && <Erreur message={humidite.message} onReessayer={humidite.recharger} />}
          {humidite.statut === 'pret' && (
            <>
              <GraphiqueHumidite points={humidite.donnees.points} />
              <p className="m-0 text-xs text-muted">
                Source : {humidite.donnees.source}. Indice de 0 (sec) à 1 (saturé) ; seuils 0,4 et 0,7 à valider. NASA SMAP (mesure satellite
                plus fine) : à venir.
              </p>
            </>
          )}
        </Panneau>
      )}

      {onglet === 'amendements' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panneau titre="Apports enregistrés" className="min-w-0">
            {amendements.statut === 'chargement' && <Chargement texte="Lecture des amendements…" />}
            {amendements.statut === 'erreur' && <Erreur message={amendements.message} onReessayer={amendements.recharger} />}
            {listeAmendements && <ListeAmendements amendements={listeAmendements} />}
          </Panneau>
          <Panneau titre="Nouvel apport">
            <FormAmendement site={site} onCree={amendements.recharger} />
          </Panneau>
        </div>
      )}
    </>
  )
}

export default function VueSols() {
  const [siteId] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const site = sites.statut === 'pret' ? sites.donnees.find((s) => s.id === siteId) : undefined

  return (
    <>
      <EnTetePage
        titre="Intelligence des sols"
        sousTitre="Vos analyses, l'humidité NASA et vos apports, au même endroit"
        actions={<SelecteurSite />}
      />
      {sites.statut === 'chargement' && <Chargement texte="Chargement des sites…" />}
      {sites.statut === 'erreur' && <Erreur message={sites.message} onReessayer={sites.recharger} />}
      {sites.statut === 'pret' && !site && <Erreur message="Site inconnu : choisissez un site dans la liste." />}
      {/* key : tout se recharge proprement quand on change de site */}
      {site && <ContenuSols key={site.id} site={site} />}
    </>
  )
}
