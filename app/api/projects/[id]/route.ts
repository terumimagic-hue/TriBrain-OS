import { NextResponse } from "next/server";
import {
  Projects,
  AgentRuns,
  Chapters,
  ResearchNotes,
  EditorialNotes,
  Kdp,
  Manuscripts,
  Sources,
  Costs,
  Exports,
  J
} from "@/lib/db/models";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  Projects.remove(project.id);
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const research = ResearchNotes.byProject(project.id);
  const chapters = Chapters.byProject(project.id);
  const editorial = EditorialNotes.byProject(project.id);
  const kdp = Kdp.byProject(project.id);
  const sources = Sources.byProject(project.id);
  const runs = AgentRuns.byProject(project.id);
  const cost = Costs.totals(project.id);
  const exports = Exports.byProject(project.id);
  const manuscripts = Manuscripts.byProject(project.id).map((m) => ({
    id: m.id,
    label: m.label,
    word_count: m.word_count,
    created_at: m.created_at
  }));
  return NextResponse.json({
    project,
    research,
    chapters,
    editorial,
    kdp,
    kdp_keywords: kdp ? J.parse<string[]>(kdp.keywords, []) : [],
    kdp_categories: kdp ? J.parse<string[]>(kdp.categories, []) : [],
    kdp_pricing: kdp ? J.parse<unknown>(kdp.pricing, {}) : {},
    sources,
    runs,
    cost,
    exports,
    manuscripts
  });
}
