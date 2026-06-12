import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

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

    const target = new Date();
    target.setUTCHours(0, 0, 0, 0);
    target.setUTCDate(target.getUTCDate() + 30);
    const targetDate = target.toISOString().slice(0, 10);

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
        await sendBrandedEmail({
          to: inst.email,
          subject: "Your DBS Update Service subscription expires in 30 days",
          heading: "DBS Update Service renewal reminder",
          preview: `Your DBS Update Service expires on ${expiryFmt}`,
          intro: `Hi ${inst.name || "there"},`,
          paragraphs: [
            `Your DBS Update Service subscription is due to expire on ${expiryFmt} (in 30 days).`,
            "To keep your enhanced background check continuously valid, please renew your subscription before it lapses.",
            "Once renewed, update your expiry date in your EveryDriver instructor settings.",
          ],
          ctaLabel: "Renew on GOV.UK",
          ctaUrl: "https://www.gov.uk/dbs-update-service",
          footerNote: "EveryDriver compliance reminders",
          idempotencyKey: `dbs-update-30d-${inst.id}-${targetDate}`,
        }, supabase);

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
