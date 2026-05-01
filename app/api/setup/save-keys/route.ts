import { NextResponse } from "next/server";
import { Settings } from "@/lib/db/state";

export const runtime = "nodejs";

interface Body {
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Body;
  const patch: Record<string, string | null> = {};
  if (typeof body.openaiKey === "string") patch.openai_key_override = body.openaiKey || null;
  if (typeof body.anthropicKey === "string") patch.anthropic_key_override = body.anthropicKey || null;
  if (typeof body.geminiKey === "string") patch.gemini_key_override = body.geminiKey || null;
  Settings.patch(patch as never);
  return NextResponse.json({ ok: true });
}
