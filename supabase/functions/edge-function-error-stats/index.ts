import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FunctionStat {
  function_name: string;
  total: number;
  errors_4xx: number;
  errors_5xx: number;
  error_rate: number;
  last_error_at: string | null;
  last_error_status: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- AuthN/AuthZ: must be admin ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Query the analytics database via Logflare-style endpoint ---
    // Supabase exposes function_edge_logs through the analytics endpoint at
    // /platform/projects/{ref}/analytics/endpoints/logs.all on the dashboard,
    // but service-role can't query that directly. Instead we use the new
    // analytics REST: https://api.supabase.com/v1/projects/{ref}/analytics/endpoints/logs
    // That requires a management token we don't have at runtime.
    //
    // Pragmatic fallback: read the project's own analytics view via the
    // built-in `function_edge_logs` PostgREST view if exposed; otherwise
    // return a graceful empty payload with a hint so the UI degrades cleanly.
    //
    // We attempt a direct SQL pass against the `function_edge_logs` log view
    // using the analytics_query RPC if defined; otherwise return empty stats.

    let stats: FunctionStat[] = [];
    let source: "analytics" | "unavailable" = "unavailable";
    let note: string | undefined;

    try {
      // Try a custom RPC `analytics_function_error_stats` if the user has set
      // one up. If not, we surface a friendly notice so the admin UI still
      // renders and the operator can wire the analytics endpoint manually.
      const { data, error } = await admin.rpc("analytics_function_error_stats", {
        p_hours: 24,
      });
      if (!error && Array.isArray(data)) {
        stats = data as FunctionStat[];
        source = "analytics";
      } else if (error) {
        note = `RPC analytics_function_error_stats not available: ${error.message}`;
      }
    } catch (e) {
      note = `Analytics RPC threw: ${(e as Error).message}`;
    }

    // Filter: error rate > 5% AND total >= 10
    const unhealthy = stats.filter(
      (s) => s.total >= 10 && s.error_rate > 0.05,
    );

    return new Response(
      JSON.stringify({
        source,
        note,
        window_hours: 24,
        threshold: { min_calls: 10, min_error_rate: 0.05 },
        total_functions_observed: stats.length,
        unhealthy_count: unhealthy.length,
        unhealthy,
        all: stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
