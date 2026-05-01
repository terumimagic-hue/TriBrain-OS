import { NextResponse } from "next/server";
import { getStripe, stripeConfigured, findPrice } from "@/lib/license/stripe";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const priceId = String(body?.priceId || "").trim();
  if (!priceId) return NextResponse.json({ error: "priceId required" }, { status: 400 });
  if (!stripeConfigured()) {
    return NextResponse.json({
      error: "Stripe not configured. Set STRIPE_SECRET_KEY and price-id env vars."
    }, { status: 400 });
  }
  const cfg = findPrice(priceId);
  if (!cfg) return NextResponse.json({ error: "unknown priceId" }, { status: 400 });

  const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: cfg.lifetime ? "payment" : "subscription",
    line_items: [{ price: cfg.priceId, quantity: 1 }],
    metadata: { plan: cfg.plan, lifetime: cfg.lifetime ? "1" : "0" },
    success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: "auto"
  });
  return NextResponse.json({ url: session.url, id: session.id });
}
