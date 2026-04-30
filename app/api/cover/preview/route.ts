import { NextResponse } from "next/server";
import { computePaperback, ebookPreset, type PaperbackInput } from "@/lib/cover/dimensions";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  if (body?.kind === "ebook") {
    return NextResponse.json(ebookPreset());
  }
  if (body?.kind === "paperback") {
    try {
      return NextResponse.json(computePaperback(body.paperback as PaperbackInput));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "kind required" }, { status: 400 });
}
