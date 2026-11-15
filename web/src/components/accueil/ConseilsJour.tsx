'use client'
// Blocs du dashboard du producteur, à partir de GET /api/conseils-jour (tout est calculé par le serveur) :
// état de la terre en mots simples, alertes des prochains jours, prévisions 7 jours, plan de la semaine,
// et choix de la culture (manioc ou banane plantain).
import { CULTURES } from '@/lib/culture'
import type { AlerteMeteo, ConseilsJour, Culture, EtatTerreSimple, PrevisionJour } from '@/lib/types'

// ── Choix de la culture ──

export function SelecteurCulture({ culture, choisir }: { culture: Culture; choisir: (c: Culture) => void }) {
  return (
    <div role="radiogroup" aria-label="Votre culture" className="flex flex-wrap gap-2">
      {CULTURES.map((c) => {
        const actif = c.id === culture
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => choisir(c.id)}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 font-sans text-[15px] font-semibold transition-colors ${
              actif ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink hover:border-accent'
            }`}
          >
            <span aria-hidden="true">{c.id === 'manioc' ? '🌿' : '🍌'}</span>
            {c.nom}
          </button>
        )
      })}
    </div>
  )
}

// ── État de la terre ──

const TON_TERRE: Record<EtatTerreSimple['ton'], { fond: string; pastille: string; mot: string }> = {
  seche: { fond: 'bg-risk-bg', pastille: 'bg-risk-bar', mot: 'Sèche' },
  bonne: { fond: 'bg-accent-soft', pastille: 'bg-success', mot: 'Bonne' },
  mouillee: { fond: 'bg-info-soft', pastille: 'bg-info', mot: 'Mouillée' },
  inconnu: { fond: 'bg-line-soft', pastille: 'bg-muted', mot: 'Inconnue' },
}

export function CarteEtatTerre({ etat }: { etat: EtatTerreSimple }) {
  const t = TON_TERRE[etat.ton]
  return (
    <section aria-labelledby="titre-terre" className={`flex flex-col gap-2 rounded-3xl px-5 py-5 ${t.fond}`}>
      <p className="m-0 flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink/70 uppercase">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${t.pastille}`} />
        Votre terre aujourd&apos;hui · {t.mot}
      </p>
      <h2 id="titre-terre" className="m-0 font-display text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">
        {etat.titre}
      </h2>
      <p className="m-0 text-[15px] leading-relaxed text-ink/85">{etat.phrase}</p>
    </section>
  )
}

// ── Alertes ──

const STYLE_ALERTE: Record<AlerteMeteo['niveau'], { carte: string; badge: string; mot: string }> = {
  danger: { carte: 'border-risk-bar/50 bg-risk-bg', badge: 'bg-risk text-white', mot: 'Danger' },
  attention: { carte: 'border-warn-line/60 bg-warn-bg', badge: 'bg-warn-ink text-white', mot: 'Attention' },
  bonne_nouvelle: { carte: 'border-accent-light bg-accent-soft', badge: 'bg-accent text-white', mot: 'Bonne nouvelle' },
}

function IconeAlerte({ type }: { type: AlerteMeteo['type'] }) {
  const commun = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (type === 'chaleur')
    return (
      <svg {...commun}>
        <path d="M12 3v11.5a3.5 3.5 0 1 1-2 0V5a1 1 0 0 1 2 0" />
        <path d="M17 6h3M17 10h3" />
      </svg>
    )
  if (type === 'secheresse')
    return (
      <svg {...commun}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  if (type === 'engorgement')
    return (
      <svg {...commun}>
        <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
        <path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
        <path d="M12 3s-3.5 4-3.5 6.5a3.5 3.5 0 0 0 7 0C15.5 7 12 3 12 3Z" />
      </svg>
    )
  return (
    <svg {...commun}>
      <path d="M7 15a5 5 0 1 1 9.6-2H18a3 3 0 0 1 0 6H7a4 4 0 0 1 0-8" />
      <path d="M9 21l1-2M13 21l1-2" />
    </svg>
  )
}

export function CarteAlertes({ alertes, sansPrevisions }: { alertes: AlerteMeteo[]; sansPrevisions: boolean }) {
  return (
    <section data-visite="alertes" aria-labelledby="titre-alertes" className="flex flex-col gap-3">
      <h2 id="titre-alertes" className="m-0 font-display text-[19px] font-semibold text-ink">
        Alertes des prochains jours
      </h2>
      {alertes.length === 0 && (
        <p className="m-0 rounded-2xl bg-surface px-4 py-3 text-[15px] text-muted-2 ring-1 ring-line">
          {sansPrevisions ? 'Prévisions indisponibles pour le moment : pas d’alerte calculée.' : 'Aucune alerte cette semaine : pas de forte chaleur ni de grosse pluie prévue.'}
        </p>
      )}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {alertes.map((a, i) => {
          const s = STYLE_ALERTE[a.niveau]
          return (
            <li key={`${a.type}-${i}`} className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 ${s.carte}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-ink">
                  <IconeAlerte type={a.type} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="m-0 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${s.badge}`}>{s.mot}</span>
                    <span className="font-display text-[17px] font-semibold text-ink">{a.titre}</span>
                  </p>
                  <p className="m-0 text-[14px] font-semibold text-ink/80">{a.quand.charAt(0).toUpperCase() + a.quand.slice(1)}</p>
                  <p className="m-0 text-[15px] leading-snug text-ink">{a.message}</p>
                </div>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-3">
                <p className="m-0 mb-2 text-[13px] font-semibold text-ink">Ce que vous pouvez faire :</p>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {a.gestes.map((g, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink">
                      <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink/10 font-mono text-[11px] font-semibold">
                        {k + 1}
                      </span>
                      {g}
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ── Prévisions 7 jours ──

const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const libelleJour = (iso: string, i: number) => (i === 0 ? 'Auj.' : i === 1 ? 'Demain' : `${JOURS_COURTS[new Date(`${iso}T12:00:00Z`).getUTCDay()]} ${Number(iso.slice(8, 10))}`)

function IconeCiel({ j }: { j: PrevisionJour }) {
  const pluie = j.pluie ?? 0
  const chaud = (j.tmax ?? 0) >= 33
  const p = { width: 30, height: 30, viewBox: '0 0 32 32', 'aria-hidden': true }
  if (pluie >= 10)
    return (
      <svg {...p}>
        <path d="M9 18a6 6 0 1 1 11.5-3H22a4 4 0 0 1 0 8H9a5 5 0 0 1 0-10" fill="#A9C4E8" stroke="#2A5A9C" strokeWidth="1.4" />
        <path d="M11 26l-1 3M16 26l-1 3M21 26l-1 3" stroke="#3A75C4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  if (pluie >= 1)
    return (
      <svg {...p}>
        <circle cx="22" cy="10" r="5" fill="#FCD116" stroke="#C9A200" strokeWidth="1.2" />
        <path d="M8 21a5 5 0 1 1 9.6-2H19a3.5 3.5 0 0 1 0 7H8a4 4 0 0 1 0-8" fill="#FFFFFF" stroke="#535B53" strokeWidth="1.4" />
        <path d="M13 29l-.6 1.8" stroke="#3A75C4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg {...p}>
      <circle cx="16" cy="16" r={chaud ? 7.5 : 6} fill={chaud ? '#E5A12A' : '#FCD116'} stroke="#C9A200" strokeWidth="1.4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={16 + Math.cos((a * Math.PI) / 180) * 10} y1={16 + Math.sin((a * Math.PI) / 180) * 10} x2={16 + Math.cos((a * Math.PI) / 180) * 13} y2={16 + Math.sin((a * Math.PI) / 180) * 13} stroke="#C9A200" strokeWidth="1.8" strokeLinecap="round" />
      ))}
    </svg>
  )
}

export function PrevisionsSemaine({ conseils }: { conseils: ConseilsJour }) {
  const p = conseils.previsions
  return (
    <section data-visite="previsions" aria-labelledby="titre-previsions" className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-0.5">
        <h2 id="titre-previsions" className="m-0 font-display text-[19px] font-semibold text-ink">
          Les 7 prochains jours
        </h2>
        <p className="m-0 text-[15px] text-ink">{conseils.prochainePluie}</p>
      </div>
      {p && (
        <>
          <ol className="m-0 grid list-none grid-cols-7 gap-1 p-0">
            {p.jours.map((j, i) => {
              const chaud = (j.tmax ?? 0) >= 33
              const forte = (j.pluie ?? 0) >= 30
              return (
                <li
                  key={j.date}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-center ${chaud ? 'bg-warn-bg ring-1 ring-warn-line/60' : forte ? 'bg-info-soft ring-1 ring-info-light' : i === 0 ? 'bg-pale' : ''}`}
                >
                  <span className="text-[11.5px] font-semibold text-muted-2">{libelleJour(j.date, i)}</span>
                  <IconeCiel j={j} />
                  <span className="font-mono text-[13px] font-semibold text-ink">{j.tmax === null ? '—' : `${Math.round(j.tmax)}°`}</span>
                  <span className={`font-mono text-[11.5px] ${(j.pluie ?? 0) >= 1 ? 'font-semibold text-info-ink' : 'text-muted'}`}>
                    {j.pluie === null ? '—' : (j.pluie ?? 0) < 1 ? '0 mm' : `${Math.round(j.pluie)} mm`}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="m-0 text-[12px] text-muted">
            En haut : la chaleur la plus forte du jour. En bas : la pluie prévue. {p.source}.
          </p>
        </>
      )}
    </section>
  )
}

// ── Plan de la semaine ──

export function PlanSemaine({ conseils }: { conseils: ConseilsJour }) {
  return (
    <section data-visite="plan" aria-labelledby="titre-plan" className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 sm:p-5">
      <h2 id="titre-plan" className="m-0 font-display text-[19px] font-semibold text-ink">
        Votre plan, étape par étape
      </h2>
      <ol className="m-0 flex list-none flex-col p-0">
        {conseils.plan.map((e, i) => (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            {i < conseils.plan.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-0.5 bg-line" />}
            <span aria-hidden="true" className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[14px] font-semibold text-white">
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5 pt-1">
              <span className="text-[13px] font-semibold tracking-wide text-accent uppercase">{e.quand}</span>
              <span className="text-[15px] leading-snug text-ink">{e.geste}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
