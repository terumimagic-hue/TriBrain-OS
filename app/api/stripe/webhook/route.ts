import { NextResponse } from "next/server";
import { getStripe, findPrice } from "@/lib/license/stripe";
import { issueAndStore, Licenses } from "@/lib/license/store";
import type Stripe from "stripe";

export const runtime = "nodejs";
// Stripe webhooks need the raw body; opt out of Next.js parsing via streaming text
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "missing stripe-signature or STRIPE_WEBHOOK_SECRET" }, { status: 400 });
  }
  const raw = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `signature verification failed: ${(err as Error).message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      // Find the price used (subscription or one-time)
      let priceId: string | null = null;
      let lifetime = s.mode === "payment";
      try {
        const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 1 });
        priceId = items.data[0]?.price?.id ?? null;
      } catch {}
      if (!priceId && s.metadata?.priceId) priceId = String(s.metadata.priceId);
      const cfg = priceId ? findPrice(priceId) : null;
      const plan = (cfg?.plan ?? (s.metadata?.plan as never)) || "starter";
      lifetime = cfg?.lifetime ?? lifetime;
      const expiresAt = lifetime ? null : guessNextRenewal(30);
      const customerObjEmail =
        s.customer && typeof s.customer !== "string" && !("deleted" in s.customer)
          ? (s.customer as { email?: string | null }).email ?? null
          : null;
      const license = issueAndStore({
        plan,
        expiresAt,
        source: "stripe",
        customerEmail: s.customer_details?.email || customerObjEmail || null,
        stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
        stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null,
        stripePaymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : null,
        notes: `checkout.session ${s.id}`
      });
      // Best-effort: deliver the license key via Stripe customer email metadata
      if (typeof s.customer === "string") {
        try {
          await stripe.customers.update(s.customer, {
            metadata: { bookbrain_license_key: license.key }
          });
        } catch {}
      }
      return NextResponse.json({ received: true, license_issued: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const lic = Licenses.byStripeSubscription(sub.id);
      if (lic) Licenses.setStatus(lic.key, "expired");
      return NextResponse.json({ received: true, marked_expired: !!lic });
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const lic = Licenses.byStripeSubscription(sub.id);
      if (!lic) return NextResponse.json({ received: true });
      const newStatus = sub.status === "active" || sub.status === "trialing" ? "active"
        : sub.status === "canceled" || sub.status === "incomplete_expired" ? "expired"
        : lic.status;
      if (newStatus !== lic.status) Licenses.setStatus(lic.key, newStatus as never);
      return NextResponse.json({ received: true });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function guessNextRenewal(days: number): Date {
  return new Date(Date.now() + days * 24 * 3600 * 1000);
}
