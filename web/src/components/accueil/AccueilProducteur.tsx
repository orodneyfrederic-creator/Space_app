'use client'
// Dashboard du producteur : SON champ, SA culture, et ce qu'il doit faire, dans l'ordre.
//  1. Bonjour + culture (manioc ou plantain) + lieu
//  2. La décision de la semaine (CarteAction)
//  3. Les alertes des prochains jours (chaleur, forte pluie, jours secs, terre gorgée d'eau, pluie utile), avec les gestes
//  4. Le plan, étape par étape
//  5. Les 7 prochains jours (prévisions Open-Meteo), l'état de la terre en mots simples, les 3 chiffres, le bloc de sol 3D
// Tout est calculé par le serveur (/api/etat-sol, /api/conseils-jour) ; ici on ne fait que l'afficher.
import Link from 'next/link'
import { getConseilsJour } from '@/lib/api'
import { useCulture } from '@/lib/culture'
import { comparaisonChaleur, comparaisonEau, comparaisonPluie, degresArrondis, millimetresArrondis, pourcent, TENDANCE_CHALEUR, TENDANCE_EAU } from '@/lib/etat-sol'
import { useSession } from '@/lib/session'
import type { Culture, EtatSol } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { nomCourt, useLieuSol, type LieuSol } from '@/lib/use-lieu-sol'
import { NOM_AGENT } from '../agent/questions'
import BoutonVisite from '../aide/BoutonVisite'
import { Infobulle } from '../aide/Infobulle'
import BandeauPosition from '../sol/BandeauPosition'
import CarteAction, { SqueletteAction } from '../sol/CarteAction'
import CoupeSol, { SqueletteCoupe } from '../sol/CoupeSol'
import { Erreur } from '../ui/elements'
import BandeauTelegram from './BandeauTelegram'
import { CarteAlertes, CarteEtatTerre, PlanSemaine, PrevisionsSemaine, SelecteurCulture } from './ConseilsJour'
import SelecteurProfilDemo from './SelecteurProfilDemo'

function Indicateur({ libelle, valeur, detail, aide }: { libelle: string; valeur: string; detail: string; aide: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 ring-1 ring-line">
      <span className="flex min-h-6 items-center justify-between gap-1 text-[13px] text-muted-2">
        {libelle}
        {aide}
      </span>
      <span className="font-mono text-[24px] leading-tight font-semibold text-ink">{valeur}</span>
      <span className="text-[13px] text-muted-2">{detail}</span>
    </div>
  )
}

function Indicateurs({ etat }: { etat: EtatSol }) {
  const racines = etat.couches.find((c) => c.nom === 'racines')
  const ecartRacines = racines && racines.indice !== null && racines.normale !== null ? Math.round((racines.indice - racines.normale) * 100) : null
  const t = etat.tempSurface
  return (
    <div data-visite="indicateurs" className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-3 lg:grid-cols-1">
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
  )
}

/** Question préremplie pour l'assistant : il explique la phrase d'action, il ne la recalcule pas. */
function questionPourquoi(etat: EtatSol, lieu: LieuSol | null, culture: Culture): string {
  const ou = lieu?.source === 'ville' ? ` à ${nomCourt(lieu.site.nom)}` : etat.lieuProche ? ` près de ${nomCourt(etat.lieuProche.site.nom)}` : ''
  return `Pourquoi ce conseil pour mon champ de ${culture === 'manioc' ? 'manioc' : 'banane plantain'}${ou} : « ${etat.action} » ?`
}

/** Prénom pour saluer : le premier mot du nom du compte. */
const prenom = (nom: string | undefined) => (nom ? nom.trim().split(/\s+/)[0] : undefined)

/** Les conseils du jour : chargés pour le lieu et la culture choisis. */
function useConseilsJour(lieu: LieuSol | null, culture: Culture) {
  const cle = lieu ? `conseils:${lieu.lat.toFixed(4)}:${lieu.lon.toFixed(4)}:${culture}` : 'conseils:attente'
  return useApi(() => (lieu ? getConseilsJour(lieu.lat, lieu.lon, culture) : new Promise<never>(() => {})), cle)
}

function Squelette({ hauteur }: { hauteur: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-3xl bg-line-soft ${hauteur}`} />
}

export default function AccueilProducteur() {
  const session = useSession()
  const [culture, choisirCulture] = useCulture()
  const lieuSol = useLieuSol()
  const { etatSol, lieu } = lieuSol
  const etat = etatSol.statut === 'pret' ? etatSol.donnees : null
  const conseils = useConseilsJour(lieu, culture)
  const cj = conseils.statut === 'pret' ? conseils.donnees : null
  const nom = prenom(session?.utilisateur.nom)
  const ouLieu = lieu?.source === 'ville' ? nomCourt(lieu.site.nom) : etat?.lieuProche ? `près de ${nomCourt(etat.lieuProche.site.nom)}` : null

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Bonjour, culture, lieu */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 font-display text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">{nom ? `Bonjour ${nom}` : 'Bonjour'}</h1>
          <p className="m-0 text-[15px] text-muted-2">
            Votre champ de {culture === 'manioc' ? 'manioc' : 'banane plantain'}
            {ouLieu ? ` · ${ouLieu}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelecteurProfilDemo />
          <BoutonVisite className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-sans text-sm font-semibold text-accent hover:border-accent" />
        </div>
      </div>
      <SelecteurCulture culture={culture} choisir={choisirCulture} />

      <BandeauPosition
        lieu={lieu}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-6">
        {/* Colonne de gauche : décider et agir */}
        <div className="flex min-w-0 flex-col gap-4">
          {etat ? <CarteAction etat={etat} /> : etatSol.statut === 'chargement' && <SqueletteAction />}
          {cj ? (
            <>
              <CarteAlertes alertes={cj.alertes} sansPrevisions={cj.previsions === null} />
              <PlanSemaine conseils={cj} />
            </>
          ) : conseils.statut === 'chargement' ? (
            <Squelette hauteur="h-64" />
          ) : (
            conseils.statut === 'erreur' && <Erreur message={conseils.message} onReessayer={conseils.recharger} />
          )}
          {etat && (
            <Link
              href={`/assistant?question=${encodeURIComponent(questionPourquoi(etat, lieu, culture))}`}
              className="flex min-h-12 items-center justify-center self-start rounded-2xl border border-line bg-surface px-5 text-[15px] font-semibold text-accent no-underline hover:border-accent"
            >
              Demander à {NOM_AGENT} pourquoi
            </Link>
          )}
        </div>

        {/* Colonne de droite : prévoir et comprendre */}
        <div className="flex min-w-0 flex-col gap-4">
          {cj ? <PrevisionsSemaine conseils={cj} /> : conseils.statut === 'chargement' && <Squelette hauteur="h-48" />}
          {cj && <CarteEtatTerre etat={cj.etatTerre} />}
          {etat && <Indicateurs etat={etat} />}
          {etat ? <CoupeSol etat={etat} /> : etatSol.statut === 'chargement' && <SqueletteCoupe />}
        </div>
      </div>

      <BandeauTelegram />
    </div>
  )
}
