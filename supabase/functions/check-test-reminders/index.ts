import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REMINDER_DAYS = [7, 3, 1];

type TestKind = "theory" | "driving";

interface PupilRow {
  id: string;
  name: string;
  instructor_id: string;
  theory_test_date: string | null;
  theory_test_passed: boolean | null;
  test_date: string | null;
  test_passed: boolean | null;
}

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "EveryDriver <notifications@everydriver.co.uk>",
      reply_to: "hello@everydriver.co.uk",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look ahead 7 days
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 7);
    const horizonStr = horizon.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const { data: pupils, error } = await supabase
      .from("pupils")
      .select("id, name, instructor_id, theory_test_date, theory_test_passed, test_date, test_passed")
      .or(
        `and(theory_test_date.gte.${todayStr},theory_test_date.lte.${horizonStr},theory_test_passed.is.null),` +
        `and(test_date.gte.${todayStr},test_date.lte.${horizonStr},test_passed.is.null)`,
      );

    if (error) throw error;

    // Cache instructor info per id
    const instructorCache = new Map<string, { id: string; name: string; email: string | null }>();
    async function getInstructor(id: string) {
      if (instructorCache.has(id)) return instructorCache.get(id)!;
      const { data } = await supabase
        .from("instructors")
        .select("id, name, email")
        .eq("id", id)
        .maybeSingle();
      const row = data ?? { id, name: "Instructor", email: null };
      instructorCache.set(id, row);
      return row;
    }

    let sent = 0;

    const process = async (pupil: PupilRow, kind: TestKind, dateStr: string) => {
      const testDate = new Date(dateStr);
      testDate.setHours(0, 0, 0, 0);
      const days = Math.ceil((testDate.getTime() - today.getTime()) / 86400000);
      if (!REMINDER_DAYS.includes(days)) return;

      // Already sent?
      const { data: existing } = await supabase
        .from("test_reminders_log")
        .select("id")
        .eq("pupil_id", pupil.id)
        .eq("test_type", kind)
        .eq("test_date", dateStr)
        .eq("days_before", days)
        .limit(1)
        .maybeSingle();
      if (existing) return;

      const instructor = await getInstructor(pupil.instructor_id);
      const label = kind === "theory" ? "Theory test" : "Driving test";
      const whenText =
        days === 1 ? "tomorrow" : days === 3 ? "in 3 days" : "in 7 days";
      const formattedDate = new Date(dateStr).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const title = `${label} ${whenText}: ${pupil.name}`;
      const message = `${pupil.name}'s ${label.toLowerCase()} is ${whenText} (${formattedDate}).`;

      // In-app notification
      await supabase.from("instructor_notifications").insert({
        instructor_id: instructor.id,
        title,
        message,
        type: days === 1 ? "warning" : "info",
        action_url: `/instructor/pupils?pupil=${pupil.id}`,
        metadata: { pupil_id: pupil.id, test_type: kind, test_date: dateStr, days_before: days },
      });
      await supabase.from("test_reminders_log").insert({
        instructor_id: instructor.id,
        pupil_id: pupil.id,
        test_type: kind,
        test_date: dateStr,
        days_before: days,
        sent_via: "in_app",
      });
      sent++;

      // Email
      const emailGate = await shouldSendToInstructor(supabase, instructor.id, {
        category: "system", channel: "email", importance: "important",
      });
      if (emailGate.allow && resendApiKey && instructor.email) {
        try {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;">
              <h2 style="color:${days === 1 ? "#dc2626" : "#3b82f6"};">${label} ${whenText}</h2>
              <p>Hi ${instructor.name},</p>
              <p><strong>${pupil.name}</strong> has a <strong>${label.toLowerCase()}</strong> booked for <strong>${formattedDate}</strong>${days === 1 ? " (tomorrow)" : ""}.</p>
              <p>Make sure they're prepared and you've blocked out the time.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
              <p style="color:#6b7280;font-size:12px;">Automated reminder from EveryDriver.</p>
            </div>`;
          await sendEmail(resendApiKey, instructor.email, title, html);
          await supabase.from("test_reminders_log").insert({
            instructor_id: instructor.id,
            pupil_id: pupil.id,
            test_type: kind,
            test_date: dateStr,
            days_before: days,
            sent_via: "email",
          });
          sent++;
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }
    };

    for (const p of (pupils as PupilRow[] | null) ?? []) {
      if (p.theory_test_date && p.theory_test_passed == null) {
        await process(p, "theory", p.theory_test_date);
      }
      if (p.test_date && p.test_passed == null) {
        await process(p, "driving", p.test_date);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, scanned: pupils?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("check-test-reminders error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
