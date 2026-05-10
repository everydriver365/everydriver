// Twilio voice webhook — returns TwiML to dial mobile or AI inbound
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const form = await req.formData();
    const to = String(form.get("To") ?? "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: row } = await admin
      .from("instructor_phone_numbers")
      .select("instructor_id, routing_mode, forward_to_mobile")
      .eq("phone_number", to)
      .eq("status", "active")
      .maybeSingle();

    if (!row) return twiml(`<Say>This number isn't configured.</Say><Hangup/>`);

    let target: "ai" | "mobile" = row.routing_mode === "ai" ? "ai" : "mobile";
    if (row.routing_mode === "schedule") {
      const now = new Date();
      const before = 15, after = 15; // sensible defaults; refined buffers can be added later
      const windowStart = new Date(now.getTime() - after * 60_000);
      const windowEnd = new Date(now.getTime() + before * 60_000);
      const today = now.toISOString().slice(0, 10);
      const { data: lessons } = await admin
        .from("scheduled_lessons")
        .select("id,start_time,duration_minutes,lesson_date")
        .eq("instructor_id", row.instructor_id)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .is("deleted_at", null);
      const inLesson = (lessons ?? []).some((l: any) => {
        const start = new Date(`${l.lesson_date}T${l.start_time}`);
        const end = new Date(start.getTime() + (l.duration_minutes ?? 60) * 60_000);
        return start <= windowEnd && end >= windowStart;
      });
      target = inLesson ? "ai" : "mobile";
    }

    if (target === "mobile" && row.forward_to_mobile) {
      return twiml(`<Dial>${escapeXml(row.forward_to_mobile)}</Dial>`);
    }

    const aiInbound = Deno.env.get("FAMULOR_INBOUND_NUMBER");
    if (aiInbound) return twiml(`<Dial>${escapeXml(aiInbound)}</Dial>`);

    return twiml(`<Say>Sorry, the AI receptionist isn't available right now. Please call back later.</Say><Hangup/>`);
  } catch (e) {
    console.error("voice-router error", e);
    return twiml(`<Say>Sorry, an error occurred.</Say><Hangup/>`);
  }
});

function twiml(inner: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
