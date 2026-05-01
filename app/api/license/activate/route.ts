import { NextResponse } from "next/server";
import { activateLicenseKey } from "@/lib/license/store";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || "").trim();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const result = activateLicenseKey(key);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, plan: result.license.plan, key: result.license.key });
}
