import { NextResponse } from "next/server";
import { Projects, Costs } from "@/lib/db/models";
import { ensureProjectQuota } from "@/lib/license/guards";
import { projectQuotaStatus } from "@/lib/license/store";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const list = Projects.list().map((p) => ({
    ...p,
    cost: Costs.totals(p.id)
  }));
  return NextResponse.json({
    projects: list,
    quota: projectQuotaStatus()
  });
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  if (!body?.workingTitle || !body?.idea) {
    return NextResponse.json({ error: "workingTitle and idea are required" }, { status: 400 });
  }
  const guard = ensureProjectQuota();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error, hint: guard.hint }, { status: guard.status });
  }
  const project = Projects.create({
    workingTitle: String(body.workingTitle),
    idea: String(body.idea),
    language: body.language || "en",
    market: body.market || "US",
    tone: body.tone || undefined,
    estimatedWords: body.estimatedWords ? Number(body.estimatedWords) : undefined,
    referenceBooks: Array.isArray(body.referenceBooks) ? body.referenceBooks : [],
    seriesId: body.seriesId || null
  });
  return NextResponse.json(project);
}
