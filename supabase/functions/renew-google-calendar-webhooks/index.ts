// =============================================================================
// renew-google-calendar-webhooks/index.ts
// =============================================================================
// Daily cron: re-register events.watch channels expiring within 24h.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { raiseSyncAlert } from "../_shared/raiseSyncAlert.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Connected instructors whose webhook is missing OR expiring within 24h
    const { data: due, error } = await supabase
      .from("instructor_google_service_calendar")
      .select("instructor_id, webhook_expires_at, webhook_channel_id")
      .eq("is_active", true)
      .or(`webhook_expires_at.is.null,webhook_expires_at.lt.${cutoff}`);

    if (error) throw error;

    let renewed = 0, failed = 0;
    for (const row of due ?? []) {
      try {
        const res = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-service`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ action: "renewWebhook", instructorId: row.instructor_id }),
          },
        );
        const json = await res.json().catch(() => ({}));
        if (json?.success) renewed++; else failed++;
      } catch (e) {
        failed++;
        void raiseSyncAlert({
          category: "webhook", severity: "critical",
          title: "Webhook renewal failed",
          message: String(e),
          instructorId: row.instructor_id,
          supabase,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, renewed, failed, total: due?.length ?? 0 }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("renew-google-calendar-webhooks fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
