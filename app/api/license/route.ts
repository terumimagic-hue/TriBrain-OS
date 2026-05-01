import { NextResponse } from "next/server";
import { getActiveLicense, projectQuotaStatus, deactivateLicense } from "@/lib/license/store";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const active = getActiveLicense();
  const quota = projectQuotaStatus();
  return NextResponse.json({
    active: active.license
      ? {
          plan: active.plan.id,
          plan_label: active.plan.label,
          status: active.license.status,
          source: active.license.source,
          customer_email: active.license.customer_email,
          activated_at: active.license.activated_at,
          expires_at: active.license.expires_at,
          monthly_project_limit: active.plan.monthlyProjectLimit,
          features: {
            aiCoverGen: active.plan.aiCoverGen,
            zipExport: active.plan.zipExport,
            docxExport: active.plan.docxExport,
            paperbackPdf: active.plan.paperbackPdf,
            knowledgeBase: active.plan.knowledgeBase
          }
        }
      : null,
    plan: active.plan,
    reason: active.reason,
    quota
  });
}

export async function DELETE(): Promise<Response> {
  deactivateLicense();
  return NextResponse.json({ ok: true });
}
