// Page d'accueil / tableau de bord : vue d'ensemble pour coopératives, conseillers et jury.
// TODO (front-end) : résumé des parcelles (verdict de semis de chacune) à partir du serveur.
import Link from "next/link";
import { PinIcon, SunIcon } from "@/components/icons";
import { PARCELLES_DEMO } from "@/lib/donnees-demo";

// Valeurs d'exemple de la maquette — à remplacer par les données NASA POWER
const tiles = [
  { label: "Pluie sur 7 jours", value: "62", unit: "mm" },
  { label: "Température", value: "27", unit: "°C" },
];

export default function Accueil() {
  return (
    <main className="flex flex-1 flex-col gap-[18px] overflow-auto px-5 pt-14 pb-4">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold tracking-[0.4px] text-accent">S&apos;STACK</span>
          <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">Libreville, Estuaire</h1>
          <span className="text-[13px] text-muted">Samedi 14 novembre · saison des pluies</span>
        </div>
        <Link
          href="/carte"
          aria-label="Changer de parcelle"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent"
        >
          <PinIcon />
        </Link>
      </header>

      <section aria-labelledby="cond-title" className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 id="cond-title" className="font-display text-[17px] font-semibold">Conditions actuelles</h2>
          <span className="rounded-full bg-info-soft px-2 py-1 text-[11px] font-semibold text-info-ink">NASA POWER</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
              <span className="text-xs text-muted">{t.label}</span>
              <span className="font-mono text-2xl font-bold">
                {t.value} <span className="text-[13px] font-normal">{t.unit}</span>
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1.5 rounded-[14px] bg-paper p-3">
            <span className="text-xs text-muted">Humidité du sol</span>
            <span className="h-7 font-mono text-2xl font-bold">0,72</span>
            <div className="h-1.5 rounded-[3px] bg-line">
              <div className="h-1.5 w-[72%] rounded-[3px] bg-info" />
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3">
            <span className="text-xs text-muted">Ensoleillement</span>
            <span className="font-mono text-2xl font-bold">
              4,8 <span className="text-[13px] font-normal">kWh/m²</span>
            </span>
          </div>
        </div>
        <Link
          href="/donnees"
          className="flex min-h-8 items-center text-sm font-semibold text-accent no-underline hover:text-accent-hover"
        >
          Voir le détail des données →
        </Link>
      </section>

      <div role="note" className="flex items-start gap-3 rounded-2xl bg-warn-bg px-4 py-3.5 text-warn-ink">
        <SunIcon />
        <p className="m-0 text-sm leading-[1.45]">
          Pluie au-dessus du <strong>75e percentile</strong> cette semaine : bon moment pour planter le manioc.
        </p>
      </div>

      <section aria-labelledby="parcelles-title" className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 id="parcelles-title" className="font-display text-[17px] font-semibold">Parcelles suivies</h2>
          <Link href="/carte" className="text-[13px] font-semibold text-accent no-underline hover:text-accent-hover">
            Voir la carte
          </Link>
        </div>
        <ul className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1">
          {PARCELLES_DEMO.map((p) => (
            <li key={p.id} className="shrink-0">
              <Link
                href={`/parcelles/${p.id}`}
                className="flex min-h-11 items-center rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink no-underline hover:border-accent"
              >
                {p.nom}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-2.5">
        <Link
          href="/cultures"
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent text-base font-semibold text-white no-underline hover:bg-accent-hover"
        >
          Que planter cette saison ?
        </Link>
        <Link
          href="/discuter"
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-line bg-surface text-[15px] font-semibold text-ink no-underline"
        >
          Poser une question à l&apos;agent
        </Link>
      </div>
    </main>
  );
}
