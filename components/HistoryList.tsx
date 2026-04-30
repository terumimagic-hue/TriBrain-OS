"use client";

import { useEffect, useState } from "react";

interface HistoryItem {
  id: string;
  prompt: string;
  mode: string;
  createdAt: string;
  hasSynthesis: boolean;
  hasDebate: boolean;
}

interface Props {
  refreshKey: number;
  onSelect: (id: string) => void;
}

export default function HistoryList({ refreshKey, onSelect }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/history")
      .then((r) => r.json())
      .then((data: HistoryItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
        History
      </h3>
      {loading && <div className="text-xs text-zinc-500">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="text-xs text-zinc-600">No sessions yet.</div>
      )}
      <ul className="space-y-2 max-h-[60vh] overflow-auto scrollbar-thin">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it.id)}
              className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-2 transition"
            >
              <div className="text-xs text-zinc-500 flex items-center justify-between mb-1">
                <span>{new Date(it.createdAt).toLocaleString()}</span>
                <span className="uppercase tracking-wider">{it.mode}</span>
              </div>
              <div className="text-sm text-zinc-200 line-clamp-2">
                {it.prompt}
              </div>
              <div className="mt-1 text-[10px] text-zinc-500 flex gap-2">
                {it.hasSynthesis && <span>· synthesis</span>}
                {it.hasDebate && <span>· debate</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
