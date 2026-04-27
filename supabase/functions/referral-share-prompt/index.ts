/**
 * referral-share-prompt
 * Sends a "Share with friends — you both get £10" message to a pupil
 * who recently passed. Used as a one-off trigger after pass.
 *
 * POST { pupil_id }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { pupil_id } = await req.json();
    if (!pupil_id) {
      return new Response(JSON.stringify({ error: "pupil_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pupil } = await admin
      .from("pupils")
      .select("name, phone, email, referral_code, instructor_id")
      .eq("id", pupil_id)
      .maybeSingle();
    if (!pupil) {
      return new Response(JSON.stringify({ error: "Pupil not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const link = `https://drive365.co.uk/r/${pupil.referral_code ?? pupil_id}`;
    const body = `🎉 Congrats on passing, ${pupil.name?.split(" ")[0] ?? ""}! Recommend your instructor and you both get £10 off lessons. Share: ${link}`;

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

    let smsOk = false;
    if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && pupil.phone) {
      try {
        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
            },
            body: new URLSearchParams({ To: pupil.phone, From: TWILIO_FROM, Body: body }),
          },
        );
        smsOk = resp.ok;
      } catch (_) { /* swallow */ }
    }

    return new Response(JSON.stringify({ success: true, link, sms_sent: smsOk }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
