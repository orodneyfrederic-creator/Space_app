'use client'
// Accueil du conseiller : « Quelles zones de mon secteur demandent une visite ? »
// Les 8 sites S'STACK + les points ajoutés (gardés sur l'appareil), triés par urgence (alertes d'abord).
// Le niveau d'alerte est calculé par le serveur (niveauAlerte). Un clic ouvre le détail de la zone,
// avec les mêmes composants que l'accueil du producteur.
import { useState, useSyncExternalStore } from 'react'
import { getEtatSol, getResumePoint, getResumesSites } from '@/lib/api'
import { pourcent, TITRES_ACTION, tendanceFr } from '@/lib/etat-sol'
import type { NiveauAlerte, ResumeEtatSol } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { nomCourt } from '@/lib/use-lieu-sol'
import BoutonVisite from '../aide/BoutonVisite'
import CarteAction, { SqueletteAction } from '../sol/CarteAction'
import CartePointeur from '../sol/CartePointeur'
import CoupeSol, { SqueletteCoupe } from '../sol/CoupeSol'
import EvolutionSol from '../sol/EvolutionSol'
import JaugeCouche from '../sol/JaugeCouche'
import { Erreur } from '../ui/elements'
import SelecteurProfilDemo from './SelecteurProfilDemo'

// ── Points ajoutés par le conseiller (sur l'appareil seulement) ──
type Point = { id: string; nom: string; lat: number; lon: number }
const CLE = 'sstack:zones'
const EVENEMENT = 'sstack:zones-change'
let brutEnCache: string | null = null
let pointsEnCache: Point[] = []
const VIDE: Point[] = []

function lirePoints(): Point[] {
  let brut: string | null = null
  try {
    brut = window.localStorage.getItem(CLE)
  } catch {
    return VIDE
  }
  if (brut === brutEnCache) return pointsEnCache
  brutEnCache = brut
  try {
    const v: unknown = brut ? JSON.parse(brut) : []
    pointsEnCache = Array.isArray(v)
      ? v.filter((p): p is Point => !!p && typeof p.id === 'string' && typeof p.nom === 'string' && typeof p.lat === 'number' && typeof p.lon === 'number')
      : []
  } catch {
    pointsEnCache = []
  }
  return pointsEnCache
}
function ecrirePoints(points: Point[]) {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(points))
  } catch {
    // stockage bloqué : le point ne sera pas retenu
  }
  window.dispatchEvent(new Event(EVENEMENT))
}
const abonner = (rappel: () => void) => {
  window.addEventListener(EVENEMENT, rappel)
  return () => window.removeEventListener(EVENEMENT, rappel)
}

const ORDRE: Record<NiveauAlerte, number> = { alerte: 0, vigilance: 1, ok: 2 }
const STYLE_ALERTE: Record<NiveauAlerte, { libelle: string; classes: string }> = {
  alerte: { libelle: 'Alerte', classes: 'bg-risk-bg text-risk ring-1 ring-risk-bar/40' },
  vigilance: { libelle: 'Vigilance', classes: 'bg-warn-bg text-warn-ink ring-1 ring-warn-line/40' },
  ok: { libelle: 'OK', classes: 'bg-accent-soft text-accent' },
}

function PastilleAlerte({ niveau }: { niveau: NiveauAlerte }) {
  const s = STYLE_ALERTE[niveau]
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${s.classes}`}>{s.libelle}</span>
}

function LigneZone({ r, onOuvrir, onRetirer }: { r: ResumeEtatSol; onOuvrir: () => void; onRetirer?: () => void }) {
  return (
    <li className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={onOuvrir}
        className="flex min-h-16 min-w-0 flex-1 cursor-pointer flex-col gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-left font-sans hover:border-accent"
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-ink">{nomCourt(r.site.nom)}</span>
          <PastilleAlerte niveau={r.alerte} />
        </span>
        <span className="text-[13px] text-muted-2">{TITRES_ACTION[r.codeAction]}</span>
        <span className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <JaugeCouche couche={r.racines} compacte />
          <span className="font-mono text-[13px] text-ink">
            racines {pourcent(r.racines.indice)} · <span className="font-sans text-muted-2">{tendanceFr(r.racines.tendance7j)}</span>
          </span>
        </span>
      </button>
      {onRetirer && (
        <button
          type="button"
          onClick={onRetirer}
          aria-label={`Retirer ${r.site.nom}`}
          className="flex w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-line bg-surface text-lg text-muted-2 hover:border-risk hover:text-risk"
        >
          ×
        </button>
      )}
    </li>
  )
}

/** Détail d'une zone : décision, coupe du sol et évolution, comme pour le producteur. */
export function DetailZone({ nom, lat, lon, onRetour }: { nom: string; lat: number; lon: number; onRetour: () => void }) {
  const etat = useApi(() => getEtatSol(lat, lon), `etat-sol:${lat.toFixed(4)}:${lon.toFixed(4)}`)
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onRetour} className="min-h-11 self-start rounded-xl border border-line bg-surface px-4 font-sans text-sm font-semibold text-accent hover:border-accent">
        ← Toutes les zones
      </button>
      <h2 className="m-0 font-display text-xl font-semibold text-ink">{nom}</h2>
      {etat.statut === 'erreur' && <Erreur message={etat.message} onReessayer={etat.recharger} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6">
        <div>{etat.statut === 'pret' ? <CarteAction etat={etat.donnees} /> : etat.statut === 'chargement' && <SqueletteAction />}</div>
        <div className="lg:row-span-2">{etat.statut === 'pret' ? <CoupeSol etat={etat.donnees} /> : etat.statut === 'chargement' && <SqueletteCoupe />}</div>
        {etat.statut === 'pret' && (
          <div className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
            <EvolutionSol etat={etat.donnees} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Un point ajouté : son résumé est chargé à part (GET /api/etat-sol/resume). */
function ZonePoint({ p, onOuvrir, onRetirer }: { p: Point; onOuvrir: () => void; onRetirer: () => void }) {
  const r = useApi(() => getResumePoint(p.lat, p.lon, p.nom), `resume:${p.id}`)
  if (r.statut === 'pret') return <LigneZone r={r.donnees} onOuvrir={onOuvrir} onRetirer={onRetirer} />
  return (
    <li className="flex min-h-16 items-center justify-between gap-2 rounded-2xl border border-dashed border-line bg-surface px-4 text-sm text-muted-2">
      {p.nom} : {r.statut === 'chargement' ? 'chargement…' : 'données indisponibles'}
      <button type="button" onClick={onRetirer} className="min-h-11 rounded-xl border-0 bg-transparent px-2 font-sans text-sm text-muted-2 hover:text-risk">
        Retirer
      </button>
    </li>
  )
}

export default function AccueilConseiller() {
  const resumes = useApi(getResumesSites, 'resumes-sites')
  const points = useSyncExternalStore(abonner, lirePoints, () => VIDE)
  const [ouverte, setOuverte] = useState<{ nom: string; lat: number; lon: number } | null>(null)
  const [ajout, setAjout] = useState<{ lat: number; lon: number } | null>(null)
  const [enAjout, setEnAjout] = useState(false)
  const [nom, setNom] = useState('')

  if (ouverte) return <DetailZone {...ouverte} onRetour={() => setOuverte(null)} />

  const tries = resumes.statut === 'pret' ? [...resumes.donnees].sort((a, b) => ORDRE[a.alerte] - ORDRE[b.alerte] || a.site.nom.localeCompare(b.site.nom, 'fr')) : []
  const nbAlertes = tries.filter((r) => r.alerte === 'alerte').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Mes zones</h1>
          <p className="m-0 text-sm text-muted-2">
            {resumes.statut === 'pret'
              ? nbAlertes > 0
                ? `${nbAlertes} zone${nbAlertes > 1 ? 's demandent' : ' demande'} une visite en priorité.`
                : 'Aucune zone en alerte pour le moment.'
              : 'Données NASA POWER, zones d\'environ 50 km.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelecteurProfilDemo />
          <BoutonVisite className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 font-sans text-sm font-semibold text-accent hover:border-accent" />
        </div>
      </div>

      {resumes.statut === 'erreur' && <Erreur message={resumes.message} onReessayer={resumes.recharger} />}
      {resumes.statut === 'chargement' && (
        <ul aria-hidden="true" className="m-0 flex list-none flex-col gap-2 p-0">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="h-24 animate-pulse rounded-2xl bg-line-soft" />
          ))}
        </ul>
      )}

      {resumes.statut === 'pret' && (
        <section data-visite="zones" aria-label="Zones triées par urgence">
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 lg:grid-cols-2">
            {tries.map((r) => (
              <LigneZone key={r.site.id} r={r} onOuvrir={() => setOuverte({ nom: r.site.nom, lat: r.site.lat, lon: r.site.lon })} />
            ))}
            {points.map((p) => (
              <ZonePoint key={p.id} p={p} onOuvrir={() => setOuverte({ nom: p.nom, lat: p.lat, lon: p.lon })} onRetirer={() => ecrirePoints(points.filter((x) => x.id !== p.id))} />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-display text-base font-semibold text-ink">Ajouter une zone</h2>
          <button
            type="button"
            onClick={() => {
              setEnAjout((v) => !v)
              setAjout(null)
            }}
            aria-expanded={enAjout}
            className="min-h-11 rounded-xl border border-line bg-surface px-4 font-sans text-sm font-semibold text-accent hover:border-accent"
          >
            {enAjout ? 'Annuler' : 'Placer un point sur la carte'}
          </button>
        </div>
        {enAjout && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!ajout) return
              const n = nom.trim() || `Zone ${points.length + 1}`
              ecrirePoints([...points, { id: `${Date.now()}`, nom: n.slice(0, 60), lat: ajout.lat, lon: ajout.lon }])
              setEnAjout(false)
              setAjout(null)
              setNom('')
            }}
          >
            <CartePointeur point={ajout} onToucher={(lat, lon) => setAjout({ lat, lon })} />
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              Nom de la zone
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                maxLength={60}
                placeholder={`Zone ${points.length + 1}`}
                className="min-h-11 rounded-xl border border-line bg-surface px-3 font-sans text-[15px] font-normal text-ink"
              />
            </label>
            <button type="submit" disabled={!ajout} className="min-h-11 self-start rounded-xl bg-accent px-4 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
              {ajout ? 'Ajouter cette zone' : 'Touchez d\'abord la carte'}
            </button>
            <p className="m-0 text-[13px] text-muted">Les zones ajoutées restent sur cet appareil.</p>
          </form>
        )}
      </section>
    </div>
  )
}
