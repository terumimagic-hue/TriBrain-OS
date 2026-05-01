import { NextResponse } from "next/server";
import { AppState } from "@/lib/db/state";
import { getActiveLicense } from "@/lib/license/store";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const onboarded = AppState.get("onboarded") === "1";
  const installId = AppState.get("install_id");
  const active = getActiveLicense();
  return NextResponse.json({
    onboarded,
    installId,
    hasLicense: Boolean(active.license),
    plan: active.plan.id
  });
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  if (body?.markOnboarded) {
    AppState.set("onboarded", "1");
  }
  if (body?.installId) {
    AppState.set("install_id", String(body.installId));
  }
  return NextResponse.json({ ok: true });
}
