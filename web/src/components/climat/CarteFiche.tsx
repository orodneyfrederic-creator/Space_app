// Résumé lisible de la fiche parcelle : pluie, sol, saison, verdict de la fenêtre de semis.
import type { DonneesFiche } from '@/lib/types'

// Couleur selon le verdict : favorable / risquée / défavorable
function styleVerdict(verdict: string) {
  const v = verdict.toLowerCase()
  if (v.startsWith('favorable')) return 'bg-accent-soft text-accent'
  if (v.startsWith('risqu')) return 'bg-warn-bg text-warn'
  return 'bg-risk-bg text-risk'
}

function Ecart({ valeur }: { valeur: number | null }) {
  if (valeur === null) return null
  return (
    <span className="font-mono text-[11px] text-muted">
      {valeur > 0 ? '+' : ''}
      {valeur} %
    </span>
  )
}

export default function CarteFiche({ fiche }: { fiche: DonneesFiche }) {
  const { evaluation } = fiche
  return (
    <section aria-labelledby="fiche-title" className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h2 id="fiche-title" className="font-display text-[17px] font-semibold">
          Fenêtre de semis
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styleVerdict(evaluation.verdict)}`}>
          {evaluation.verdict}
        </span>
      </div>
      <p className="m-0 text-sm leading-[1.45] text-muted-2">{evaluation.raison}</p>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
          <span className="text-xs text-muted">Pluie 30 jours</span>
          <span className="font-mono text-xl font-bold">{fiche.pluie30} mm</span>
          <span className="flex justify-between text-[11px] text-muted">
            normale {fiche.normale30} <Ecart valeur={fiche.ecart30} />
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
          <span className="text-xs text-muted">Pluie 7 jours</span>
          <span className="font-mono text-xl font-bold">{fiche.pluie7} mm</span>
          <span className="flex justify-between text-[11px] text-muted">
            normale {fiche.normale7} <Ecart valeur={fiche.ecart7} />
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
          <span className="text-xs text-muted">État du sol</span>
          <span className="font-display text-xl font-semibold capitalize">{fiche.etatSol}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
          <span className="text-xs text-muted">Temp. max 7 j</span>
          <span className="font-mono text-xl font-bold">{fiche.tmax7 ?? '–'} °C</span>
        </div>
      </div>

      {fiche.solTexture && (
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-risk-bg px-2.5 py-[5px] text-xs font-medium text-risk">
            Argile {fiche.solTexture.argile} %
          </span>
          <span className="rounded-full bg-risk-bg px-2.5 py-[5px] text-xs font-medium text-risk">
            Sable {fiche.solTexture.sable} %
          </span>
          <span className="rounded-full bg-risk-bg px-2.5 py-[5px] text-xs font-medium text-risk">
            pH {fiche.solTexture.ph}
          </span>
        </div>
      )}

      <p className="m-0 text-[11px] text-muted">Données NASA POWER jusqu&apos;au {fiche.dernierJour}</p>
    </section>
  )
}
