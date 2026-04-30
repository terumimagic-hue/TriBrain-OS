"use client";

import { PROVIDER_LABELS } from "@/lib/providers";
import type { ProviderId, ProviderResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENTS: Record<ProviderId, string> = {
  openai: "border-chatgpt/40 bg-chatgpt/[0.06]",
  anthropic: "border-claude/40 bg-claude/[0.06]",
  gemini: "border-gemini/40 bg-gemini/[0.06]"
};

const DOTS: Record<ProviderId, string> = {
  openai: "bg-chatgpt",
  anthropic: "bg-claude",
  gemini: "bg-gemini"
};

interface Props {
  provider: ProviderId;
  result?: ProviderResult;
  loading: boolean;
}

export default function AnswerPanel({ provider, result, loading }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex flex-col min-h-[200px]",
        ACCENTS[provider]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", DOTS[provider])} />
          <h2 className="text-sm font-semibold tracking-wide">
            {PROVIDER_LABELS[provider]}
          </h2>
        </div>
        {result && (
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            {result.model} · {result.latencyMs}ms
          </div>
        )}
      </div>

      <div className="markdown text-zinc-100 flex-1 overflow-auto scrollbar-thin">
        {!result && loading && (
          <div className="text-zinc-500 text-sm animate-pulse">Thinking…</div>
        )}
        {!result && !loading && (
          <div className="text-zinc-600 text-sm">No answer yet.</div>
        )}
        {result && result.ok && result.content}
        {result && !result.ok && (
          <div className="text-red-400 text-sm">⚠️ {result.error}</div>
        )}
      </div>
    </div>
  );
}
