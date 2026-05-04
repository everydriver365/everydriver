import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAMULOR_BASE = "https://api.famulor.de/v1";

const BodySchema = z.object({
  enabled: z.boolean(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FAMULOR_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!instructorRow) {
      return new Response(JSON.stringify({ error: "No instructor profile" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { enabled } = parsed.data;

    const { data: settings } = await admin
      .from("famulor_settings")
      .select("inbound_agent_id, inbound_phone_number")
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();

    if (!settings?.inbound_agent_id) {
      return new Response(
        JSON.stringify({
          error: "Set an Inbound agent ID before enabling AI answering.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Tell Famulor to activate/deactivate the agent.
    // Famulor's REST API uses PATCH /agents/{id} with { active: boolean }.
    const fRes = await fetch(`${FAMULOR_BASE}/agents/${settings.inbound_agent_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${FAMULOR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: enabled }),
    });

    if (!fRes.ok) {
      const text = await fRes.text();
      return new Response(
        JSON.stringify({
          error: `Famulor rejected the toggle (${fRes.status}): ${text.slice(0, 300)}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await admin
      .from("famulor_settings")
      .update({
        inbound_answering_enabled: enabled,
        last_verified_at: new Date().toISOString(),
        last_verified_status: enabled ? "live" : "paused",
        last_verified_message: enabled
          ? "AI answering enabled."
          : "AI answering paused.",
      })
      .eq("instructor_id", instructorRow.id);

    return new Response(
      JSON.stringify({ success: true, enabled }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
