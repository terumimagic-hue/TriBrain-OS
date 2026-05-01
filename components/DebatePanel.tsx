"use client";

import { PROVIDER_LABELS } from "@/lib/providers/labels";
import type { DebateRound, ProviderId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROUND_LABELS: Record<number, string> = {
  1: "Round 1 — Independent answers",
  2: "Round 2 — Cross-critique",
  3: "Round 3 — Revised answers"
};

const DOTS: Record<ProviderId, string> = {
  openai: "bg-chatgpt",
  anthropic: "bg-claude",
  gemini: "bg-gemini"
};

interface Props {
  rounds: DebateRound[];
}

export default function DebatePanel({ rounds }: Props) {
  if (!rounds.length) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">
        Debate transcript
      </h2>
      {rounds.map((round) => (
        <div
          key={round.round}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
        >
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            {ROUND_LABELS[round.round] ?? `Round ${round.round}`}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {round.results.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("h-2 w-2 rounded-full", DOTS[r.provider])} />
                  <span className="font-medium">
                    {PROVIDER_LABELS[r.provider]}
                  </span>
                </div>
                <div className="markdown text-zinc-200 max-h-72 overflow-auto scrollbar-thin">
                  {r.ok ? r.content : (
                    <span className="text-red-400">⚠️ {r.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
