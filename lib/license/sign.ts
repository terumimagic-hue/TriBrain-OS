import crypto from "node:crypto";
import type { PlanId } from "./plans";

const DEFAULT_SECRET = "bookbrain-os-default-license-secret-change-me";

function secret(): string {
  return process.env.BOOKBRAIN_LICENSE_SECRET || DEFAULT_SECRET;
}

const PLAN_LETTER: Record<PlanId, string> = {
  free: "F",
  starter: "S",
  pro: "P",
  studio: "T"
};

const LETTER_TO_PLAN: Record<string, PlanId> = {
  F: "free",
  S: "starter",
  P: "pro",
  T: "studio"
};

// Base32-ish RFC4648 (no padding, no easily-confused chars)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(n: number): string {
  const buf = crypto.randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

function hmacBlock(body: string, len: number): string {
  const h = crypto.createHmac("sha256", secret()).update(body).digest();
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[h[i] % ALPHABET.length];
  }
  return out;
}

// Format: BBOS-<plan>-<expiry6>-<random14>-<sig8>
// expiry6: zero-padded YY/DDD julian date or "LIFE0X" for lifetime
export interface IssueOptions {
  plan: PlanId;
  expiresAt?: Date | null;            // null/undefined = lifetime
}

export interface ParsedLicense {
  ok: true;
  plan: PlanId;
  expiresAt: Date | null;
  raw: string;
}
export interface InvalidLicense {
  ok: false;
  reason: string;
}

function expiryBlock(expiresAt?: Date | null): string {
  if (!expiresAt) return "LIFE0X";
  // YYYYMM (6 chars). Good through year 9999.
  const y = expiresAt.getUTCFullYear();
  const m = String(expiresAt.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function parseExpiry(block: string): Date | null | "invalid" {
  if (!block || block.length !== 6) return "invalid";
  if (block === "LIFE0X") return null;
  if (!/^\d{6}$/.test(block)) return "invalid";
  const y = Number(block.slice(0, 4));
  const m = Number(block.slice(4, 6));
  if (m < 1 || m > 12) return "invalid";
  // expires at end of that month
  const d = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  return d;
}

export function issueLicense(opts: IssueOptions): string {
  const planLetter = PLAN_LETTER[opts.plan];
  if (!planLetter) throw new Error(`Unknown plan: ${opts.plan}`);
  const expiry = expiryBlock(opts.expiresAt ?? null);
  const rand = randomBlock(14);
  const body = `${planLetter}-${expiry}-${rand}`;
  const sig = hmacBlock(body, 8);
  return `BBOS-${body}-${sig}`;
}

export function parseLicense(key: string): ParsedLicense | InvalidLicense {
  const trimmed = (key || "").trim().toUpperCase();
  const m = trimmed.match(/^BBOS-([A-Z])-([A-Z0-9]{6})-([A-Z0-9]{14})-([A-Z0-9]{8})$/);
  if (!m) return { ok: false, reason: "Malformed license key" };
  const [, planLetter, expiry, rand, sig] = m;
  const planId = LETTER_TO_PLAN[planLetter];
  if (!planId) return { ok: false, reason: "Unknown plan code" };
  const expected = hmacBlock(`${planLetter}-${expiry}-${rand}`, 8);
  if (expected !== sig) return { ok: false, reason: "Signature mismatch" };
  const exp = parseExpiry(expiry);
  if (exp === "invalid") return { ok: false, reason: "Invalid expiry encoding" };
  if (exp && exp.getTime() < Date.now()) {
    return { ok: false, reason: "License has expired" };
  }
  return { ok: true, plan: planId, expiresAt: exp, raw: trimmed };
}
