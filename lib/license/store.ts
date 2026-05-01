import { getDB, newId } from "../db/client";
import { AppState } from "../db/state";
import { getPlan, type PlanId, type PlanFeatures } from "./plans";
import { issueLicense, parseLicense, type IssueOptions } from "./sign";

export interface LicenseRow {
  id: string;
  key: string;
  plan: PlanId;
  status: "active" | "expired" | "revoked";
  source: "manual" | "stripe" | "trial";
  customer_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  monthly_project_limit: number | null;
  expires_at: string | null;
  activated_at: string | null;
  notes: string | null;
  created_at: string;
}

export const Licenses = {
  insert(opts: {
    key: string;
    plan: PlanId;
    source: "manual" | "stripe" | "trial";
    customerEmail?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePaymentIntentId?: string | null;
    expiresAt?: string | null;
    notes?: string | null;
  }): LicenseRow {
    const db = getDB();
    const id = newId("lic");
    const plan = getPlan(opts.plan);
    db.prepare(
      `INSERT INTO license_key
        (id, key, plan, source, customer_email, stripe_customer_id, stripe_subscription_id, stripe_payment_intent_id, monthly_project_limit, expires_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      opts.key,
      opts.plan,
      opts.source,
      opts.customerEmail ?? null,
      opts.stripeCustomerId ?? null,
      opts.stripeSubscriptionId ?? null,
      opts.stripePaymentIntentId ?? null,
      plan.monthlyProjectLimit,
      opts.expiresAt ?? null,
      opts.notes ?? null
    );
    return Licenses.byKey(opts.key)!;
  },
  byKey(key: string): LicenseRow | null {
    return (getDB().prepare("SELECT * FROM license_key WHERE key = ?").get(key) as LicenseRow) ?? null;
  },
  byStripeSubscription(subId: string): LicenseRow | null {
    return (getDB().prepare("SELECT * FROM license_key WHERE stripe_subscription_id = ?").get(subId) as LicenseRow) ?? null;
  },
  list(): LicenseRow[] {
    return getDB().prepare("SELECT * FROM license_key ORDER BY created_at DESC").all() as LicenseRow[];
  },
  setStatus(key: string, status: LicenseRow["status"]): void {
    getDB().prepare("UPDATE license_key SET status = ? WHERE key = ?").run(status, key);
  },
  setActivated(key: string): void {
    getDB().prepare("UPDATE license_key SET activated_at = datetime('now') WHERE key = ? AND activated_at IS NULL")
      .run(key);
  },
  remove(key: string): void {
    getDB().prepare("DELETE FROM license_key WHERE key = ?").run(key);
  }
};

export interface ActiveLicense {
  license: LicenseRow | null;
  plan: PlanFeatures;
  reason?: string;
}

const ACTIVE_KEY = "active_license_key";

export function getActiveLicense(): ActiveLicense {
  const k = AppState.get(ACTIVE_KEY);
  if (!k) return { license: null, plan: getPlan("free"), reason: "no license activated" };
  const row = Licenses.byKey(k);
  if (!row) return { license: null, plan: getPlan("free"), reason: "license not found" };
  if (row.status !== "active") return { license: row, plan: getPlan("free"), reason: `license ${row.status}` };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    Licenses.setStatus(row.key, "expired");
    return { license: row, plan: getPlan("free"), reason: "license expired" };
  }
  return { license: row, plan: getPlan(row.plan) };
}

export function activateLicenseKey(key: string): { ok: true; license: LicenseRow } | { ok: false; error: string } {
  const parsed = parseLicense(key);
  if (!parsed.ok) return { ok: false, error: parsed.reason };

  let row = Licenses.byKey(parsed.raw);
  if (!row) {
    // First time we see this signed key — accept and record it as a manual activation.
    row = Licenses.insert({
      key: parsed.raw,
      plan: parsed.plan,
      source: "manual",
      expiresAt: parsed.expiresAt ? parsed.expiresAt.toISOString() : null
    });
  }
  if (row.status !== "active") {
    return { ok: false, error: `license is ${row.status}` };
  }
  Licenses.setActivated(row.key);
  AppState.set(ACTIVE_KEY, row.key);
  return { ok: true, license: row };
}

export function deactivateLicense(): void {
  AppState.del(ACTIVE_KEY);
}

export function issueAndStore(opts: IssueOptions & {
  source?: "manual" | "stripe" | "trial";
  customerEmail?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePaymentIntentId?: string | null;
  notes?: string | null;
}): LicenseRow {
  const key = issueLicense(opts);
  return Licenses.insert({
    key,
    plan: opts.plan,
    source: opts.source ?? "manual",
    customerEmail: opts.customerEmail,
    stripeCustomerId: opts.stripeCustomerId,
    stripeSubscriptionId: opts.stripeSubscriptionId,
    stripePaymentIntentId: opts.stripePaymentIntentId,
    expiresAt: opts.expiresAt ? opts.expiresAt.toISOString() : null,
    notes: opts.notes
  });
}

export function projectsCreatedThisMonth(): number {
  const row = getDB().prepare(
    `SELECT COUNT(*) AS n FROM book_project
     WHERE created_at >= date('now', 'start of month')`
  ).get() as { n: number };
  return row.n;
}

export interface QuotaStatus {
  plan: PlanFeatures;
  used: number;
  limit: number;        // 0 = unlimited
  remaining: number | null; // null when unlimited
  exceeded: boolean;
}

export function projectQuotaStatus(): QuotaStatus {
  const { plan } = getActiveLicense();
  const used = projectsCreatedThisMonth();
  const limit = plan.monthlyProjectLimit;
  const remaining = limit === 0 ? null : Math.max(0, limit - used);
  const exceeded = limit !== 0 && used >= limit;
  return { plan, used, limit, remaining, exceeded };
}
