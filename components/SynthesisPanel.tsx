"use client";

import { PROVIDER_LABELS } from "@/lib/providers/labels";
import type { ProviderId } from "@/lib/types";

interface Props {
  content?: string;
  provider?: ProviderId;
  loading: boolean;
}

export default function SynthesisPanel({ content, provider, loading }: Props) {
  return (
    <div className="rounded-2xl border border-synthesis/40 bg-synthesis/[0.08] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-synthesis" />
          <h2 className="text-sm font-semibold tracking-wide">Final Synthesis</h2>
        </div>
        {provider && (
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            judged by {PROVIDER_LABELS[provider]}
          </div>
        )}
      </div>

      <div className="markdown text-zinc-100">
        {!content && loading && (
          <div className="text-zinc-400 text-sm animate-pulse">
            Synthesizing the council's verdict…
          </div>
        )}
        {!content && !loading && (
          <div className="text-zinc-500 text-sm">
            Submit a prompt to see the merged final answer.
          </div>
        )}
        {content}
      </div>
    </div>
  );
}
