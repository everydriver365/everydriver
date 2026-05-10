// Release a Twilio-provisioned number
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

    const { id } = await req.json();
    if (!id) return json({ error: "Missing id" }, 400);

    // RLS scopes the row to this instructor automatically
    const { data: row, error: rowErr } = await userClient
      .from("instructor_phone_numbers").select("id,twilio_sid,provider").eq("id", id).maybeSingle();
    if (rowErr || !row) return json({ error: "Not found" }, 404);

    if (row.provider === "twilio_provisioned" && row.twilio_sid) {
      const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const auth = btoa(`${sid}:${token}`);
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers/${row.twilio_sid}.json`,
        { method: "DELETE", headers: { Authorization: `Basic ${auth}` } },
      );
      if (!resp.ok && resp.status !== 404) {
        const text = await resp.text();
        return json({ error: `Twilio release failed: ${text}` }, resp.status);
      }
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("instructor_phone_numbers").update({ status: "released" }).eq("id", id);
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
