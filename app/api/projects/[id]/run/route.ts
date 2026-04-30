import { NextResponse } from "next/server";
import { runStep, runFullPipeline } from "@/lib/pipeline/runner";
import type { StepId } from "@/lib/pipeline/steps";

export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const step = body?.step as StepId | "all" | undefined;
  if (!step) {
    return NextResponse.json({ error: "step is required" }, { status: 400 });
  }
  try {
    if (step === "all") {
      const results = await runFullPipeline(params.id);
      return NextResponse.json({ ok: results.every((r) => r.ok), results });
    }
    const r = await runStep(params.id, step);
    return NextResponse.json(r, { status: r.ok ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
