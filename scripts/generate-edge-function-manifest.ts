#!/usr/bin/env bun
/**
 * Scans supabase/functions/* and supabase/config.toml, emits
 * src/data/edge-functions.json — a list of every deployed edge function name.
 *
 * Run with: bun scripts/generate-edge-function-manifest.ts
 *
 * Commit the resulting JSON. The Edge Function Audit admin page reads it.
 */
import { readdirSync, statSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FUNCTIONS_DIR = "supabase/functions";
const CONFIG_PATH = "supabase/config.toml";
const OUT_PATH = "src/data/edge-functions.json";

const entries = readdirSync(FUNCTIONS_DIR)
  .filter((name) => !name.startsWith("_") && !name.startsWith("."))
  .filter((name) => {
    const dir = join(FUNCTIONS_DIR, name);
    try {
      return statSync(dir).isDirectory() && existsSync(join(dir, "index.ts"));
    } catch {
      return false;
    }
  });

const config = existsSync(CONFIG_PATH) ? readFileSync(CONFIG_PATH, "utf8") : "";
const configured = new Set<string>();
for (const m of config.matchAll(/^\[functions\.([a-z0-9-]+)\]/gim)) {
  configured.add(m[1]);
}

const manifest = {
  generated_at: new Date().toISOString(),
  total: entries.length,
  functions: entries.sort().map((name) => ({
    name,
    has_config_block: configured.has(name),
  })),
};

writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${OUT_PATH} — ${manifest.total} functions.`);
