import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/license/stripe";
import { getActiveLicense } from "@/lib/license/store";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }
  const active = getActiveLicense();
  const customerId = active.license?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "no Stripe customer linked to active license" }, { status: 400 });
  }
  const origin = req.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/billing`
  });
  return NextResponse.json({ url: session.url });
}
