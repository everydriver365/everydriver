import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAMULOR_BASE = "https://api.famulor.de/v1";

type Outcome = "ok" | "warning" | "error";

function respond(
  outcome: Outcome,
  message: string,
  extra: Record<string, unknown> = {},
  status = 200,
) {
  return new Response(
    JSON.stringify({ outcome, message, ...extra }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
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
      return respond("error", "No instructor profile found.", {}, 403);
    }

    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) {
      return await persistAndRespond(admin, instructorRow.id, "error", "Famulor API key is not configured.");
    }

    const { data: settings } = await admin
      .from("famulor_settings")
      .select("inbound_agent_id, inbound_phone_number")
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();

    if (!settings?.inbound_agent_id) {
      return await persistAndRespond(admin, instructorRow.id, "error", "Inbound agent ID is empty. Add it from your Famulor dashboard.");
    }

    const fRes = await fetch(`${FAMULOR_BASE}/agents/${settings.inbound_agent_id}`, {
      headers: { Authorization: `Bearer ${FAMULOR_API_KEY}` },
    });

    if (fRes.status === 401 || fRes.status === 403) {
      return await persistAndRespond(admin, instructorRow.id, "error", "Famulor API key is invalid or lacks access.");
    }
    if (fRes.status === 404) {
      return await persistAndRespond(admin, instructorRow.id, "error", "That agent ID was not found in your Famulor account.");
    }
    if (!fRes.ok) {
      const text = await fRes.text();
      return await persistAndRespond(admin, instructorRow.id, "error", `Famulor responded ${fRes.status}: ${text.slice(0, 200)}`);
    }

    const agent = await fRes.json().catch(() => ({}));
    const agentName: string = agent?.name ?? agent?.data?.name ?? "your agent";
    const agentPhone: string | undefined =
      agent?.phone_number ?? agent?.data?.phone_number ?? agent?.inbound_phone_number;
    const isActive: boolean | undefined =
      agent?.active ?? agent?.data?.active ?? agent?.is_active;

    if (!agentPhone && !settings.inbound_phone_number) {
      return await persistAndRespond(
        admin,
        instructorRow.id,
        "warning",
        `Connected to "${agentName}", but no inbound number is set. Provision one in Famulor.`,
        { agent_name: agentName },
      );
    }

    const phone = agentPhone ?? settings.inbound_phone_number;
    const status = isActive === false ? "paused" : "live";
    const msg = isActive === false
      ? `Connected to "${agentName}" on ${phone}, but the agent is paused.`
      : `Connected. "${agentName}" is live on ${phone}.`;

    return await persistAndRespond(
      admin,
      instructorRow.id,
      isActive === false ? "warning" : "ok",
      msg,
      { agent_name: agentName, phone_number: phone, status },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ outcome: "error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function persistAndRespond(
  admin: ReturnType<typeof createClient>,
  instructorId: string,
  outcome: Outcome,
  message: string,
  extra: Record<string, unknown> = {},
) {
  const status = outcome === "ok" ? "live" : outcome === "warning" ? "warning" : "failed";
  await admin
    .from("famulor_settings")
    .update({
      last_verified_at: new Date().toISOString(),
      last_verified_status: status,
      last_verified_message: message,
    })
    .eq("instructor_id", instructorId);
  return new Response(
    JSON.stringify({ outcome, message, ...extra }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
