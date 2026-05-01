import { getDB } from "./client";

export const AppState = {
  get(key: string): string | null {
    const row = getDB().prepare("SELECT value FROM app_state WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? row.value : null;
  },
  set(key: string, value: string): void {
    getDB().prepare(
      `INSERT INTO app_state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).run(key, value);
  },
  del(key: string): void {
    getDB().prepare("DELETE FROM app_state WHERE key = ?").run(key);
  },
  all(): Record<string, string> {
    const rows = getDB().prepare("SELECT key, value FROM app_state").all() as { key: string; value: string }[];
    const o: Record<string, string> = {};
    for (const r of rows) o[r.key] = r.value;
    return o;
  }
};

export interface AppSettingsRow {
  id: number;
  default_author: string | null;
  default_language: string;
  default_market: string;
  default_tone: string | null;
  default_trim_w: number;
  default_trim_h: number;
  default_paper_type: string;
  cost_limit_monthly_usd: number;
  openai_model: string | null;
  anthropic_model: string | null;
  gemini_model: string | null;
  embedding_model: string | null;
  openai_key_override: string | null;
  anthropic_key_override: string | null;
  gemini_key_override: string | null;
  synthesis_provider: string | null;
  demo_mode: number;
  updated_at: string;
}

export const Settings = {
  get(): AppSettingsRow {
    const db = getDB();
    let row = db.prepare("SELECT * FROM app_settings WHERE id = 1").get() as AppSettingsRow | undefined;
    if (!row) {
      db.prepare("INSERT OR IGNORE INTO app_settings (id) VALUES (1)").run();
      row = db.prepare("SELECT * FROM app_settings WHERE id = 1").get() as AppSettingsRow;
    }
    return row;
  },
  patch(patch: Partial<AppSettingsRow>): AppSettingsRow {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === "id" || k === "updated_at") continue;
      fields.push(`${k} = ?`);
      values.push(v);
    }
    if (fields.length) {
      fields.push("updated_at = datetime('now')");
      getDB().prepare(`UPDATE app_settings SET ${fields.join(", ")} WHERE id = 1`).run(...values);
    }
    return Settings.get();
  }
};

// Resolve runtime env: settings overrides win over process.env
export function resolveEnv(): {
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  openaiModel: string;
  anthropicModel: string;
  geminiModel: string;
  embeddingModel: string;
  synthesisProvider: string;
} {
  const s = Settings.get();
  return {
    openaiKey: s.openai_key_override || process.env.OPENAI_API_KEY || undefined,
    anthropicKey: s.anthropic_key_override || process.env.ANTHROPIC_API_KEY || undefined,
    geminiKey: s.gemini_key_override || process.env.GEMINI_API_KEY || undefined,
    openaiModel: s.openai_model || process.env.OPENAI_MODEL || "gpt-4o",
    anthropicModel: s.anthropic_model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    geminiModel: s.gemini_model || process.env.GEMINI_MODEL || "gemini-2.0-flash",
    embeddingModel: s.embedding_model || process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
    synthesisProvider: s.synthesis_provider || process.env.SYNTHESIS_PROVIDER || "anthropic"
  };
}
