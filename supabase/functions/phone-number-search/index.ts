// Search available UK numbers from Twilio
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return json({ error: "Unauthorized" }, 401);

    const { areaCode } = await req.json();
    if (!areaCode || !/^\d{2,5}$/.test(String(areaCode))) {
      return json({ error: "Invalid area code" }, 400);
    }

    const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!sid || !token) return json({ error: "Twilio not configured" }, 500);

    // UK Local numbers — strip leading 0 from area code for Twilio's Contains query
    const cleanAreaCode = String(areaCode).replace(/^0/, "");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/GB/Local.json?AreaCode=${cleanAreaCode}&PageSize=5`;
    const auth = btoa(`${sid}:${token}`);
    const resp = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    const data = await resp.json();
    if (!resp.ok) return json({ error: data?.message || "Twilio error" }, resp.status);

    const numbers = (data.available_phone_numbers ?? []).map((n: any) => ({
      phoneNumber: n.phone_number,
      friendlyName: n.friendly_name,
      locality: n.locality,
    }));
    return json({ numbers }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
