import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    // today + 30 days (UTC)
    const target = new Date();
    target.setUTCHours(0, 0, 0, 0);
    target.setUTCDate(target.getUTCDate() + 30);
    const targetDate = target.toISOString().slice(0, 10);

    // sent threshold: today - 25 days
    const threshold = new Date();
    threshold.setUTCDate(threshold.getUTCDate() - 25);
    const thresholdIso = threshold.toISOString();

    const { data: instructors, error } = await supabase
      .from("instructors")
      .select(
        "id, name, email, dbs_update_service_expiry, dbs_update_service_reminder_sent_at",
      )
      .eq("dbs_update_service_subscribed", true)
      .eq("dbs_update_service_expiry", targetDate);

    if (error) throw error;

    let sentCount = 0;
    const results: any[] = [];

    for (const inst of instructors || []) {
      const lastSent = (inst as any).dbs_update_service_reminder_sent_at as string | null;
      if (lastSent && lastSent > thresholdIso) continue;
      if (!inst.email) continue;

      const expiryFmt = new Date(inst.dbs_update_service_expiry as string).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
      );

      try {
        await resend.emails.send({
          from: "EveryDriver <noreply@everydriver.co.uk>",
          reply_to: "hello@everydriver.co.uk",
          to: [inst.email],
          subject: "Your DBS Update Service subscription expires in 30 days",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1f;">
              <h2 style="color:#1a1a1f;">DBS Update Service renewal reminder</h2>
              <p>Hi ${inst.name || "there"},</p>
              <p>Your DBS Update Service subscription is due to expire on
                 <strong>${expiryFmt}</strong> (in 30 days).</p>
              <p>To keep your enhanced background check continuously valid,
                 please renew your subscription before it lapses.</p>
              <p>
                <a href="https://www.gov.uk/dbs-update-service"
                   style="display:inline-block;background:#2B7BC8;color:#fff;
                          padding:10px 16px;border-radius:8px;text-decoration:none;
                          font-weight:600;">Renew on GOV.UK</a>
              </p>
              <p style="margin-top:18px;font-size:13px;color:#555;">
                Once renewed, update your expiry date in EveryDriver:
                <a href="https://everydriver.co/instructor/settings/profile">
                  Update your details</a>.
              </p>
              <p style="margin-top:24px;font-size:12px;color:#999;">
                — EveryDriver compliance reminders
              </p>
            </div>
          `,
        });

        await supabase
          .from("instructors")
          .update({ dbs_update_service_reminder_sent_at: new Date().toISOString() })
          .eq("id", inst.id);

        sentCount++;
        results.push({ id: inst.id, status: "sent" });
      } catch (e) {
        console.error(`DBS update reminder failed for ${inst.email}:`, e);
        results.push({ id: inst.id, status: "failed", error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, sentCount, total: instructors?.length ?? 0, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-dbs-update-service-reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
