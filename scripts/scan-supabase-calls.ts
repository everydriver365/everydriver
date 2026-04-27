#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Scans src/ for `supabase.from(` and `supabase.rpc(` call sites,
 * ranks files by call count, and writes src/data/query-hotspots.json
 * for the /admin/query-budget page.
 *
 * Run: deno run --allow-read --allow-write scripts/scan-supabase-calls.ts
 */
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

interface Hotspot {
  file: string;
  from_calls: number;
  rpc_calls: number;
  total: number;
}

const root = new URL("../src/", import.meta.url).pathname;
const hotspots: Hotspot[] = [];

for await (const entry of walk(root, { exts: [".ts", ".tsx"], includeDirs: false })) {
  const text = await Deno.readTextFile(entry.path);
  const fromCalls = (text.match(/supabase\.from\(/g) ?? []).length;
  const rpcCalls = (text.match(/supabase\.rpc\(/g) ?? []).length;
  const total = fromCalls + rpcCalls;
  if (total > 0) {
    hotspots.push({
      file: entry.path.replace(root, "src/"),
      from_calls: fromCalls,
      rpc_calls: rpcCalls,
      total,
    });
  }
}

hotspots.sort((a, b) => b.total - a.total);

const out = {
  generated_at: new Date().toISOString(),
  total_files_with_supabase_calls: hotspots.length,
  total_call_sites: hotspots.reduce((acc, h) => acc + h.total, 0),
  top_50: hotspots.slice(0, 50),
};

const outPath = new URL("../src/data/query-hotspots.json", import.meta.url).pathname;
await Deno.writeTextFile(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Top 5:`, hotspots.slice(0, 5));
