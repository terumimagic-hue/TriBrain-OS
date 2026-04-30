"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BookProjectRow } from "@/lib/db/models";

interface ProjectWithCost extends BookProjectRow {
  cost: { tokens_in: number; tokens_out: number; usd: number };
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            BookBrain <span className="text-zinc-500">OS</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Fully automated AI book creation and knowledge accumulation. Gemini researches,
            Claude writes, James commercializes — and every finished book teaches the system how
            to write the next one.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/projects/new"
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200"
          >
            New book
          </Link>
          <Link
            href="/knowledge"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            Knowledge
          </Link>
          <Link
            href="/tribrain"
            className="rounded-xl border border-zinc-800 text-zinc-400 px-3 py-2 text-xs hover:bg-zinc-900"
          >
            TriBrain →
          </Link>
        </div>
      </header>

      {loading && <div className="text-zinc-500 text-sm">Loading…</div>}

      {!loading && projects.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
          <h2 className="text-xl font-semibold">No books yet</h2>
          <p className="text-zinc-400 mt-2">
            Start with one idea. The pipeline does the rest.
          </p>
          <Link
            href="/projects/new"
            className="inline-block mt-6 rounded-xl bg-white text-black px-5 py-2 text-sm font-medium hover:bg-zinc-200"
          >
            Create your first book
          </Link>
        </div>
      )}

      <ul className="grid gap-3">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="block rounded-2xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-2">
                    <span className="uppercase tracking-wider">{p.status}</span>
                    {p.current_step && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5">
                        {p.current_step}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {p.title || p.working_title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{p.idea}</p>
                </div>
                <div className="text-right text-xs text-zinc-500 whitespace-nowrap">
                  <div>{new Date(p.created_at).toLocaleString()}</div>
                  <div className="mt-1">
                    {p.language.toUpperCase()} · {p.market}
                  </div>
                  <div className="mt-1 font-mono">
                    ${p.cost.usd.toFixed(3)} · {(p.cost.tokens_in + p.cost.tokens_out).toLocaleString()} tok
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
