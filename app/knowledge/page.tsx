"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface KnowledgeItem {
  id: string;
  kind: string;
  title: string | null;
  content: string;
  project_id: string | null;
  score?: number;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("");
  const [searching, setSearching] = useState(false);

  async function load() {
    const res = await fetch(`/api/knowledge${kind ? `?kind=${kind}` : ""}`);
    const body = await res.json();
    setItems(body.items || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function search() {
    if (!q.trim()) return load();
    setSearching(true);
    const params = new URLSearchParams({ q });
    if (kind) params.set("kind", kind);
    const res = await fetch(`/api/knowledge?${params.toString()}`);
    const body = await res.json();
    setItems(body.hits || []);
    setSearching(false);
  }

  const kinds = useMemo(() => Array.from(new Set(items.map((i) => i.kind))), [items]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Books
        </Link>
        <h1 className="text-2xl font-bold mt-2">Knowledge base</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Distilled knowledge from every completed book — concepts, style DNA, series rules,
          metaphors, lessons. Used automatically when starting the next book.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Semantic search across knowledge…"
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">All kinds</option>
          {[
            "book_summary",
            "chapter_summary",
            "concept",
            "argument",
            "tone",
            "series_rule",
            "reader_promise",
            "title_pattern",
            "kdp_position",
            "metaphor",
            "citation",
            "lesson"
          ].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <button
          onClick={search}
          disabled={searching}
          className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-zinc-800 p-6 text-zinc-400 text-sm">
          No knowledge items yet. They are created when a book reaches the Ingestion step.
        </div>
      )}

      {kinds.length > 0 && (
        <div className="text-xs text-zinc-500 mb-3">
          Kinds in view: {kinds.join(", ")}
        </div>
      )}

      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500">{it.kind}</span>
                {it.title && <span className="font-medium ml-2">{it.title}</span>}
              </div>
              {typeof it.score === "number" && (
                <span className="text-xs text-zinc-500 font-mono">
                  similarity {(it.score * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{it.content}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
