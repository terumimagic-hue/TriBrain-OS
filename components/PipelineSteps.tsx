"use client";

import { useState } from "react";
import { STEPS, type StepId } from "@/lib/pipeline/steps";
import type { AgentRunRow } from "@/lib/db/models";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  runs: AgentRunRow[];
  onRefresh: () => void;
}

const AGENT_COLOR: Record<string, string> = {
  gemini: "text-gemini",
  claude: "text-claude",
  james: "text-chatgpt",
  system: "text-zinc-400"
};

export default function PipelineSteps({ projectId, runs, onRefresh }: Props) {
  const [busy, setBusy] = useState<StepId | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastByStep = new Map<string, AgentRunRow>();
  for (const r of runs) {
    if (!lastByStep.has(r.step)) lastByStep.set(r.step, r);
  }

  async function run(step: StepId | "all") {
    setBusy(step);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
          Pipeline
        </h2>
        <button
          onClick={() => run("all")}
          disabled={busy !== null}
          className="text-xs rounded-lg bg-white text-black px-3 py-1.5 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {busy === "all" ? "Running full pipeline…" : "Run all steps"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <ol className="space-y-2">
        {STEPS.map((s) => {
          const r = lastByStep.get(s.id);
          const status = r?.status ?? "pending";
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-xl border px-4 py-3 flex items-center gap-3",
                status === "done" && "border-emerald-900/60 bg-emerald-950/20",
                status === "running" && "border-amber-900/60 bg-amber-950/20",
                status === "error" && "border-red-900 bg-red-950/30",
                status === "pending" && "border-zinc-800"
              )}
            >
              <StatusDot status={status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.label}</span>
                  <span className={cn("text-xs", AGENT_COLOR[s.agent])}>· {s.agent}</span>
                </div>
                <div className="text-xs text-zinc-500 truncate">{s.description}</div>
                {r?.error && (
                  <div className="text-xs text-red-400 mt-1 line-clamp-2">⚠️ {r.error}</div>
                )}
              </div>
              <button
                onClick={() => run(s.id)}
                disabled={busy !== null}
                className="text-xs rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-900 disabled:opacity-50"
              >
                {busy === s.id
                  ? "Running…"
                  : status === "done"
                    ? "Re-run"
                    : status === "error"
                      ? "Retry"
                      : "Run"}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "done"
      ? "bg-emerald-400"
      : status === "running"
        ? "bg-amber-400 animate-pulse"
        : status === "error"
          ? "bg-red-500"
          : "bg-zinc-600";
  return <span className={cn("h-2 w-2 rounded-full", color)} />;
}
