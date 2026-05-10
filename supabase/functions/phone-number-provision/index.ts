// Provision (purchase) a Twilio number and store it for the instructor
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes.user) return json({ error: "Unauthorized" }, 401);

    const { data: instructorRow } = await userClient
      .from("instructors").select("id").eq("auth_user_id", userRes.user.id).maybeSingle();
    if (!instructorRow) return json({ error: "Not an instructor" }, 403);

    const { phoneNumber } = await req.json();
    if (!phoneNumber || typeof phoneNumber !== "string") return json({ error: "Missing phoneNumber" }, 400);

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const auth = btoa(`${sid}:${token}`);

    const voiceUrl = `${supabaseUrl}/functions/v1/voice-router`;
    const body = new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: voiceUrl,
      VoiceMethod: "POST",
    });
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
      { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body },
    );
    const data = await resp.json();
    if (!resp.ok) return json({ error: data?.message || "Twilio purchase failed" }, resp.status);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insErr } = await admin.from("instructor_phone_numbers").insert({
      instructor_id: instructorRow.id,
      phone_number: data.phone_number,
      provider: "twilio_provisioned",
      twilio_sid: data.sid,
      monthly_cost_pence: 250, // £2.50/mo retail
      routing_mode: "schedule",
    });
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, phoneNumber: data.phone_number }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
