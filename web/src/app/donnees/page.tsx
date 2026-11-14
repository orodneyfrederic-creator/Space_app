import PeriodSelector from "@/components/PeriodSelector";
import TabBar from "@/components/TabBar";

// Pluie quotidienne sur 14 jours (exemple) — hauteur des barres en px
const rain = [30, 12, 55, 80, 20, 8, 45, 110, 95, 60, 25, 70, 120, 88];
const P75 = 98; // 75e percentile, même échelle

export default function Donnees() {
  return (
    <div className="screen">
      <main className="flex flex-1 flex-col gap-4 overflow-auto px-5 pt-14 pb-4">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] font-bold tracking-[-0.5px]">Données NASA</h1>
          <span className="text-[13px] text-muted">Libreville · historique et tendances</span>
        </header>

        <PeriodSelector />

        <section aria-labelledby="rain-title" className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
          <div className="flex items-baseline justify-between">
            <h2 id="rain-title" className="font-display text-[17px] font-semibold">Pluie quotidienne</h2>
            <span className="text-xs text-muted">PRECTOTCORR · mm</span>
          </div>
          <div className="relative flex h-[140px] items-end gap-[5px] border-b border-line">
            <div aria-hidden="true" className="absolute inset-x-0 border-t-2 border-dashed border-warn-line" style={{ bottom: P75 }} />
            <span className="absolute right-0 bg-surface px-1 text-[11px] font-semibold text-warn" style={{ bottom: P75 + 4 }}>
              75e percentile
            </span>
            {rain.map((v, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t ${v >= P75 ? "bg-accent" : "bg-accent-light"}`}
                style={{ height: v }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-muted">
            <span>il y a 14 j</span>
            <span>aujourd&apos;hui</span>
          </div>
        </section>

        <section aria-labelledby="soil-title" className="flex flex-col gap-2.5 rounded-[20px] bg-surface p-[18px]">
          <div className="flex items-baseline justify-between">
            <h2 id="soil-title" className="font-display text-[17px] font-semibold">Humidité du sol (racines)</h2>
            <span className="text-xs text-muted">GWETROOT</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[32px] font-semibold">0,72</span>
            <span className="text-[13px] font-semibold text-accent">Sol humide</span>
          </div>
          <div className="relative h-2.5 rounded-[5px] bg-[linear-gradient(90deg,#E9D3B6,#CFE2D5)]">
            <div aria-hidden="true" className="absolute -top-1 left-[72%] h-[18px] w-1 rounded-sm bg-ink" />
          </div>
          <div className="flex justify-between text-[11px] text-muted">
            <span>0 · sec</span>
            <span>1 · saturé</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 rounded-2xl bg-surface p-3.5">
            <span className="text-xs text-muted">Temp. min / max</span>
            <span className="font-display text-xl font-semibold">23° / 31°</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-surface p-3.5">
            <span className="text-xs text-muted">Prévision 7 j</span>
            <span className="font-display text-xl font-semibold">48 mm</span>
          </div>
        </div>

        <p className="m-0 text-[11px] leading-normal text-muted">
          Historique : NASA POWER (T2M, PRECTOTCORR, GWETROOT). Prévisions : Meteomatics.
        </p>
      </main>

      <TabBar active="/donnees" />
    </div>
  );
}
