/**
 * Verify a UK outward code (e.g. "SO22") against postcodes.io.
 * Free public API, no auth. Results are cached in-memory + sessionStorage.
 */
import { isValidOutwardCode } from "./resolveHourlyRate";

type Status = "unknown" | "checking" | "valid" | "invalid" | "error";

const memCache = new Map<string, "valid" | "invalid">();
const STORAGE_KEY = "outwardCodeCache:v1";

function loadStorage(): Record<string, "valid" | "invalid"> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}
function saveStorage(map: Record<string, "valid" | "invalid">) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch {}
}

// hydrate from sessionStorage
if (typeof window !== "undefined") {
  const stored = loadStorage();
  for (const [k, v] of Object.entries(stored)) memCache.set(k, v);
}

export function getCachedOutwardStatus(code: string): "valid" | "invalid" | null {
  const c = code.replace(/\s+/g, "").toUpperCase();
  return memCache.get(c) ?? null;
}

export async function verifyOutwardCode(code: string, signal?: AbortSignal): Promise<Status> {
  const c = code.replace(/\s+/g, "").toUpperCase();
  if (!isValidOutwardCode(c)) return "invalid";
  const cached = memCache.get(c);
  if (cached) return cached;
  try {
    const res = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(c)}`, { signal });
    if (res.status === 200) {
      memCache.set(c, "valid");
      const stored = loadStorage(); stored[c] = "valid"; saveStorage(stored);
      return "valid";
    }
    if (res.status === 404) {
      memCache.set(c, "invalid");
      const stored = loadStorage(); stored[c] = "invalid"; saveStorage(stored);
      return "invalid";
    }
    return "error";
  } catch (e: any) {
    if (e?.name === "AbortError") return "checking";
    return "error";
  }
}

export type { Status as OutwardStatus };
