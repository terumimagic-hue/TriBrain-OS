// Pre-flight check: prints PASS / WARN / FAIL for the things that have to be
// right before BookBrain OS is sold or run in production.
//
// Run with: npm run sanity
import { existsSync, mkdirSync, statSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import path from "node:path";

type Status = "PASS" | "WARN" | "FAIL";
const out: { status: Status; label: string; detail?: string }[] = [];

function record(status: Status, label: string, detail?: string) {
  out.push({ status, label, detail });
}

const root = process.cwd();

// 1. Required files
for (const f of ["package.json", "next.config.js", "lib/db/schema.sql", "VERSION", "LICENSE", "README.md", ".env.example"]) {
  if (existsSync(path.join(root, f))) record("PASS", `file: ${f}`);
  else record("FAIL", `file: ${f}`, "missing");
}

// 2. data/ writable
const dataDir = path.join(root, "data");
if (!existsSync(dataDir)) {
  try { mkdirSync(dataDir, { recursive: true }); record("PASS", "data/ created"); }
  catch (e) { record("FAIL", "data/ create", (e as Error).message); }
} else {
  try {
    const probe = path.join(dataDir, `__sanity_${Date.now()}`);
    writeFileSync(probe, "ok");
    unlinkSync(probe);
    record("PASS", "data/ writable");
  } catch (e) {
    record("FAIL", "data/ writable", (e as Error).message);
  }
}

// 3. Schema loads, all expected tables exist
try {
  const { getDB } = require("../lib/db/client");
  const db = getDB();
  const tables: string[] = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
  const required = [
    "user", "series_profile", "book_project", "agent_run", "chapter",
    "manuscript_version", "research_note", "editorial_note", "kdp_metadata",
    "export_file", "knowledge_item", "style_profile", "source_reference",
    "cost_log", "cover_asset", "cover_design", "license_key", "app_state",
    "app_settings"
  ];
  const missing = required.filter((t) => !tables.includes(t));
  if (missing.length === 0) record("PASS", `DB schema (${required.length} tables present)`);
  else record("FAIL", "DB schema", `missing tables: ${missing.join(", ")}`);
} catch (e) {
  record("FAIL", "DB schema", (e as Error).message);
}

// 4. License HMAC roundtrip
try {
  const { issueLicense, parseLicense } = require("../lib/license/sign");
  const k = issueLicense({ plan: "pro" });
  const parsed = parseLicense(k);
  if (parsed.ok && parsed.plan === "pro") record("PASS", "license HMAC sign + verify");
  else record("FAIL", "license HMAC", "parse failed after issue");

  // Tamper detection
  const bad = parseLicense(k.slice(0, -1) + "Z");
  if (!bad.ok) record("PASS", "license HMAC: tamper detection");
  else record("FAIL", "license HMAC: tamper detection", "tampered key validated");
} catch (e) {
  record("FAIL", "license HMAC", (e as Error).message);
}

// 5. Default secret check
const SECRET = process.env.BOOKBRAIN_LICENSE_SECRET;
if (!SECRET) {
  record("WARN", "BOOKBRAIN_LICENSE_SECRET", "not set — using insecure default. Set this before selling.");
} else if (SECRET.length < 24) {
  record("WARN", "BOOKBRAIN_LICENSE_SECRET", "shorter than 24 chars — use openssl rand -base64 32.");
} else {
  record("PASS", "BOOKBRAIN_LICENSE_SECRET set");
}

// 6. Provider keys
for (const k of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"]) {
  if (process.env[k]) record("PASS", `env: ${k}`);
  else record("WARN", `env: ${k}`, "not set — pipeline steps using this provider will fail");
}

// 7. Stripe (optional)
const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
const hasAnyPrice = ["STRIPE_PRICE_STARTER_LIFETIME", "STRIPE_PRICE_STARTER_MONTHLY", "STRIPE_PRICE_PRO_LIFETIME", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_STUDIO_LIFETIME", "STRIPE_PRICE_STUDIO_MONTHLY"].some((k) => !!process.env[k]);
if (hasStripeKey || hasWebhookSecret || hasAnyPrice) {
  if (hasStripeKey && hasWebhookSecret && hasAnyPrice) record("PASS", "Stripe configured");
  else {
    const missing = [
      !hasStripeKey ? "STRIPE_SECRET_KEY" : null,
      !hasWebhookSecret ? "STRIPE_WEBHOOK_SECRET" : null,
      !hasAnyPrice ? "STRIPE_PRICE_*" : null
    ].filter(Boolean).join(", ");
    record("WARN", "Stripe partial config", `missing: ${missing}`);
  }
} else {
  record("PASS", "Stripe not configured (manual sales mode)");
}

// 8. Admin token (warn only)
if (process.env.BOOKBRAIN_ADMIN_TOKEN) record("PASS", "BOOKBRAIN_ADMIN_TOKEN set");
else record("WARN", "BOOKBRAIN_ADMIN_TOKEN", "not set — POST /api/license/issue is disabled");

// 9. VERSION + CHANGELOG match
try {
  const v = readFileSync(path.join(root, "VERSION"), "utf-8").trim();
  const cl = readFileSync(path.join(root, "CHANGELOG.md"), "utf-8");
  if (cl.includes(v)) record("PASS", `VERSION ${v} present in CHANGELOG.md`);
  else record("WARN", `VERSION ${v}`, "not mentioned in CHANGELOG.md");
} catch (e) {
  record("FAIL", "VERSION / CHANGELOG", (e as Error).message);
}

// Print
const colorize = (s: Status) =>
  s === "PASS" ? `\x1b[32mPASS\x1b[0m`
  : s === "WARN" ? `\x1b[33mWARN\x1b[0m`
  : `\x1b[31mFAIL\x1b[0m`;

console.log("");
console.log("BookBrain OS — sanity check");
console.log("");
for (const r of out) {
  console.log(`  ${colorize(r.status)}  ${r.label}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log("");

const fails = out.filter((r) => r.status === "FAIL").length;
const warns = out.filter((r) => r.status === "WARN").length;
const passes = out.filter((r) => r.status === "PASS").length;
console.log(`Summary: ${passes} pass, ${warns} warn, ${fails} fail`);
console.log("");

if (fails > 0) process.exit(1);
process.exit(0);
