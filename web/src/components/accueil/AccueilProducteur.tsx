'use client'
// Accueil du producteur : « Là où je me trouve, dans quel état est mon sol, et que dois-je faire maintenant ? »
// Hiérarchie : 1 décision (CarteAction), la coupe du sol, 3 indicateurs, puis le détail replié (30 jours).
// Ordre sur téléphone : lieu, décision, coupe, indicateurs. Sur ordinateur : la coupe passe à droite.
import Link from 'next/link'
import { comparaisonChaleur, comparaisonEau, comparaisonPluie, degresArrondis, millimetresArrondis, pourcent, TENDANCE_CHALEUR, TENDANCE_EAU } from '@/lib/etat-sol'
import type { EtatSol } from '@/lib/types'
import { nomCourt, useLieuSol, type LieuSol } from '@/lib/use-lieu-sol'
import { NOM_AGENT } from '../agent/questions'
import BoutonVisite from '../aide/BoutonVisite'
import { Infobulle } from '../aide/Infobulle'
import BandeauPosition from '../sol/BandeauPosition'
import CarteAction, { SqueletteAction } from '../sol/CarteAction'
import CoupeSol, { SqueletteCoupe } from '../sol/CoupeSol'
import EvolutionSol from '../sol/EvolutionSol'
import { Erreur } from '../ui/elements'
import BandeauTelegram from './BandeauTelegram'
import SelecteurProfilDemo from './SelecteurProfilDemo'

function Indicateur({ libelle, valeur, detail, aide }: { libelle: string; valeur: string; detail: string; aide: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 ring-1 ring-line">
      <span className="flex min-h-6 items-center justify-between gap-1 text-[13px] text-muted-2">
        {libelle}
        {aide}
      </span>
      <span className="font-mono text-[26px] leading-tight font-semibold text-ink">{valeur}</span>
      <span className="text-[13px] text-muted-2">{detail}</span>
    </div>
  )
}

function Indicateurs({ etat }: { etat: EtatSol }) {
  const racines = etat.couches.find((c) => c.nom === 'racines')
  const ecartRacines = racines && racines.indice !== null && racines.normale !== null ? Math.round((racines.indice - racines.normale) * 100) : null
  const t = etat.tempSurface
  return (
    <div data-visite="indicateurs" className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <Indicateur
          libelle="Eau autour des racines"
          valeur={pourcent(racines?.indice ?? null)}
          detail={`${comparaisonEau(ecartRacines)}${racines?.tendance7j ? ` ${TENDANCE_EAU[racines.tendance7j]}` : ''}`}
          aide={<Infobulle sujet="solRacines" />}
        />
        <Indicateur libelle="Pluie de la semaine" valeur={millimetresArrondis(etat.pluie7)} detail={comparaisonPluie(etat.ecartPluie7)} aide={<Infobulle sujet="pluie7" />} />
        <Indicateur
          libelle="Chaleur de la terre"
          valeur={degresArrondis(t.actuelle)}
          detail={`${comparaisonChaleur(t.actuelle, t.normale)}${t.tendance7j ? ` ${TENDANCE_CHALEUR[t.tendance7j]}` : ''}`}
          aide={<Infobulle sujet="tempSurface" />}
        />
      </div>
      <p className="m-0 text-[12px] text-muted">Eau en % : 0 % = terre toute sèche, 100 % = terre pleine d&apos;eau.</p>
    </div>
  )
}

/** Question préremplie pour l'assistant : il explique la phrase d'action, il ne la recalcule pas. */
function questionPourquoi(etat: EtatSol, lieu: LieuSol | null): string {
  const ou =
    lieu?.source === 'ville'
      ? ` à ${nomCourt(lieu.site.nom)}`
      : etat.lieuProche
        ? ` près de ${nomCourt(etat.lieuProche.site.nom)}`
        : ''
  return `Pourquoi ce conseil pour mon champ${ou} : « ${etat.action} » ?`
}

export default function AccueilProducteur() {
  const lieuSol = useLieuSol()
  const { etatSol } = lieuSol
  const etat = etatSol.statut === 'pret' ? etatSol.donnees : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Mon champ</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SelecteurProfilDemo />
          <BoutonVisite className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-sans text-sm font-semibold text-accent hover:border-accent" />
        </div>
      </div>

      <BandeauPosition
        lieu={lieuSol.lieu}
        etatSol={etat}
        localisation={lieuSol.localisation}
        sites={lieuSol.sites}
        localiser={lieuSol.localiser}
        placer={lieuSol.placer}
        choisirVille={lieuSol.choisirVille}
      />

      {lieuSol.erreurSites && <Erreur message={lieuSol.erreurSites} onReessayer={lieuSol.rechargerSites} />}
      {etatSol.statut === 'erreur' && (
        <Erreur message={`${etatSol.message} Vous pouvez aussi placer votre champ sur la carte (« Changer de lieu »).`} onReessayer={etatSol.recharger} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6">
        <div className="lg:col-start-1 lg:row-start-1">{etat ? <CarteAction etat={etat} /> : etatSol.statut === 'chargement' && <SqueletteAction />}</div>
        <div className="lg:col-start-2 lg:row-span-3 lg:row-start-1">{etat ? <CoupeSol etat={etat} /> : etatSol.statut === 'chargement' && <SqueletteCoupe />}</div>
        {etat && (
          <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-2">
            <Indicateurs etat={etat} />
            <Link
              href={`/assistant?question=${encodeURIComponent(questionPourquoi(etat, lieuSol.lieu))}`}
              className="flex min-h-12 items-center justify-center self-start rounded-2xl border border-line bg-surface px-5 text-[15px] font-semibold text-accent no-underline hover:border-accent"
            >
              Demander à {NOM_AGENT} pourquoi
            </Link>
          </div>
        )}
      </div>

      {etat && (
        <details className="group rounded-3xl border border-line bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-display text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
            Voir les 30 derniers jours en graphiques
            <span aria-hidden="true" className="text-muted transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none">
              ⌄
            </span>
          </summary>
          <div className="border-t border-line-soft px-4 py-5 sm:px-5">
            <EvolutionSol etat={etat} />
          </div>
        </details>
      )}

      <BandeauTelegram />
    </div>
  )
}
