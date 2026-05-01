export type PlanId = "free" | "starter" | "pro" | "studio";

export interface PlanFeatures {
  id: PlanId;
  label: string;
  monthlyProjectLimit: number;       // 0 = unlimited
  aiCoverGen: boolean;
  zipExport: boolean;
  docxExport: boolean;
  paperbackPdf: boolean;
  knowledgeBase: boolean;
  prioritySupport: boolean;
  recurring: boolean;                 // is this a subscription plan?
  lifetimeOption: boolean;            // available as one-time lifetime?
  pricingHint: { lifetime?: string; monthly?: string };
}

export const PLANS: Record<PlanId, PlanFeatures> = {
  free: {
    id: "free",
    label: "Free",
    monthlyProjectLimit: 1,
    aiCoverGen: false,
    zipExport: false,
    docxExport: true,
    paperbackPdf: false,
    knowledgeBase: true,
    prioritySupport: false,
    recurring: false,
    lifetimeOption: false,
    pricingHint: {}
  },
  starter: {
    id: "starter",
    label: "Starter",
    monthlyProjectLimit: 5,
    aiCoverGen: true,
    zipExport: true,
    docxExport: true,
    paperbackPdf: true,
    knowledgeBase: true,
    prioritySupport: false,
    recurring: true,
    lifetimeOption: true,
    pricingHint: { lifetime: "¥49,800", monthly: "¥9,800" }
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyProjectLimit: 20,
    aiCoverGen: true,
    zipExport: true,
    docxExport: true,
    paperbackPdf: true,
    knowledgeBase: true,
    prioritySupport: true,
    recurring: true,
    lifetimeOption: true,
    pricingHint: { lifetime: "¥98,000", monthly: "¥29,800" }
  },
  studio: {
    id: "studio",
    label: "Studio",
    monthlyProjectLimit: 0,
    aiCoverGen: true,
    zipExport: true,
    docxExport: true,
    paperbackPdf: true,
    knowledgeBase: true,
    prioritySupport: true,
    recurring: true,
    lifetimeOption: true,
    pricingHint: { lifetime: "Contact" }
  }
};

export function getPlan(id: string | null | undefined): PlanFeatures {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}
