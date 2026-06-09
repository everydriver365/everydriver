import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+44" + cleaned.substring(1);
  else if (!cleaned.startsWith("+")) cleaned = "+44" + cleaned;
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Resolve instructor for caller
    const { data: instructorIdData, error: instructorErr } = await admin.rpc(
      "get_instructor_id_for_user",
      { _user_id: user.id }
    );
    if (instructorErr || !instructorIdData) {
      return new Response(JSON.stringify({ error: "Instructor not found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const instructorId = instructorIdData as string;

    const body = await req.json().catch(() => ({}));
    const pupilId = typeof body?.pupil_id === "string" ? body.pupil_id : null;
    if (!pupilId) {
      return new Response(JSON.stringify({ error: "pupil_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load pupil
    const { data: pupil, error: pupilErr } = await admin
      .from("pupils")
      .select("id, name, parent_name, parent_phone, parent_portal_enabled, instructor_id")
      .eq("id", pupilId)
      .maybeSingle();

    if (pupilErr || !pupil) {
      return new Response(JSON.stringify({ error: "Pupil not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pupil.instructor_id !== instructorId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pupil.parent_phone) {
      return new Response(JSON.stringify({ error: "No parent phone on this pupil" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pupil.parent_portal_enabled === false) {
      return new Response(JSON.stringify({ error: "Parent portal is disabled for this pupil" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve portal URL via instructor branding
    const { data: instructor } = await admin
      .from("instructors")
      .select("business_name, name, custom_domain, custom_domain_verified")
      .eq("id", instructorId)
      .maybeSingle();

    const businessName =
      (instructor?.business_name && instructor.business_name.trim()) ||
      (instructor?.name && instructor.name.trim()) ||
      "Your driving instructor";

    const baseUrl =
      instructor?.custom_domain && instructor?.custom_domain_verified
        ? `https://${instructor.custom_domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`
        : "https://everydriver.co.uk";
    const portalUrl = `${baseUrl}/parent`;

    const parentSalutation = pupil.parent_name?.trim() ? pupil.parent_name.trim() : "there";
    const pupilName = pupil.name?.trim() || "your child";
    const messageBody =
      `Hi ${parentSalutation}, ${businessName} has invited you to track ${pupilName}'s driving lessons. ` +
      `Open the parent portal: ${portalUrl}`;

    // Send SMS via Twilio (same pattern as notify-parent)
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioMessagingSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioAuth || (!twilioMessagingSid && !twilioPhone)) {
      return new Response(
        JSON.stringify({ error: "SMS sending is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toPhone = cleanPhoneNumber(pupil.parent_phone);
    const form = new URLSearchParams();
    if (twilioMessagingSid) form.append("MessagingServiceSid", twilioMessagingSid);
    else if (twilioPhone) form.append("From", twilioPhone);
    form.append("To", toPhone);
    form.append("Body", messageBody);

    const smsRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    if (!smsRes.ok) {
      const errText = await smsRes.text();
      console.error("Twilio invite-parent SMS failed:", errText);
      return new Response(JSON.stringify({ error: "Could not send SMS" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("pupils")
      .update({ parent_invited_at: new Date().toISOString() })
      .eq("id", pupilId);

    return new Response(
      JSON.stringify({ success: true, sent_to: toPhone, portal_url: portalUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-parent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
