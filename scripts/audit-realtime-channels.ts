#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Audits src/ for `supabase.channel(` usage to ensure all realtime
 * subscriptions go through useRealtimeHub. Writes
 * src/data/realtime-audit.json for /admin/realtime-audit.
 */
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

const root = new URL("../src/", import.meta.url).pathname;

const ALLOWLIST = new Set<string>([
  "src/hooks/useRealtimeHub.tsx",
  "src/hooks/useInstructorOnlineStatus.ts",
  "src/hooks/useInstructorPresence.ts",
  "src/hooks/useTypingIndicator.ts",
]);

interface Hit {
  file: string;
  line: number;
  snippet: string;
}

const hits: Hit[] = [];

for await (const entry of walk(root, { exts: [".ts", ".tsx"], includeDirs: false })) {
  const text = await Deno.readTextFile(entry.path);
  const lines = text.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("supabase.channel(")) {
      hits.push({
        file: entry.path.replace(root, "src/"),
        line: idx + 1,
        snippet: line.trim().slice(0, 160),
      });
    }
  });
}

const allowed = hits.filter((h) => ALLOWLIST.has(h.file));
const violators = hits.filter((h) => !ALLOWLIST.has(h.file));

const out = {
  generated_at: new Date().toISOString(),
  allowlist: [...ALLOWLIST],
  total_sites: hits.length,
  allowed_count: allowed.length,
  violator_count: violators.length,
  allowed,
  violators,
};

const outPath = new URL("../src/data/realtime-audit.json", import.meta.url).pathname;
await Deno.writeTextFile(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Allowed: ${allowed.length}, Violators: ${violators.length}`);
