// memory — local persistent JSON at ~/.gaokaopro/memory.json
// Stores user prefs + watched schools + simple event log so that Claude can
// resume context across sessions without re-asking.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

export type MemoryPrefs = {
  score?: number;
  rank?: number;
  province?: string;
  subjects?: string[];
  interests?: string[];
  year?: number;
};

export type WatchedSchool = {
  school_id: number;
  name?: string;
  added_at: string;
  note?: string;
};

export type MemoryEvent = {
  at: string;
  type: string;
  detail: string;
};

export type MemoryState = {
  prefs: MemoryPrefs;
  watched_schools: WatchedSchool[];
  events: MemoryEvent[];
};

const MEMORY_DIR = resolve(homedir(), ".gaokaopro");
const MEMORY_PATH = resolve(MEMORY_DIR, "memory.json");

export function loadMemory(): MemoryState {
  if (!existsSync(MEMORY_PATH)) {
    return { prefs: {}, watched_schools: [], events: [] };
  }
  try {
    return JSON.parse(readFileSync(MEMORY_PATH, "utf8")) as MemoryState;
  } catch {
    return { prefs: {}, watched_schools: [], events: [] };
  }
}

export function saveMemory(state: MemoryState): void {
  mkdirSync(MEMORY_DIR, { recursive: true });
  writeFileSync(MEMORY_PATH, JSON.stringify(state, null, 2));
}

export function setPrefs(updates: Record<string, string>): MemoryState {
  const state = loadMemory();
  for (const [key, raw] of Object.entries(updates)) {
    if (key === "score" || key === "rank" || key === "year") {
      const n = Number(raw);
      if (Number.isFinite(n)) (state.prefs as Record<string, unknown>)[key] = n;
    } else if (key === "subjects" || key === "interests") {
      (state.prefs as Record<string, unknown>)[key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      (state.prefs as Record<string, unknown>)[key] = raw;
    }
  }
  saveMemory(state);
  return state;
}

export function addWatched(schoolId: number, name?: string, note?: string): MemoryState {
  const state = loadMemory();
  if (!state.watched_schools.some((w) => w.school_id === schoolId)) {
    state.watched_schools.push({
      school_id: schoolId,
      name,
      added_at: new Date().toISOString(),
      note
    });
    saveMemory(state);
  }
  return state;
}

export function logEvent(type: string, detail: string): MemoryState {
  const state = loadMemory();
  state.events.push({ at: new Date().toISOString(), type, detail });
  // cap to last 200 events
  if (state.events.length > 200) state.events = state.events.slice(-200);
  saveMemory(state);
  return state;
}

export function clearMemory(): void {
  saveMemory({ prefs: {}, watched_schools: [], events: [] });
}

export function memoryPath(): string {
  return MEMORY_PATH;
}
