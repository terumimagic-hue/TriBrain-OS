import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { getDB } from "@/lib/db/client";
import { resolveEnv } from "@/lib/db/state";
import { getActiveLicense, projectQuotaStatus } from "@/lib/license/store";
import { costStatus } from "@/lib/license/guards";
import { stripeConfigured } from "@/lib/license/stripe";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const env = resolveEnv();
  const license = getActiveLicense();
  const quota = projectQuotaStatus();
  const cost = costStatus();
  const db = getDB();

  const counts: Record<string, number> = {};
  const tables = ["book_project", "agent_run", "chapter", "manuscript_version", "knowledge_item", "license_key", "cost_log"];
  for (const t of tables) {
    try {
      counts[t] = (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    } catch {
      counts[t] = -1;
    }
  }

  const dbPath = process.env.BOOKBRAIN_DB_PATH || path.join(process.cwd(), "data", "bookbrain.db");
  let dbBytes = 0;
  try { dbBytes = (await fs.stat(dbPath)).size; } catch {}
  const exportsDir = path.join(path.dirname(dbPath), "exports");
  let exportsBytes = 0;
  if (existsSync(exportsDir)) exportsBytes = await dirSize(exportsDir);

  const stuckRuns = (db.prepare(
    `SELECT id, project_id, step, agent, status, started_at FROM agent_run
     WHERE status = 'running' AND (julianday('now') - julianday(started_at)) * 24 * 60 > 10
     ORDER BY started_at DESC LIMIT 20`
  ).all()) as unknown[];

  return NextResponse.json({
    versions: { node: process.version },
    providers: {
      openai: { hasKey: !!env.openaiKey, model: env.openaiModel, embeddingModel: env.embeddingModel },
      anthropic: { hasKey: !!env.anthropicKey, model: env.anthropicModel },
      gemini: { hasKey: !!env.geminiKey, model: env.geminiModel }
    },
    license: license.license
      ? {
          plan: license.license.plan,
          status: license.license.status,
          source: license.license.source,
          activated_at: license.license.activated_at,
          expires_at: license.license.expires_at
        }
      : null,
    plan: license.plan,
    quota,
    cost,
    storage: {
      db_path: dbPath,
      db_bytes: dbBytes,
      exports_bytes: exportsBytes
    },
    counts,
    stuck_runs: stuckRuns,
    stripe: { configured: stripeConfigured() }
  });
}

async function dirSize(p: string): Promise<number> {
  let total = 0;
  const entries = await fs.readdir(p, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(p, ent.name);
    if (ent.isDirectory()) total += await dirSize(full);
    else if (ent.isFile()) {
      try { total += (await fs.stat(full)).size; } catch {}
    }
  }
  return total;
}
