import { NextResponse } from "next/server";
import { Projects } from "@/lib/db/models";
import { retrieveKnowledge } from "@/lib/agents/retrieval";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const idea = String(body?.idea || "").trim();
  if (!idea) return NextResponse.json({ similar: [], duplicates: [] });

  const hits = await retrieveKnowledge(idea, { topK: 12 });
  const projects = Projects.list();

  const groups = new Map<string, { score: number; samples: { kind: string; title: string | null; content: string }[] }>();
  for (const h of hits) {
    if (!h.item.project_id) continue;
    const g = groups.get(h.item.project_id) || { score: 0, samples: [] };
    g.score = Math.max(g.score, h.score);
    if (g.samples.length < 3) {
      g.samples.push({ kind: h.item.kind, title: h.item.title, content: h.item.content.slice(0, 240) });
    }
    groups.set(h.item.project_id, g);
  }

  const similar = Array.from(groups.entries())
    .map(([projectId, info]) => {
      const p = projects.find((x) => x.id === projectId);
      if (!p) return null;
      return {
        id: p.id,
        title: p.title || p.working_title,
        idea: p.idea,
        score: info.score,
        samples: info.samples
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.score - a!.score));

  // Duplicates = high similarity (threshold)
  const duplicates = similar.filter((s) => s!.score >= 0.78);

  return NextResponse.json({ similar, duplicates });
}
