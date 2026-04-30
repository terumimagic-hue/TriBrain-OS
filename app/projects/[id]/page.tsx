"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PipelineSteps from "@/components/PipelineSteps";
import CoverStudio from "@/components/CoverStudio";

interface BookProjectRow {
  id: string;
  user_id: number;
  series_id: string | null;
  title: string | null;
  working_title: string;
  idea: string;
  language: string;
  market: string;
  tone: string | null;
  estimated_words: number | null;
  reference_books: string | null;
  status: "created" | "running" | "done" | "error";
  current_step: string | null;
  created_at: string;
  updated_at: string;
}
interface AgentRunRow {
  id: string;
  project_id: string;
  step: string;
  agent: string;
  status: "pending" | "running" | "done" | "error";
  attempt: number;
  input: string | null;
  output: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}
interface ChapterRow {
  id: string;
  project_id: string;
  position: number;
  heading: string;
  role: string | null;
  outline: string | null;
  target_words: number | null;
  draft: string | null;
  revised: string | null;
  status: "pending" | "drafted" | "edited" | "revised";
  word_count: number | null;
}
interface EditorialNoteRow {
  id: string;
  project_id: string;
  chapter_id: string | null;
  category: string;
  severity: "low" | "medium" | "high";
  text: string;
  suggested_fix: string | null;
}
interface KdpRow {
  id: string;
  project_id: string;
  title: string | null;
  subtitle: string | null;
  romanized_title: string | null;
  furigana: string | null;
  author_bio: string | null;
  description: string | null;
  keywords: string | null;
  categories: string | null;
  pricing: string | null;
  kindle_select: number | null;
  aplus_content: string | null;
  launch_copy: string | null;
  social_posts: string | null;
  cover_prompt: string | null;
}
interface ResearchNoteRow {
  id: string;
  project_id: string;
  market_demand: string | null;
  competing_books: string | null;
  reader_pain_points: string | null;
  search_intent: string | null;
  context_notes: string | null;
  unique_angle: string | null;
  credibility_notes: string | null;
  risk_notes: string | null;
  raw: string | null;
}
interface SourceRefRow {
  id: string;
  project_id: string;
  title: string | null;
  url: string | null;
  citation: string | null;
  notes: string | null;
}
interface ExportFileRow {
  id: string;
  project_id: string;
  kind: string;
  path: string;
  bytes: number | null;
  created_at: string;
}

interface ProjectData {
  project: BookProjectRow;
  research: ResearchNoteRow | null;
  chapters: ChapterRow[];
  editorial: EditorialNoteRow[];
  kdp: KdpRow | null;
  kdp_keywords: string[];
  kdp_categories: string[];
  kdp_pricing: Record<string, number>;
  sources: SourceRefRow[];
  runs: AgentRunRow[];
  cost: { tokens_in: number; tokens_out: number; usd: number };
  exports: ExportFileRow[];
  manuscripts: { id: string; label: string; word_count: number | null; created_at: string }[];
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [tab, setTab] = useState<"pipeline" | "manuscript" | "kdp" | "research" | "cover" | "exports">("pipeline");

  const refresh = useCallback(async () => {
    const r = await fetch(`/api/projects/${params.id}`, { cache: "no-store" });
    if (!r.ok) return;
    setData(await r.json());
  }, [params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return <main className="p-10 text-zinc-500">Loading…</main>;
  const { project, chapters, kdp, research, editorial, exports: exp, runs, cost, kdp_keywords, kdp_categories, kdp_pricing } = data;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← All books
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title || project.working_title}</h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">{project.idea}</p>
          </div>
          <div className="text-right text-xs text-zinc-500 whitespace-nowrap">
            <div>Status: <span className="text-zinc-300 uppercase">{project.status}</span></div>
            <div className="font-mono mt-1">${cost.usd.toFixed(3)} · {(cost.tokens_in + cost.tokens_out).toLocaleString()} tok</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 mb-6">
        {[
          { id: "pipeline", label: "Pipeline" },
          { id: "manuscript", label: `Manuscript (${chapters.length})` },
          { id: "kdp", label: "KDP" },
          { id: "research", label: "Research" },
          { id: "cover", label: "Cover Studio" },
          { id: "exports", label: `Exports (${exp.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={
              "px-4 py-2 text-sm transition border-b-2 -mb-px " +
              (tab === t.id
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pipeline" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <PipelineSteps projectId={project.id} runs={runs} onRefresh={refresh} />
          <div className="space-y-3">
            <Card title="Cost">
              <div className="space-y-1 text-sm font-mono">
                <Row label="Estimated USD">${cost.usd.toFixed(4)}</Row>
                <Row label="Tokens in">{cost.tokens_in.toLocaleString()}</Row>
                <Row label="Tokens out">{cost.tokens_out.toLocaleString()}</Row>
              </div>
            </Card>
            <Card title="Recent runs">
              <ul className="space-y-2 text-xs">
                {runs.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span>{r.step} <span className="text-zinc-500">· {r.agent}</span></span>
                    <span className={
                      r.status === "done" ? "text-emerald-400"
                      : r.status === "error" ? "text-red-400"
                      : "text-amber-400"
                    }>{r.status}</span>
                  </li>
                ))}
                {runs.length === 0 && <li className="text-zinc-500">No runs yet.</li>}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "manuscript" && (
        <div className="space-y-4">
          {chapters.length === 0 && (
            <div className="rounded-xl border border-zinc-800 p-6 text-zinc-400 text-sm">
              No chapters yet. Run Structure to generate the table of contents.
            </div>
          )}
          {chapters.map((c) => (
            <details key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <summary className="cursor-pointer">
                <span className="text-zinc-500 text-xs mr-2">Ch {c.position}</span>
                <span className="font-medium">{c.heading}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  · {c.role || ""} · {c.word_count ?? 0} words · {c.status}
                </span>
              </summary>
              <div className="mt-3 markdown text-sm text-zinc-200 whitespace-pre-wrap">
                {c.revised || c.draft || c.outline || "(not drafted yet)"}
              </div>
            </details>
          ))}
        </div>
      )}

      {tab === "kdp" && (
        <div className="space-y-4">
          {!kdp && (
            <div className="rounded-xl border border-zinc-800 p-6 text-zinc-400 text-sm">
              KDP package not generated yet. Run the KDP Package step.
            </div>
          )}
          {kdp && (
            <>
              <Card title="Title">
                <div className="text-lg font-semibold">{kdp.title}</div>
                <div className="text-zinc-400">{kdp.subtitle}</div>
                {kdp.romanized_title && <div className="text-xs text-zinc-500 mt-1">romaji: {kdp.romanized_title}</div>}
                {kdp.furigana && <div className="text-xs text-zinc-500">furigana: {kdp.furigana}</div>}
              </Card>
              <Card title="Description">
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans">{kdp.description}</pre>
              </Card>
              <div className="grid gap-3 md:grid-cols-2">
                <Card title="Keywords (7)">
                  <ul className="text-sm space-y-1">
                    {kdp_keywords.map((k, i) => <li key={i}>{i + 1}. {k}</li>)}
                  </ul>
                </Card>
                <Card title="Categories">
                  <ul className="text-sm space-y-1">
                    {kdp_categories.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </Card>
              </div>
              <Card title="Pricing">
                <pre className="text-sm font-mono text-zinc-200">
                  {JSON.stringify(kdp_pricing, null, 2)}
                </pre>
                <div className="text-xs text-zinc-500 mt-2">Kindle Select: {kdp.kindle_select ? "yes" : "no"}</div>
              </Card>
              <Card title="Author bio">
                <p className="text-sm text-zinc-200">{kdp.author_bio}</p>
              </Card>
              <Card title="A+ content">
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans">{kdp.aplus_content}</pre>
              </Card>
              <Card title="Cover prompt">
                <p className="text-sm text-zinc-200">{kdp.cover_prompt}</p>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "research" && (
        <div className="space-y-4">
          {!research && (
            <div className="rounded-xl border border-zinc-800 p-6 text-zinc-400 text-sm">
              No research yet.
            </div>
          )}
          {research && (
            <>
              <Card title="Unique angle">{research.unique_angle}</Card>
              <Card title="Market demand">{research.market_demand}</Card>
              <Card title="Reader pain points">
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans">{research.reader_pain_points}</pre>
              </Card>
              <Card title="Risk notes">{research.risk_notes}</Card>
              <Card title="Sources">
                <ul className="text-sm space-y-1">
                  {data.sources.length === 0 && <li className="text-zinc-500">none</li>}
                  {data.sources.map((s) => (
                    <li key={s.id}>
                      {s.title || s.citation || s.url}
                      {s.url && <> — <a className="underline text-zinc-300" href={s.url} target="_blank">{s.url}</a></>}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title={`Editorial notes (${editorial.length})`}>
                <ul className="text-sm space-y-2">
                  {editorial.slice(0, 30).map((e) => (
                    <li key={e.id}>
                      <span className="text-xs uppercase tracking-wider text-zinc-500">[{e.severity}/{e.category}]</span>{" "}
                      {e.text}
                      {e.suggested_fix && <div className="text-zinc-400 ml-3">→ {e.suggested_fix}</div>}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "cover" && <CoverStudio projectId={project.id} />}

      {tab === "exports" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          {exp.length === 0 && (
            <div className="text-zinc-400 text-sm">No exports yet. Run the Export step.</div>
          )}
          <ul className="space-y-2">
            {exp.map((e) => {
              const file = e.path.split(/[\\/]/).pop() || e.path;
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-zinc-500 mr-2">{e.kind}</span>
                    <span className="font-mono">{file}</span>
                  </div>
                  <a
                    href={`/api/projects/${project.id}/exports/${encodeURIComponent(file)}`}
                    className="text-xs rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-900"
                  >
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span>{children}</span>
    </div>
  );
}
