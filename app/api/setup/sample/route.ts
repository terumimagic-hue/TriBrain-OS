import { NextResponse } from "next/server";
import { Projects, Series } from "@/lib/db/models";
import { ensureProjectQuota } from "@/lib/license/guards";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const guard = ensureProjectQuota();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error, hint: guard.hint }, { status: guard.status });
  }
  // Reuse a sample series if one exists, else create
  const existing = Series.list().find((s) => s.name === "BookBrain Demo Series");
  const series = existing ?? Series.create(
    "BookBrain Demo Series",
    "Demo series shipped with BookBrain OS.",
    "direct, no-fluff, evidence-based",
    { reader_address: "you", second_person: true }
  );
  const project = Projects.create({
    workingTitle: "Tribrain — How three minds beat one",
    idea: "A short, evidence-based book arguing that combining three specialized AI agents (research, drafting, editorial) outperforms any single model. Aimed at solo founders, knowledge workers, and writers. Tone: no-fluff, direct, with concrete patterns and code-level examples.",
    language: "en",
    market: "US",
    tone: "direct, no-fluff, second person",
    estimatedWords: 22000,
    referenceBooks: ["Atomic Habits", "Show Your Work!", "The Lean Startup"],
    seriesId: series.id
  });
  return NextResponse.json({ project });
}
