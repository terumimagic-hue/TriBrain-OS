import { NextResponse } from "next/server";
import { Settings, type AppSettingsRow } from "@/lib/db/state";

export const runtime = "nodejs";

const ALLOWED: (keyof AppSettingsRow)[] = [
  "default_author",
  "default_language",
  "default_market",
  "default_tone",
  "default_trim_w",
  "default_trim_h",
  "default_paper_type",
  "cost_limit_monthly_usd",
  "openai_model",
  "anthropic_model",
  "gemini_model",
  "embedding_model",
  "openai_key_override",
  "anthropic_key_override",
  "gemini_key_override",
  "synthesis_provider",
  "demo_mode"
];

export async function GET(): Promise<Response> {
  const s = Settings.get();
  // Mask key overrides in the GET payload
  return NextResponse.json({
    ...s,
    openai_key_override: s.openai_key_override ? mask(s.openai_key_override) : null,
    anthropic_key_override: s.anthropic_key_override ? mask(s.anthropic_key_override) : null,
    gemini_key_override: s.gemini_key_override ? mask(s.gemini_key_override) : null,
    has_openai_override: !!s.openai_key_override,
    has_anthropic_override: !!s.anthropic_key_override,
    has_gemini_override: !!s.gemini_key_override
  });
}

export async function PATCH(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in body) patch[k] = body[k];
  }
  Settings.patch(patch as never);
  return NextResponse.json({ ok: true });
}

function mask(s: string): string {
  if (s.length <= 8) return "•".repeat(s.length);
  return s.slice(0, 4) + "•".repeat(Math.max(8, s.length - 8)) + s.slice(-4);
}
