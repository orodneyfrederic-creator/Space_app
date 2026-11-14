"use client";

import { useState } from "react";

const periods = ["14 j", "3 mois", "5 ans"] as const;

export default function PeriodSelector() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("14 j");

  return (
    <div role="group" aria-label="Période" className="grid grid-cols-3 gap-1.5 rounded-[14px] bg-segmented p-1">
      {periods.map((p) => {
        const on = p === period;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={on}
            onClick={() => setPeriod(p)}
            className={`min-h-11 cursor-pointer rounded-[10px] border-none text-sm font-semibold ${
              on ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "bg-transparent text-muted"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
