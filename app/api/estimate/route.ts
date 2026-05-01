import { NextResponse } from "next/server";
import { estimateBook } from "@/lib/estimate";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const words = Number(body?.estimatedWords) || 30000;
  const chapters = body?.estimatedChapters ? Number(body.estimatedChapters) : undefined;
  return NextResponse.json(estimateBook({ estimatedWords: words, estimatedChapters: chapters }));
}
