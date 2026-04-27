import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PupilRow {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_opt_in: boolean | null;
  instructor_id: string;
}

interface InstructorRow {
  id: string;
  name: string | null;
  slug: string | null;
  auto_reengage_dormant: boolean;
}

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get(
  "TWILIO_MESSAGING_SERVICE_SID"
);
const WHATSAPP_BUSINESS_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

const PER_INSTRUCTOR_DAILY_CAP = 5;
const DORMANT_DAYS = 21;
const RESEND_COOLDOWN_DAYS = 30;

async function sendSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { ok: false, error: "Twilio not configured" };
  }
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const params = new URLSearchParams({ To: to, Body: body });
  if (TWILIO_MESSAGING_SERVICE_SID) {
    params.set("MessagingServiceSid", TWILIO_MESSAGING_SERVICE_SID);
  } else if (TWILIO_PHONE_NUMBER) {
    params.set("From", TWILIO_PHONE_NUMBER);
  } else {
    return { ok: false, error: "No Twilio sender" };
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  if (!res.ok) {
    return { ok: false, error: `Twilio ${res.status}: ${await res.text()}` };
  }
  return { ok: true };
}

async function sendWhatsApp(
  to: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!WHATSAPP_BUSINESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, error: "WhatsApp not configured" };
  }
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_BUSINESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { body },
      }),
    }
  );
  if (!res.ok) {
    return { ok: false, error: `WhatsApp ${res.status}: ${await res.text()}` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 1. Get instructors who opted in
  const { data: instructors, error: instErr } = await supabase
    .from("instructors")
    .select("id, name, slug, auto_reengage_dormant")
    .eq("auto_reengage_dormant", true);

  if (instErr) {
    console.error("[dormant-reengage] instructor fetch failed", instErr);
    return new Response(JSON.stringify({ error: instErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cutoff = new Date(Date.now() - DORMANT_DAYS * 86400000)
    .toISOString()
    .slice(0, 10);
  const cooldown = new Date(Date.now() - RESEND_COOLDOWN_DAYS * 86400000).toISOString();

  let totalSent = 0;
  let totalSkipped = 0;
  const summary: Array<{ instructor: string; sent: number }> = [];

  for (const instructor of (instructors ?? []) as InstructorRow[]) {
    // Daily cap per instructor
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count: sentToday } = await supabase
      .from("pupil_reengagement_log")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructor.id)
      .gte("sent_at", dayStart.toISOString());

    let remaining = PER_INSTRUCTOR_DAILY_CAP - (sentToday ?? 0);
    if (remaining <= 0) {
      summary.push({ instructor: instructor.id, sent: 0 });
      continue;
    }

    // Active pupils for this instructor
    const { data: pupils } = await supabase
      .from("pupils")
      .select("id, name, phone, whatsapp_opt_in, instructor_id")
      .eq("instructor_id", instructor.id)
      .eq("status", "active")
      .is("deleted_at", null);

    let sentForInstructor = 0;

    for (const pupil of (pupils ?? []) as PupilRow[]) {
      if (remaining <= 0) break;
      if (!pupil.phone) {
        totalSkipped++;
        continue;
      }

      // Cooldown: skip if messaged in last 30 days
      const { count: recent } = await supabase
        .from("pupil_reengagement_log")
        .select("id", { count: "exact", head: true })
        .eq("pupil_id", pupil.id)
        .gte("sent_at", cooldown);
      if ((recent ?? 0) > 0) {
        totalSkipped++;
        continue;
      }

      // Last non-cancelled lesson must be older than cutoff (or none at all)
      const { data: lastLesson } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("pupil_id", pupil.id)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: false })
        .limit(1);
      const lastDate = lastLesson?.[0]?.lesson_date;
      if (lastDate && lastDate >= cutoff) {
        totalSkipped++;
        continue;
      }

      const instructorName = instructor.name ?? "your instructor";
      const link = instructor.slug
        ? `https://drive365.co.uk/i/${instructor.slug}`
        : `https://drive365.co.uk`;
      const body = `Hi ${pupil.name}, it's ${instructorName} — been a while! Reply BOOK to grab a slot, or tap ${link} to view my diary.`;

      const useWhatsApp = pupil.whatsapp_opt_in && pupil.phone.startsWith("+");
      const channel: "sms" | "whatsapp" = useWhatsApp ? "whatsapp" : "sms";
      const result = useWhatsApp
        ? await sendWhatsApp(pupil.phone, body)
        : await sendSms(pupil.phone, body);

      await supabase.from("pupil_reengagement_log").insert({
        pupil_id: pupil.id,
        instructor_id: instructor.id,
        channel,
        message_template: "dormant_21d_v1",
        message_body: body,
        status: result.ok ? "sent" : "failed",
        error: result.error,
      });

      if (result.ok) {
        await supabase.from("funnel_events").insert({
          instructor_id: instructor.id,
          event_name: "reengagement_sent",
          event_data: { pupil_id: pupil.id, channel },
        });
        sentForInstructor++;
        totalSent++;
        remaining--;
      }
    }

    summary.push({ instructor: instructor.id, sent: sentForInstructor });
  }

  return new Response(
    JSON.stringify({ ok: true, totalSent, totalSkipped, summary }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
