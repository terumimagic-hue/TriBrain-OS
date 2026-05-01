import { NextResponse } from "next/server";
import { issueAndStore } from "@/lib/license/store";
import type { PlanId } from "@/lib/license/plans";

export const runtime = "nodejs";

// Admin-only: gated by BOOKBRAIN_ADMIN_TOKEN env var.
// Use this to mint license keys outside Stripe (manual sales, support).
export async function POST(req: Request): Promise<Response> {
  const expected = process.env.BOOKBRAIN_ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "BOOKBRAIN_ADMIN_TOKEN not configured" }, { status: 403 });
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const plan = body?.plan as PlanId | undefined;
  if (!plan || !["free", "starter", "pro", "studio"].includes(plan)) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }
  const lifetime = body?.lifetime !== false;
  const expiresAt = lifetime ? null : (body?.expiresAt ? new Date(body.expiresAt) : null);
  const license = issueAndStore({
    plan,
    expiresAt: expiresAt ?? null,
    source: "manual",
    customerEmail: body?.email || null,
    notes: body?.notes || null
  });
  return NextResponse.json({ key: license.key, plan: license.plan, expires_at: license.expires_at });
}
