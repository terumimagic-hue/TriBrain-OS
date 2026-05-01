// Issue a license key from the command line.
// Usage:
//   npm run issue-license -- --plan pro --email customer@example.com
//   npm run issue-license -- --plan starter --expires 2026-12 --notes "Black Friday"
import { issueAndStore } from "../lib/license/store";
import type { PlanId } from "../lib/license/plans";

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  return process.argv[i + 1];
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function main() {
  const plan = (arg("plan") || "starter") as PlanId;
  if (!["free", "starter", "pro", "studio"].includes(plan)) {
    console.error(`Invalid plan: ${plan}`);
    process.exit(1);
  }
  const email = arg("email") || null;
  const notes = arg("notes") || null;
  const expiresArg = arg("expires"); // YYYY-MM
  const lifetime = !expiresArg && !flag("recurring");
  const expiresAt = expiresArg
    ? new Date(`${expiresArg}-01T00:00:00Z`)
    : null;

  const license = issueAndStore({
    plan,
    expiresAt: lifetime ? null : expiresAt,
    source: "manual",
    customerEmail: email,
    notes
  });

  console.log("");
  console.log("  License key:");
  console.log("  " + license.key);
  console.log("");
  console.log(`  plan:      ${license.plan}`);
  console.log(`  expires:   ${license.expires_at || "lifetime"}`);
  console.log(`  customer:  ${license.customer_email || "—"}`);
  console.log("");
}

main();
