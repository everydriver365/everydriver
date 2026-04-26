import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instructorIds, sendAll } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch instructors
    let query = supabase
      .from("instructors")
      .select("id, name, email, phone, adi_badge_expiry, car_insurance_expiry, car_mot_expiry, car_tax_expiry, dbs_certificate_expiry");

    if (!sendAll && instructorIds?.length) {
      query = query.in("id", instructorIds);
    }

    const { data: instructors, error } = await query;
    if (error) throw error;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const docTypes = [
      { key: "adi_badge_expiry", label: "ADI Badge" },
      { key: "car_insurance_expiry", label: "Car Insurance" },
      { key: "car_mot_expiry", label: "MOT" },
      { key: "car_tax_expiry", label: "Road Tax" },
      { key: "dbs_certificate_expiry", label: "DBS Certificate" },
    ];

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;
    const messagingSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

    let sentCount = 0;

    for (const instructor of instructors || []) {
      const expiringDocs: { label: string; expiry: string; daysLeft: number }[] = [];

      for (const doc of docTypes) {
        const expiryStr = (instructor as any)[doc.key];
        if (!expiryStr) continue;
        const expiry = new Date(expiryStr);
        if (expiry <= thirtyDaysFromNow) {
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expiringDocs.push({ label: doc.label, expiry: expiryStr, daysLeft });
        }
      }

      if (expiringDocs.length === 0) continue;

      // Check if reminders already sent today
      const today = now.toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("compliance_reminders")
        .select("id")
        .eq("instructor_id", instructor.id)
        .gte("sent_at", `${today}T00:00:00Z`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const docList = expiringDocs
        .map((d) => `• ${d.label}: ${d.daysLeft <= 0 ? "EXPIRED" : `${d.daysLeft} days left`}`)
        .join("\n");

      const message = `Hi ${instructor.name}, the following documents need attention:\n${docList}\nPlease update them as soon as possible.`;

      // Send SMS
      if (instructor.phone) {
        try {
          const body = new URLSearchParams({
            To: instructor.phone,
            Body: message,
            ...(messagingSid ? { MessagingServiceSid: messagingSid } : { From: fromNumber }),
          });
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          });
        } catch (e) {
          console.error(`SMS failed for ${instructor.name}:`, e);
        }
      }

      // Send email
      if (instructor.email) {
        try {
          await resend.emails.send({
            from: "EveryDriver <noreply@everydriver.co.uk>",
            to: [instructor.email],
            subject: "Document Expiry Reminder - EveryDriver",
            html: `<h2>Document Expiry Reminder</h2><p>Hi ${instructor.name},</p><p>The following documents need your attention:</p><ul>${expiringDocs.map((d) => `<li><strong>${d.label}</strong>: ${d.daysLeft <= 0 ? "<span style='color:red'>EXPIRED</span>" : `${d.daysLeft} days remaining`}</li>`).join("")}</ul><p>Please update them at your earliest convenience.</p>`,
          });
        } catch (e) {
          console.error(`Email failed for ${instructor.name}:`, e);
        }
      }

      // Log reminders
      for (const doc of expiringDocs) {
        await supabase.from("compliance_reminders").insert({
          instructor_id: instructor.id,
          reminder_type: doc.label.toLowerCase().replace(/ /g, "_"),
          sent_via: "both",
          expiry_date: doc.expiry,
          days_before: Math.max(0, doc.daysLeft),
        });
      }

      sentCount++;
    }

    return new Response(JSON.stringify({ success: true, sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Compliance reminders error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
