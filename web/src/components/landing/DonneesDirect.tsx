'use client'
// Cartes vitrées du hero, remplies avec les vraies données du serveur S'STACK :
// verdict de semis du site choisi, pluie des derniers jours (NASA POWER) et nombre de sites suivis.
// Jamais de chiffre inventé : en attendant ou en cas d'erreur, la carte le dit.
import type { ReactNode } from 'react'
import Compteur from './Compteur'
import { getFiche, getSites } from '@/lib/api'
import { ecartFr, lireFiche, nombreFr } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import type { PointPluie, Verdict } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { IcoCible, IcoNuage, IcoPluie, IcoSoleil } from './icones'

const TEXTE_VERDICT: Record<Verdict | 'inconnu', { libelle: string; couleur: string }> = {
  favorable: { libelle: 'Favorable', couleur: 'text-menthe' },
  risquée: { libelle: 'Risquée', couleur: 'text-sun' },
  défavorable: { libelle: 'Défavorable', couleur: 'text-[#F2A889]' },
  inconnu: { libelle: 'Indisponible', couleur: 'text-white/70' },
}

function EnTeteCarte({ icone, titre, droite }: { icone: ReactNode; titre: string; droite?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-feuille text-white">{icone}</span>
      <span className="text-[11px] font-medium tracking-[0.1em] text-white/85 uppercase">{titre}</span>
      {droite && <span className="ml-auto text-[10px] text-white/60">{droite}</span>}
    </div>
  )
}

function Squelette({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-white/15 ${className}`} />
}

function ErreurCompacte({ message, onReessayer }: { message: string; onReessayer: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 py-2">
      <p className="m-0 text-xs leading-relaxed text-white/80">{message}</p>
      <button
        type="button"
        onClick={onReessayer}
        className="min-h-9 cursor-pointer rounded-full border border-white/30 bg-white/10 px-3.5 text-xs font-medium text-white hover:bg-white/20"
      >
        Réessayer
      </button>
    </div>
  )
}

const iconePluie = (mm: number) => (mm < 1 ? <IcoSoleil /> : mm < 8 ? <IcoNuage /> : <IcoPluie />)
const couleurPluie = (mm: number) => (mm < 1 ? 'text-sun' : mm < 8 ? 'text-white' : 'text-[#7FB2F0]')
const jourCourt = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** Carte principale : verdict de semis + pluie des 4 derniers jours connus. */
export function CarteConditions() {
  const [siteId] = useSiteChoisi()
  const fiche = useApi(() => getFiche(siteId), `fiche:${siteId}`)
  const lue = fiche.statut === 'pret' ? lireFiche(fiche.donnees.fiche.donnees) : null
  const derniers: PointPluie[] = fiche.statut === 'pret' ? fiche.donnees.serie.slice(-4).reverse() : []
  const v = TEXTE_VERDICT[lue?.verdict ?? 'inconnu']

  return (
    <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-md">
      {/* Verdict de semis */}
      <EnTeteCarte icone={<IcoCible taille={16} />} titre="Verdict de semis" />
      <div aria-live="polite" className="mt-5">
        {fiche.statut === 'chargement' && (
          <div className="flex flex-col gap-2.5" role="status">
            <span className="sr-only">Chargement des données NASA…</span>
            <Squelette className="h-3.5 w-24" />
            <Squelette className="h-7 w-36" />
            <Squelette className="h-3 w-48" />
          </div>
        )}
        {fiche.statut === 'erreur' && <ErreurCompacte message={fiche.message} onReessayer={fiche.recharger} />}
        {fiche.statut === 'pret' && lue && (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[13px] text-white/75">{fiche.donnees.site.nom}</span>
                <span className={`font-display text-[26px] leading-none font-semibold ${v.couleur}`}>{v.libelle}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] text-white/70">Pluie 30 j</span>
                <span className={`font-mono text-sm font-bold ${lue.ecart30 !== null && lue.ecart30 < 0 ? 'text-sun' : 'text-menthe'}`}>
                  {ecartFr(lue.ecart30)}
                </span>
              </div>
            </div>
            <p className="m-0 mt-3 line-clamp-2 text-[11px] leading-relaxed text-white/65">
              {lue.raison ? `${lue.raison.charAt(0).toUpperCase()}${lue.raison.slice(1)}.` : 'Évaluation indisponible : données NASA manquantes.'}
            </p>
          </>
        )}
      </div>

      <hr className="my-5 border-0 border-t border-white/12" />

      {/* Pluie des derniers jours */}
      <EnTeteCarte icone={<IcoNuage taille={16} />} titre="Pluie observée" droite="NASA POWER" />
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {fiche.statut === 'chargement' &&
          [0, 1, 2, 3].map((i) => <Squelette key={i} className="h-[74px] rounded-xl" />)}
        {fiche.statut === 'erreur' && <p className="col-span-4 m-0 text-xs text-white/60">Pluie indisponible pour le moment.</p>}
        {fiche.statut === 'pret' && derniers.length === 0 && (
          <p className="col-span-4 m-0 text-xs text-white/60">Pas encore de données de pluie pour ce site.</p>
        )}
        {derniers.map((p, i) => (
          <div key={p.date} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/60">{i === 0 ? 'Dernier jour' : jourCourt(p.date)}</span>
            <div className={`flex w-full flex-col items-center gap-1.5 rounded-xl py-2.5 ${i === 0 ? 'bg-white/15' : ''}`}>
              <span className={couleurPluie(p.pluie)}>{iconePluie(p.pluie)}</span>
              <span className="font-mono text-[12px] font-bold text-white">
                {nombreFr(p.pluie)}
                <span className="ml-0.5 text-[9px] font-normal text-white/70">mm</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Nombre de sites suivis, lu sur le serveur (« — » tant qu'il n'est pas connu). */
export function NombreSites() {
  const sites = useApi(getSites, 'sites')
  return sites.statut === 'pret' ? <Compteur valeur={sites.donnees.length} /> : <>—</>
}
