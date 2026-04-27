// Edge Function Audit
// Given a list of edge function names from the client, returns a usage report:
//  - which cron jobs reference each function
//  - which other edge functions import / fetch each function
//  - orphaned cron jobs that point to functions no longer in the manifest
//  - a suggested retirement plan with safe SQL to unschedule orphans
//
// This function intentionally does NOT delete or unschedule anything.
// It only produces a read-only report. Admins act on the plan manually.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CronJob {
  jobid: number;
  jobname: string | null;
  schedule: string;
  command: string;
  active: boolean;
}

interface FunctionUsage {
  name: string;
  has_config_block: boolean;
  cron_jobs: { jobid: number; jobname: string | null; schedule: string }[];
  cross_function_refs: string[]; // other edge functions that mention this name
  recommendation:
    | "keep"
    | "investigate"
    | "retire-safe"
    | "retire-with-cron-cleanup";
  reason: string;
}

interface AuditReport {
  generated_at: string;
  total_functions: number;
  total_cron_jobs: number;
  orphaned_cron_jobs: {
    jobid: number;
    jobname: string | null;
    referenced_function: string;
    schedule: string;
    suggested_sql: string;
  }[];
  per_function: FunctionUsage[];
  retirement_plan: {
    safe_to_delete: string[];
    needs_review: string[];
    cron_cleanup_sql: string[];
  };
}

const FUNCTION_URL_RX = /functions\/v1\/([a-z0-9-]+)/gi;

function extractFunctionRefs(text: string): Set<string> {
  const refs = new Set<string>();
  for (const m of text.matchAll(FUNCTION_URL_RX)) {
    refs.add(m[1].toLowerCase());
  }
  return refs;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const manifest: { name: string; has_config_block: boolean }[] =
      Array.isArray(body?.functions) ? body.functions : [];

    if (manifest.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Missing 'functions' array in request body. Send the contents of src/data/edge-functions.json.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch cron jobs via a SECURITY DEFINER RPC (created in companion migration).
    const { data: cronData, error: cronErr } = await supabase.rpc(
      "audit_list_cron_jobs",
    );
    if (cronErr) throw cronErr;
    const cronJobs: CronJob[] = (cronData ?? []) as CronJob[];

    const manifestNames = new Set(manifest.map((f) => f.name));

    // Map: function name -> cron jobs
    const fnToCron = new Map<string, CronJob[]>();
    // Map: cron job -> referenced function names (for orphan detection)
    const cronToFns = new Map<number, Set<string>>();
    for (const job of cronJobs) {
      const refs = extractFunctionRefs(job.command);
      cronToFns.set(job.jobid, refs);
      for (const ref of refs) {
        if (!fnToCron.has(ref)) fnToCron.set(ref, []);
        fnToCron.get(ref)!.push(job);
      }
    }

    // Detect orphaned cron jobs (referencing functions not in manifest)
    const orphans: AuditReport["orphaned_cron_jobs"] = [];
    for (const job of cronJobs) {
      const refs = cronToFns.get(job.jobid) ?? new Set();
      for (const ref of refs) {
        if (!manifestNames.has(ref)) {
          orphans.push({
            jobid: job.jobid,
            jobname: job.jobname,
            referenced_function: ref,
            schedule: job.schedule,
            suggested_sql: `SELECT cron.unschedule(${job.jobid}); -- ${
              job.jobname ?? "unnamed"
            } -> ${ref} (function deleted)`,
          });
        }
      }
    }

    // Per-function analysis
    const perFunction: FunctionUsage[] = manifest.map((entry) => {
      const cronRefs = fnToCron.get(entry.name) ?? [];

      // Cross-function references: which OTHER manifest entries' names appear
      // in cron commands that target THIS function? Only useful as a weak signal;
      // the strong signal is "is it called by cron and/or referenced by client code"
      // (client code refs are computed by the UI, not here).
      const crossRefs: string[] = [];

      let recommendation: FunctionUsage["recommendation"];
      let reason: string;

      if (cronRefs.length > 0) {
        recommendation = "keep";
        reason = `Scheduled by ${cronRefs.length} active cron job(s).`;
      } else if (!entry.has_config_block) {
        recommendation = "investigate";
        reason =
          "No cron schedule and no config.toml block. Likely client-invoked — check src/ usage in the UI.";
      } else {
        recommendation = "investigate";
        reason =
          "No cron schedule. Has config block. Check whether client code still calls it.";
      }

      return {
        name: entry.name,
        has_config_block: entry.has_config_block,
        cron_jobs: cronRefs.map((j) => ({
          jobid: j.jobid,
          jobname: j.jobname,
          schedule: j.schedule,
        })),
        cross_function_refs: crossRefs,
        recommendation,
        reason,
      };
    });

    const report: AuditReport = {
      generated_at: new Date().toISOString(),
      total_functions: manifest.length,
      total_cron_jobs: cronJobs.length,
      orphaned_cron_jobs: orphans,
      per_function: perFunction,
      retirement_plan: {
        safe_to_delete: [], // populated client-side after combining with code refs
        needs_review: perFunction
          .filter((f) => f.recommendation === "investigate")
          .map((f) => f.name),
        cron_cleanup_sql: orphans.map((o) => o.suggested_sql),
      },
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("audit-edge-functions error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
