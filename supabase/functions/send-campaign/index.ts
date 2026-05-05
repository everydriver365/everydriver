import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error } = await authClient.auth.getClaims(token);
  if (error || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await authClient.rpc("has_role", {
    _user_id: claims.claims.sub, _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminCheck = await requireAdmin(req);
  if (adminCheck) return adminCheck;

  try {
    const { campaignId } = await req.json();
    if (!campaignId) throw new Error("Missing campaignId");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from("admin_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campErr || !campaign) throw new Error("Campaign not found");

    // Fetch recipients
    let recipients: { phone?: string; email?: string; name: string }[] = [];

    if (campaign.audience_type === "all_instructors" || campaign.audience_type === "active_instructors") {
      let query = supabase.from("instructors").select("name, phone, email");
      if (campaign.audience_type === "active_instructors") {
        query = query.eq("is_active", true);
      }
      const { data } = await query;
      recipients = (data || []).map((r: any) => ({ name: r.name, phone: r.phone, email: r.email }));
    } else if (campaign.audience_type === "all_pupils") {
      const { data } = await supabase.from("pupils").select("name, phone, email");
      recipients = (data || []).map((r: any) => ({ name: r.name, phone: r.phone, email: r.email }));
    }

    let sent = 0;

    if (campaign.channel === "sms") {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
      const messagingSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

      for (const r of recipients) {
        if (!r.phone) continue;
        try {
          const body = new URLSearchParams({
            To: r.phone,
            Body: campaign.message,
            ...(messagingSid ? { MessagingServiceSid: messagingSid } : { From: fromNumber }),
          });

          const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: body.toString(),
            }
          );

          if (res.ok) sent++;
        } catch (e) {
          console.error(`Failed to send SMS to ${r.phone}:`, e);
        }
      }
    } else if (campaign.channel === "email") {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

      for (const r of recipients) {
        if (!r.email) continue;
        try {
          await resend.emails.send({
            from: "EveryDriver <noreply@everydriver.co.uk>",
            to: [r.email],
            subject: campaign.subject || "Message from EveryDriver",
            html: `<p>${campaign.message.replace(/\n/g, "<br/>")}</p>`,
          });
          sent++;
        } catch (e) {
          console.error(`Failed to send email to ${r.email}:`, e);
        }
      }
    }

    // Update campaign
    await supabase
      .from("admin_campaigns")
      .update({ status: "sent", recipient_count: sent, sent_at: new Date().toISOString() })
      .eq("id", campaignId);

    return new Response(JSON.stringify({ success: true, recipientCount: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Campaign error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
