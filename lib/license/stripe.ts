import Stripe from "stripe";
import type { PlanId } from "./plans";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key);
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Mapping from Stripe price IDs (env vars) to plan + lifetime/subscription
export interface PriceConfig {
  priceId: string;
  plan: PlanId;
  lifetime: boolean;
  label: string;
}

export function priceCatalog(): PriceConfig[] {
  const c: PriceConfig[] = [];
  const add = (envName: string, plan: PlanId, lifetime: boolean, label: string) => {
    const id = process.env[envName];
    if (id) c.push({ priceId: id, plan, lifetime, label });
  };
  add("STRIPE_PRICE_STARTER_LIFETIME", "starter", true, "Starter — Lifetime");
  add("STRIPE_PRICE_STARTER_MONTHLY", "starter", false, "Starter — Monthly");
  add("STRIPE_PRICE_PRO_LIFETIME", "pro", true, "Pro — Lifetime");
  add("STRIPE_PRICE_PRO_MONTHLY", "pro", false, "Pro — Monthly");
  add("STRIPE_PRICE_STUDIO_LIFETIME", "studio", true, "Studio — Lifetime");
  add("STRIPE_PRICE_STUDIO_MONTHLY", "studio", false, "Studio — Monthly");
  return c;
}

export function findPrice(priceId: string): PriceConfig | null {
  return priceCatalog().find((p) => p.priceId === priceId) ?? null;
}
