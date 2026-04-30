import Database from "better-sqlite3";
import { promises as fs } from "node:fs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";

let _db: Database.Database | null = null;

function dbPath(): string {
  return process.env.BOOKBRAIN_DB_PATH || path.join(process.cwd(), "data", "bookbrain.db");
}

export function getDB(): Database.Database {
  if (_db) return _db;
  const file = dbPath();
  const dir = path.dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  _db = db;
  return db;
}

export async function exportDir(): Promise<string> {
  const dir = process.env.BOOKBRAIN_EXPORT_DIR || path.join(process.cwd(), "data", "exports");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
