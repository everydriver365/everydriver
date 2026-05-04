import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAMULOR_BASE = "https://api.famulor.de/v1";

const Channel = z.enum(["phone_in", "phone_out", "whatsapp", "webchat"]);
const Body = z.object({ channel: Channel, enabled: z.boolean() });

const AGENT_FIELD: Record<z.infer<typeof Channel>, string> = {
  phone_in: "inbound_agent_id",
  phone_out: "outbound_agent_id",
  whatsapp: "whatsapp_agent_id",
  webchat: "webchat_agent_id",
};

const ENABLED_FIELD: Record<z.infer<typeof Channel>, string> = {
  phone_in: "phone_inbound_enabled",
  phone_out: "phone_outbound_enabled",
  whatsapp: "whatsapp_enabled",
  webchat: "webchat_enabled",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) {
      return json({ error: "FAMULOR_API_KEY not configured" }, 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: instructorRow } = await admin
      .from("instructors")
      .select("id")
      .eq("auth_user_id", userRes.user.id)
      .maybeSingle();
    if (!instructorRow) return json({ error: "No instructor profile" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { channel, enabled } = parsed.data;

    const agentField = AGENT_FIELD[channel];
    const enabledField = ENABLED_FIELD[channel];

    const { data: settings } = await admin
      .from("famulor_settings")
      .select(`${agentField}, per_channel_status`)
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();

    const agentId = (settings as Record<string, unknown> | null)?.[agentField] as string | null;
    if (!agentId) {
      return json(
        { error: `Set the ${channel.replace("_", " ")} agent ID in Settings before enabling this channel.` },
        400,
      );
    }

    // Famulor: PATCH /agents/{id} { active: boolean }
    const fRes = await fetch(`${FAMULOR_BASE}/agents/${agentId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${FAMULOR_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: enabled }),
    });

    if (!fRes.ok) {
      const text = await fRes.text();
      return json(
        { error: `Famulor rejected the toggle (${fRes.status}): ${text.slice(0, 300)}` },
        502,
      );
    }

    const status = (settings as Record<string, unknown> | null)?.per_channel_status as
      | Record<string, unknown>
      | null
      | undefined ?? {};

    status[channel] = {
      state: enabled ? "live" : "paused",
      message: enabled ? "Channel live." : "Channel paused.",
      verified_at: new Date().toISOString(),
    };

    await admin
      .from("famulor_settings")
      .update({ [enabledField]: enabled, per_channel_status: status })
      .eq("instructor_id", instructorRow.id);

    return json({ success: true, channel, enabled, status: status[channel] });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
