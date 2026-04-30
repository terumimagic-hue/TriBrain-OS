import { promises as fs } from "node:fs";
import path from "node:path";
import type { CouncilSession } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "sessions.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf-8");
  }
}

export async function listSessions(): Promise<CouncilSession[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as CouncilSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: CouncilSession): Promise<void> {
  const sessions = await listSessions();
  const existing = sessions.findIndex((s) => s.id === session.id);
  if (existing >= 0) sessions[existing] = session;
  else sessions.unshift(session);
  const trimmed = sessions.slice(0, 200);
  await fs.writeFile(FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

export async function getSession(id: string): Promise<CouncilSession | null> {
  const sessions = await listSessions();
  return sessions.find((s) => s.id === id) ?? null;
}
