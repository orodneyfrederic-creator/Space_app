import Link from "next/link";

const levels = {
  good: { tag: "Très adapté", tagClass: "text-accent bg-accent-soft", bar: "bg-success" },
  ok: { tag: "Avec précautions", tagClass: "text-warn bg-warn-bg", bar: "bg-warn-bar" },
  risk: { tag: "À risque", tagClass: "text-risk bg-risk-bg", bar: "bg-risk-bar" },
} as const;

// Scores d'exemple — conditions NASA POWER comparées aux besoins FAO ECOCROP
const crops: { name: string; score: number; level: keyof typeof levels; reason: string }[] = [
  { name: "Manioc", score: 92, level: "good", reason: "Supporte bien la forte pluviométrie prévue." },
  { name: "Banane plantain", score: 85, level: "good", reason: "Besoin d’eau régulier : conditions favorables." },
  { name: "Arachide", score: 58, level: "ok", reason: "Sol très humide en ce moment : risque de pourriture." },
  { name: "Maïs", score: 38, level: "risk", reason: "Humidité du sol élevée (GWETROOT) : attendre la saison sèche." },
];

export default function Cultures() {
  return (
    <main className="flex flex-1 flex-col gap-3.5 overflow-auto px-5 pt-14 pb-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">Cultures conseillées</h1>
        <span className="text-[13px] text-muted">Libreville · 3 prochains mois</span>
      </header>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {crops.map((c) => {
          const l = levels[c.level];
          return (
            <li key={c.name} className="flex flex-col gap-2 rounded-[18px] bg-surface px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">{c.name}</h2>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${l.tagClass}`}>
                  {l.tag}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 flex-1 rounded bg-track">
                  <div className={`h-2 rounded ${l.bar}`} style={{ width: `${c.score}%` }} />
                </div>
                <span className="min-w-12 text-right font-mono text-[13px] font-bold">{c.score}/100</span>
              </div>
              <p className="m-0 text-[13px] leading-[1.45] text-muted-2">{c.reason}</p>
            </li>
          );
        })}
      </ul>

      <Link
        href="/assistant"
        className="mt-auto flex min-h-[52px] items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-white no-underline hover:bg-accent-hover"
      >
        Pourquoi ces choix ? Demander à l&apos;agent
      </Link>
      <p className="m-0 text-center text-[11px] text-muted">
        Score : conditions NASA POWER comparées aux besoins FAO ECOCROP
      </p>
    </main>
  );
}
