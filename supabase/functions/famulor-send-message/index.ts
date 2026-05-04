import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  channel: z.enum(["sms", "whatsapp"]),
  to: z.string().min(5).max(32),
  message: z.string().min(1).max(1000),
  call_log_id: z.string().uuid().optional(),
});

function toE164(raw: string): string {
  let f = raw.replace(/\s+/g, "");
  if (f.startsWith("07")) f = "+44" + f.substring(1);
  else if (!f.startsWith("+")) f = "+" + f;
  return f;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { channel, to, message, call_log_id } = parsed.data;
    const phone = toE164(to);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (channel === "whatsapp") {
      // Delegate to existing send-whatsapp (uses caller's auth)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ to: phone, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data?.error ?? "WhatsApp send failed" }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (call_log_id) {
        await admin.from("famulor_call_logs").update({
          metadata: { last_manual_action: { type: "whatsapp", at: new Date().toISOString(), to: phone } },
        }).eq("id", call_log_id);
      }
      return new Response(JSON.stringify({ ok: true, channel }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SMS via Twilio
    const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
    const MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    if (!SID || !TOKEN || (!FROM && !MSG_SID)) {
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({ To: phone, Body: message });
    if (MSG_SID) params.append("MessagingServiceSid", MSG_SID);
    else if (FROM) params.append("From", FROM);

    const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const twData = await twRes.json().catch(() => ({}));
    if (!twRes.ok) {
      return new Response(JSON.stringify({ error: twData?.message ?? "Twilio error" }), {
        status: twRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (call_log_id) {
      await admin.from("famulor_call_logs").update({
        metadata: { last_manual_action: { type: "sms", at: new Date().toISOString(), to: phone, sid: twData?.sid } },
      }).eq("id", call_log_id);
    }
    return new Response(JSON.stringify({ ok: true, channel, sid: twData?.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
