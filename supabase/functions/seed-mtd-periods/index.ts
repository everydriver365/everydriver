// Seeds MTD quarterly periods for an instructor (current + next tax year).
// Idempotent: upserts on (instructor_id, tax_year, quarter).
// No HMRC API calls — purely structural row creation.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type QuarterSpec = {
  q: 1 | 2 | 3 | 4;
  startMonth: number; // 0-indexed
  startDay: number;
  endMonth: number;
  endDay: number;
  deadlineMonth: number;
  deadlineDay: number;
  endYearOffset: 0 | 1;
  deadlineYearOffset: 0 | 1;
};

const QUARTERS: ReadonlyArray<QuarterSpec> = [
  { q: 1, startMonth: 3, startDay: 6, endMonth: 6, endDay: 5, deadlineMonth: 7, deadlineDay: 7, endYearOffset: 0, deadlineYearOffset: 0 },
  { q: 2, startMonth: 6, startDay: 6, endMonth: 9, endDay: 5, deadlineMonth: 10, deadlineDay: 7, endYearOffset: 0, deadlineYearOffset: 0 },
  { q: 3, startMonth: 9, startDay: 6, endMonth: 0, endDay: 5, deadlineMonth: 1, deadlineDay: 7, endYearOffset: 1, deadlineYearOffset: 1 },
  { q: 4, startMonth: 0, startDay: 6, endMonth: 3, endDay: 5, deadlineMonth: 4, deadlineDay: 7, endYearOffset: 1, deadlineYearOffset: 1 },
];

function toISODate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getCurrentTaxYear(now: Date): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  if (m < 3 || (m === 3 && d < 6)) return y - 1;
  return y;
}

function buildPeriodsForTaxYear(taxYear: number, instructorId: string) {
  return QUARTERS.map((spec) => ({
    instructor_id: instructorId,
    tax_year: taxYear,
    quarter: spec.q,
    period_start: toISODate(taxYear + (spec.q === 4 ? 1 : 0), spec.startMonth, spec.startDay),
    period_end: toISODate(taxYear + spec.endYearOffset, spec.endMonth, spec.endDay),
    deadline: toISODate(taxYear + spec.deadlineYearOffset, spec.deadlineMonth, spec.deadlineDay),
    status: "open" as const,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await userClient.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authUserId = claims.claims.sub as string;

    // Parse + validate body
    let body: { instructor_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const instructorId = body.instructor_id;
    if (!instructorId || typeof instructorId !== "string") {
      return new Response(JSON.stringify({ error: "instructor_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve caller's instructor_id and check ownership
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: ownIdRow, error: ownErr } = await admin.rpc(
      "get_instructor_id_for_user",
      { p_user_id: authUserId },
    );
    if (ownErr) {
      return new Response(JSON.stringify({ error: ownErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ownIdRow || ownIdRow !== instructorId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build periods for current + next tax year
    const now = new Date();
    const currentTaxYear = getCurrentTaxYear(now);
    const rows = [
      ...buildPeriodsForTaxYear(currentTaxYear, instructorId),
      ...buildPeriodsForTaxYear(currentTaxYear + 1, instructorId),
    ];

    const { error: upsertErr, count } = await admin
      .from("mtd_quarterly_periods")
      .upsert(rows, {
        onConflict: "instructor_id,tax_year,quarter",
        ignoreDuplicates: false,
        count: "exact",
      });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ seeded: count ?? rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
