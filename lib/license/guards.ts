import { getDB } from "../db/client";
import { Settings } from "../db/state";
import { getActiveLicense, projectQuotaStatus } from "./store";

export interface GuardOk { ok: true; }
export interface GuardErr { ok: false; status: number; error: string; hint?: string; }
export type GuardResult = GuardOk | GuardErr;

export function ensureProjectQuota(): GuardResult {
  const q = projectQuotaStatus();
  if (q.exceeded) {
    return {
      ok: false,
      status: 402,
      error: `Monthly project limit reached on the ${q.plan.label} plan (${q.used}/${q.limit}).`,
      hint: "Upgrade your plan or wait until next month."
    };
  }
  return { ok: true };
}

export function ensureFeature(flag: keyof ReturnType<typeof flagsForActive>): GuardResult {
  const flags = flagsForActive();
  if (flags[flag]) return { ok: true };
  return {
    ok: false,
    status: 402,
    error: `This action is not available on your current plan.`,
    hint: "Upgrade to enable this feature."
  };
}

function flagsForActive() {
  const { plan } = getActiveLicense();
  return {
    aiCoverGen: plan.aiCoverGen,
    zipExport: plan.zipExport,
    docxExport: plan.docxExport,
    paperbackPdf: plan.paperbackPdf,
    knowledgeBase: plan.knowledgeBase
  };
}

export function ensureCostBelowLimit(): GuardResult {
  const limit = Settings.get().cost_limit_monthly_usd || 0;
  if (limit <= 0) return { ok: true };
  const row = getDB().prepare(
    `SELECT COALESCE(SUM(estimated_usd), 0) AS usd FROM cost_log
     WHERE created_at >= date('now', 'start of month')`
  ).get() as { usd: number };
  if (row.usd >= limit) {
    return {
      ok: false,
      status: 402,
      error: `Monthly cost limit reached: $${row.usd.toFixed(2)} of $${limit.toFixed(2)}.`,
      hint: "Increase the limit in Settings or wait until next month."
    };
  }
  return { ok: true };
}

export interface CostStatus {
  monthlyUsed: number;
  monthlyLimit: number;
  remaining: number | null;
  exceeded: boolean;
}

export function costStatus(): CostStatus {
  const limit = Settings.get().cost_limit_monthly_usd || 0;
  const row = getDB().prepare(
    `SELECT COALESCE(SUM(estimated_usd), 0) AS usd FROM cost_log
     WHERE created_at >= date('now', 'start of month')`
  ).get() as { usd: number };
  const used = row.usd;
  return {
    monthlyUsed: used,
    monthlyLimit: limit,
    remaining: limit > 0 ? Math.max(0, limit - used) : null,
    exceeded: limit > 0 && used >= limit
  };
}
