'use client'
// Bandeau du lieu : où sont prises les données du sol, de quelle date, à quelle échelle.
// « Me localiser » demande le GPS (toujours après un clic). Si c'est refusé ou impossible,
// le panneau « Changer de lieu » s'ouvre : toucher la carte, ou choisir l'une des 8 villes.
import { useState } from 'react'
import { joursDeRetard } from '@/lib/etat-sol'
import { dateFr } from '@/lib/fiche'
import type { EtatSol } from '@/lib/types'
import { nomCourt, type LieuSol } from '@/lib/use-lieu-sol'
import { MESSAGES_LOCALISATION, type EtatLocalisation } from '@/lib/use-position'
import { Infobulle } from '../aide/Infobulle'
import { PinIcon } from '../icons'
import CartePointeur from './CartePointeur'

type Props = {
  lieu: LieuSol | null
  etatSol: EtatSol | null
  localisation: EtatLocalisation
  sites: { id: string; nom: string }[]
  localiser: () => void
  placer: (lat: number, lon: number) => void
  choisirVille: (id: string) => void
}

const ECHECS: EtatLocalisation[] = ['refuse', 'indisponible', 'delai']

/** JJ/MM d'une date ISO complète */
const jourMois = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function libelleLieu(lieu: LieuSol, etatSol: EtatSol | null): string {
  if (lieu.source === 'ville') return lieu.site.nom
  const proche = etatSol?.lieuProche
  const pres = proche ? (proche.distanceKm < 1 ? `À ${nomCourt(proche.site.nom)}` : `Près de ${nomCourt(proche.site.nom)} (${proche.distanceKm} km)`) : 'Votre champ'
  return lieu.source === 'carte' ? `${pres} · point placé sur la carte` : pres
}

export default function BandeauPosition({ lieu, etatSol, localisation, sites, localiser, placer, choisirVille }: Props) {
  // 'auto' : le panneau s'ouvre de lui-même si la localisation échoue
  const [panneau, setPanneau] = useState<'auto' | 'ouvert' | 'ferme'>('auto')
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null)
  const echec = ECHECS.includes(localisation)
  const ouvert = panneau === 'ouvert' || (panneau === 'auto' && echec)

  const demanderGps = () => {
    setPanneau('auto')
    localiser()
  }
  const fermer = () => {
    setPanneau('ferme')
    setPoint(null)
  }

  return (
    <section data-visite="position" aria-label="Lieu des données du sol" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-accent">
            <PinIcon />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="m-0 font-display text-base font-semibold text-ink" aria-live="polite">
              {lieu ? libelleLieu(lieu, etatSol) : 'Lieu en cours de chargement…'}
            </p>
            <p className="m-0 flex flex-wrap items-center gap-x-1 text-[13px] leading-snug text-muted-2">
              {etatSol?.dernierJour ? `Données NASA du ${dateFr(etatSol.dernierJour)}` : 'Données NASA'}
              {' · '}zone d&apos;environ 50 km
              {lieu && lieu.source !== 'ville' && localisation !== 'trouve' && ` · position du ${jourMois(lieu.position.date)}`}
              {lieu?.source === 'gps' && lieu.position.precisionM !== null && ` · précision ${lieu.position.precisionM} m`}
              <Infobulle sujet="maille" />
            </p>
            {etatSol?.dernierJour && joursDeRetard(etatSol.dernierJour) > 5 && (
              <p className="m-0 mt-1 self-start rounded-full bg-warn-bg px-2.5 py-0.5 text-[12px] font-semibold text-warn-ink">
                Données du {jourMois(etatSol.dernierJour + 'T')} : la NASA publie avec quelques jours de retard
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={demanderGps}
            disabled={localisation === 'recherche'}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
          >
            {localisation === 'recherche' ? 'Recherche…' : 'Me localiser'}
          </button>
          <button
            type="button"
            onClick={() => (ouvert ? fermer() : setPanneau('ouvert'))}
            aria-expanded={ouvert}
            aria-controls="choix-lieu"
            className="flex min-h-11 items-center rounded-xl border border-line bg-surface px-4 font-sans text-[15px] font-semibold text-ink hover:border-accent"
          >
            {ouvert ? 'Fermer' : 'Changer de lieu'}
          </button>
        </div>
      </div>

      <p className="m-0 text-[13px] text-muted">Données satellite NASA pour votre zone (environ 50 km autour de vous), pas une mesure de votre champ au mètre près.</p>

      {(localisation === 'recherche' || echec) && (
        <p role={echec ? 'alert' : 'status'} className={`m-0 rounded-xl px-3 py-2 text-sm ${echec ? 'bg-warn-bg text-warn-ink' : 'bg-paper text-muted-2'}`}>
          {MESSAGES_LOCALISATION[localisation as Exclude<EtatLocalisation, 'inactif' | 'trouve'>]}
        </p>
      )}

      {ouvert && (
        <div id="choix-lieu" className="flex flex-col gap-3 border-t border-line-soft pt-3">
          <p className="m-0 text-sm font-semibold text-ink">Touchez la carte à l&apos;endroit de votre champ</p>
          <CartePointeur point={point} onToucher={(lat, lon) => setPoint({ lat, lon })} />
          <button
            type="button"
            disabled={!point}
            onClick={() => {
              if (!point) return
              placer(point.lat, point.lon)
              fermer()
            }}
            className="flex min-h-11 items-center justify-center self-start rounded-xl bg-accent px-4 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {point ? 'Utiliser ce point' : 'Touchez d\'abord la carte'}
          </button>
          <p className="m-0 text-sm font-semibold text-ink">Ou choisissez une ville</p>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
            {sites.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    choisirVille(s.id)
                    fermer()
                  }}
                  aria-pressed={lieu?.source === 'ville' && lieu.site.id === s.id}
                  className="flex min-h-11 w-full items-center rounded-xl border border-line bg-paper px-3 text-left font-sans text-sm font-semibold text-ink hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft"
                >
                  {nomCourt(s.nom)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
