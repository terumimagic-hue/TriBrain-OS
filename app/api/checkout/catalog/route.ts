import { NextResponse } from "next/server";
import { priceCatalog, stripeConfigured } from "@/lib/license/stripe";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return NextResponse.json({
    stripeConfigured: stripeConfigured(),
    prices: priceCatalog().map((p) => ({ priceId: p.priceId, plan: p.plan, lifetime: p.lifetime, label: p.label }))
  });
}
