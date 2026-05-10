#!/usr/bin/env bun
/**
 * Instructor RLS audit
 * --------------------
 * For every public.* table with an `instructor_id` column, verify that
 * an authenticated instructor has policies allowing them to insert / update /
 * delete their own rows (matched by `instructor_id = get_instructor_id_for_user(auth.uid())`).
 *
 * Cross-references the codebase to flag the gaps that are actually exercised
 * by a `.from("<table>").insert/.update/.delete(...)` call (Critical), versus
 * those that are intentional (admin-managed, service-role, audit logs, etc.).
 *
 * Usage (in dev sandbox or CI):
 *   bun run audit:rls
 *
 * Inputs (regenerate manually if running outside the sandbox):
 *   /tmp/audit/tables.txt   one table name per line
 *   /tmp/audit/policies.tsv tablename \t cmd \t policyname \t qual \t with_check
 *
 * Output:
 *   docs/qa/instructor-rls-gaps.md
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const TABLES_FILE = "/tmp/audit/tables.txt";
const POLICIES_FILE = "/tmp/audit/policies.tsv";
const OUT_DIR = "docs/qa";
const OUT_FILE = `${OUT_DIR}/instructor-rls-gaps.md`;

if (!existsSync(TABLES_FILE) || !existsSync(POLICIES_FILE)) {
  console.error(
    `Missing audit inputs. Generate with:\n` +
      `  psql -t -A -F'|' -c "SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid WHERE n.nspname='public' AND c.relkind='r' AND a.attname='instructor_id' AND NOT a.attisdropped ORDER BY c.relname" > ${TABLES_FILE}\n` +
      `  psql -t -A -F$'\\t' -c "SELECT tablename, cmd, policyname, COALESCE(qual,''), COALESCE(with_check,'') FROM pg_policies WHERE schemaname='public'" > ${POLICIES_FILE}`,
  );
  process.exit(2);
}

const tables = readFileSync(TABLES_FILE, "utf8")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

type Pol = { table: string; cmd: string; name: string; qual: string; check: string };
const policies: Pol[] = readFileSync(POLICIES_FILE, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [table, cmd, name, qual, check] = line.split("\t");
    return { table, cmd, name, qual: qual ?? "", check: check ?? "" };
  });

// A policy "lets an instructor write their own row" if its qual or with_check
// references the instructor identity helper or the standard ownership pattern.
const OWNER_PATTERNS = [
  /get_instructor_id_for_user\s*\(\s*auth\.uid/i,
  /instructor_id\s*IN\s*\(\s*SELECT[^)]*instructors[^)]*auth_user_id\s*=\s*auth\.uid/i,
  /instructor_id\s*=\s*\(\s*SELECT[^)]*instructors[^)]*auth_user_id\s*=\s*auth\.uid/i,
];
const isOwnerExpr = (s: string) => OWNER_PATTERNS.some((re) => re.test(s));

function hasOwnerPolicy(table: string, op: "INSERT" | "UPDATE" | "DELETE"): boolean {
  return policies.some((p) => {
    if (p.table !== table) return false;
    if (p.cmd !== op && p.cmd !== "ALL") return false;
    // INSERT only checks `with_check`, others also check `qual`.
    if (op === "INSERT") return isOwnerExpr(p.check);
    return isOwnerExpr(p.qual) || isOwnerExpr(p.check);
  });
}

// Walk src/ and supabase/functions/ to find write usages per table.
const writeOps: Record<string, Set<"insert" | "update" | "delete" | "upsert">> = {};
function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) files.push(full);
  }
  return files;
}
const codeFiles: string[] = [];
if (existsSync("src")) walk("src", codeFiles);
if (existsSync("supabase/functions")) walk("supabase/functions", codeFiles);

const fromRe = /\.from\(\s*["'`]([a-z0-9_]+)["'`]\s*\)([^;]*)/gi;
for (const f of codeFiles) {
  const txt = readFileSync(f, "utf8");
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(txt))) {
    const table = m[1];
    const tail = m[2];
    if (!tables.includes(table)) continue;
    writeOps[table] ||= new Set();
    if (/\.insert\s*\(/.test(tail)) writeOps[table].add("insert");
    if (/\.update\s*\(/.test(tail)) writeOps[table].add("update");
    if (/\.delete\s*\(/.test(tail)) writeOps[table].add("delete");
    if (/\.upsert\s*\(/.test(tail)) writeOps[table].add("upsert");
  }
}

// Tables we deliberately keep restricted (system / audit / service-role only).
const INTENTIONAL = new Set([
  "calendar_sync_queue",
  "compliance_reminders",
  "data_audit_log",
  "driver_timesheets",
  "followup_log",
  "funnel_events",
  "geotab_driver_events",
  "geotab_fault_codes",
  "geotab_fuel_usage",
  "geotab_impact_events",
  "gps_battery_history",
  "gps_ignition_events",
  "instructor_health_alerts",
  "instructor_notifications",
  "instructor_payouts",
  "instructor_premium_placements",
  "instructor_reports",
  "instructor_weekly_reports",
  "lesson_cancellation_stats",
  "lesson_history",
  "lesson_reminders_log",
  "live_pupil_positions",
  "mtd_submission_log",
  "movement_alerts",
  "on_my_way_notifications",
  "payment_disputes",
  "payment_history",
  "payment_intents",
  "payment_link_tracking",
  "payment_reminder_log",
]);

type Row = { table: string; insert: boolean; update: boolean; delete: boolean; uses: string };
const rows: Row[] = tables.map((t) => ({
  table: t,
  insert: hasOwnerPolicy(t, "INSERT"),
  update: hasOwnerPolicy(t, "UPDATE"),
  delete: hasOwnerPolicy(t, "DELETE"),
  uses: writeOps[t] ? [...writeOps[t]].sort().join(",") : "",
}));

const critical = rows.filter(
  (r) =>
    !INTENTIONAL.has(r.table) &&
    r.uses &&
    ((r.uses.includes("insert") || r.uses.includes("upsert")) && !r.insert ||
      r.uses.includes("update") && !r.update ||
      r.uses.includes("delete") && !r.delete),
);
const intentional = rows.filter((r) => INTENTIONAL.has(r.table));
const readOnly = rows.filter(
  (r) => !INTENTIONAL.has(r.table) && !r.uses && (!r.insert || !r.update || !r.delete),
);
const ok = rows.filter((r) => r.insert && r.update && r.delete);

mkdirSync(OUT_DIR, { recursive: true });

const fmt = (rs: Row[]) =>
  rs.length === 0
    ? "_None._\n"
    : `| Table | UI ops | INSERT | UPDATE | DELETE |\n| --- | --- | --- | --- | --- |\n` +
      rs
        .map(
          (r) =>
            `| \`${r.table}\` | ${r.uses || "—"} | ${r.insert ? "✅" : "❌"} | ${r.update ? "✅" : "❌"} | ${r.delete ? "✅" : "❌"} |`,
        )
        .join("\n") +
      "\n";

const md = `# Instructor RLS gap audit

_Generated by \`scripts/audit-instructor-rls.ts\`. Re-run with \`bun run audit:rls\`._

For every \`public.*\` table with an \`instructor_id\` column, this report shows
whether an authenticated instructor has policies allowing them to insert,
update or delete their **own** rows (matched via
\`get_instructor_id_for_user(auth.uid())\`).

The "UI ops" column lists Supabase mutations that exist in \`src/\` or
\`supabase/functions/\` against that table.

## Critical — UI writes to it but instructor cannot

These cause silent "Failed to save" failures for instructors today.

${fmt(critical)}

## Intentional — kept restricted on purpose

Audit logs, system-generated rows, payouts, etc. Instructor reads only.

${fmt(intentional)}

## Read-only by design (no UI writes detected)

${fmt(readOnly)}

## Healthy (full instructor write access)

${ok.length} tables.

---
Critical count: **${critical.length}**
`;

writeFileSync(OUT_FILE, md);
console.log(`Wrote ${OUT_FILE}`);
console.log(`Critical: ${critical.length}`);
for (const r of critical) console.log(`  - ${r.table.padEnd(45)} uses=${r.uses}`);

if (process.env.AUDIT_STRICT === "1" && critical.length > 0) {
  process.exit(1);
}
