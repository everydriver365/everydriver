import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAMULOR_BASE = "https://api.famulor.de/v1";

const Channel = z.enum(["phone_in", "phone_out", "whatsapp", "webchat"]);
const Body = z.object({ channel: Channel });

const AGENT_FIELD: Record<z.infer<typeof Channel>, string> = {
  phone_in: "inbound_agent_id",
  phone_out: "outbound_agent_id",
  whatsapp: "whatsapp_agent_id",
  webchat: "webchat_agent_id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FAMULOR_API_KEY = Deno.env.get("FAMULOR_API_KEY");
    if (!FAMULOR_API_KEY) return json({ outcome: "failed", message: "FAMULOR_API_KEY not configured" }, 200);

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
      .from("instructors").select("id").eq("auth_user_id", userRes.user.id).maybeSingle();
    if (!instructorRow) return json({ error: "No instructor profile" }, 403);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { channel } = parsed.data;

    const agentField = AGENT_FIELD[channel];
    const { data: settings } = await admin
      .from("famulor_settings")
      .select(`${agentField}, inbound_phone_number, webchat_widget_token, per_channel_status`)
      .eq("instructor_id", instructorRow.id)
      .maybeSingle();

    const row = settings as Record<string, unknown> | null;
    const agentId = row?.[agentField] as string | null | undefined;

    let outcome: "ok" | "warning" | "failed" = "failed";
    let message = "Not configured.";
    let agentName: string | null = null;

    if (!agentId) {
      message = `Add a ${channel.replace("_", " ")} agent ID in Settings.`;
    } else {
      const fRes = await fetch(`${FAMULOR_BASE}/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${FAMULOR_API_KEY}` },
      });
      if (fRes.status === 401 || fRes.status === 403) {
        message = "Famulor API key invalid.";
      } else if (fRes.status === 404) {
        message = "Agent ID not found in your Famulor account.";
      } else if (!fRes.ok) {
        message = `Famulor returned ${fRes.status}.`;
      } else {
        const agent = await fRes.json().catch(() => ({}));
        agentName = (agent?.name as string) ?? agentId;
        if (channel === "phone_in" && !row?.inbound_phone_number) {
          outcome = "warning";
          message = `Connected to '${agentName}', but no inbound number set.`;
        } else if (channel === "webchat" && !row?.webchat_widget_token) {
          outcome = "warning";
          message = `Connected to '${agentName}', but no embed token generated yet.`;
        } else {
          outcome = "ok";
          message = `Connected. Agent '${agentName}' is reachable.`;
        }
      }
    }

    const status = (row?.per_channel_status as Record<string, unknown> | null) ?? {};
    status[channel] = {
      state: outcome === "ok" ? "live" : outcome === "warning" ? "warning" : "failed",
      message,
      verified_at: new Date().toISOString(),
      agent_name: agentName,
    };

    await admin
      .from("famulor_settings")
      .update({ per_channel_status: status })
      .eq("instructor_id", instructorRow.id);

    return json({ outcome, message, agent_name: agentName, channel, status: status[channel] });
  } catch (err) {
    return json({ outcome: "failed", message: err instanceof Error ? err.message : "Unknown error" }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
