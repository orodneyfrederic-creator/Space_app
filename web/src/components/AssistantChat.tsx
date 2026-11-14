"use client";

import { useState } from "react";
import { ArrowIcon } from "./icons";

const suggestions = ["Quand semer le manioc ?", "Mon sol est-il trop humide ?", "Quelle culture pour janvier ?"];

export default function AssistantChat() {
  const [draft, setDraft] = useState("");

  return (
    <>
      <main className="flex flex-1 flex-col gap-3.5 overflow-auto px-5 py-4">
        <div className="max-w-[80%] self-end rounded-[18px_18px_4px_18px] bg-accent px-3.5 py-3 text-sm leading-[1.45] text-white">
          Est-ce que je peux planter du maïs en décembre ?
        </div>

        <div className="flex max-w-[88%] flex-col gap-2.5 self-start rounded-[18px_18px_18px_4px] bg-surface p-3.5">
          <p className="m-0 text-sm leading-normal">
            D&apos;après 5 ans de données NASA POWER, décembre reçoit en moyenne <strong>[X] mm</strong> de pluie à
            Libreville, avec une humidité du sol de <strong>[Y]</strong>.
          </p>
          <p className="m-0 text-sm leading-normal">
            Selon FAO ECOCROP, le maïs préfère <strong>[plage idéale]</strong>. [Conclusion du modèle : planter ou
            attendre, et quelle alternative.]
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">Sources</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-accent-soft px-2.5 py-[5px] text-xs font-medium text-accent">
                NASA POWER · décembre
              </span>
              <span className="rounded-full bg-accent-soft px-2.5 py-[5px] text-xs font-medium text-accent">
                FAO ECOCROP · maïs
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <span className="text-xs text-muted">Suggestions</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>

      <form
        onSubmit={(e) => e.preventDefault() /* à brancher sur le modèle (RAG) */}
        className="flex shrink-0 items-center gap-2 border-t border-line-soft bg-surface px-4 pt-2.5 pb-[30px]"
      >
        <label htmlFor="question" className="sr-only">
          Votre question
        </label>
        <input
          id="question"
          type="text"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Posez votre question…"
          className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-[15px] text-ink"
        />
        <button
          type="submit"
          aria-label="Envoyer la question"
          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white"
        >
          <ArrowIcon />
        </button>
      </form>
    </>
  );
}
