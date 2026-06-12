import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { shouldSendToInstructor } from "../_shared/notify-gate.ts";
import { PushDataType, NotifyCategory, NotifyImportance } from "../_shared/notification-types.ts";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://everydriver.co.uk";


interface OfferEvent {
  kind: "offer_received";
  record: {
    id: string;
    test_request_id: string;
    offered_test_centre_name?: string | null;
    offered_test_date?: string | null;
    offered_test_time?: string | null;
    status?: string;
  };
}

interface HavePostedEvent {
  kind: "have_test_posted";
  record: {
    id: string;
    instructor_id: string;
    test_centre_id?: string | null;
    test_centre_name?: string | null;
    test_date?: string | null;
    test_time?: string | null;
    request_type: string;
    status: string;
  };
}

type Event = OfferEvent | HavePostedEvent;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

async function sendPush(_supabase: ReturnType<typeof createClient>, instructorId: string, title: string, body: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        instructorId,
        category: NotifyCategory.TEST_SWAP,
        importance: NotifyImportance.IMPORTANT,
        notification: {
          title,
          body,
          tag: "test-swap-match",
          data: { type: PushDataType.TEST_SWAP_MATCH, url: "/instructor/test-requests" },
        },
      }),
    });
  } catch (e) {
    console.error("push send error", e);
  }
}

async function sendEmail(
  supabase: ReturnType<typeof createClient>,
  instructor: { name?: string | null; email?: string | null },
  title: string,
  body: string,
  idempotencyKey: string,
) {
  if (!instructor.email) return;
  try {
    await sendBrandedEmail({
      to: instructor.email,
      subject: title,
      heading: `🔁 ${title}`,
      intro: body,
      ctaLabel: "View test swaps",
      ctaUrl: `${APP_URL}/instructor/test-requests`,
      footerNote: "You can change notification preferences in Settings → Notifications.",
      idempotencyKey,
    }, supabase);
  } catch (e) {
    console.error("email send error", e);
  }
}


async function notifyInstructor(
  supabase: ReturnType<typeof createClient>,
  instructorId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown>,
) {
  // Always insert in-app notification (powers the badge + list)
  await supabase.from("instructor_notifications").insert({
    instructor_id: instructorId,
    type: "test_swap_match",
    title,
    message,
    action_url: "/instructor/test-requests",
    metadata,
  });

  // Lookup instructor for email
  const { data: instructor } = await supabase
    .from("instructors")
    .select("name, email")
    .eq("id", instructorId)
    .maybeSingle();

  // Push (gated). INTENTIONAL: category is "test_swap" (not "job") so the
  // job_min_value_pounds gate cannot suppress time-sensitive test-swap pushes
  // for instructors with a minimum job-value filter set. Confirmed in 4c-tail.
  const pushGate = await shouldSendToInstructor(supabase, instructorId, {
    category: NotifyCategory.TEST_SWAP,
    channel: "push",
    importance: NotifyImportance.IMPORTANT,
  });
  if (pushGate.allow) {
    await sendPush(supabase, instructorId, title, message);
  }

  // Email (gated)
  const emailGate = await shouldSendToInstructor(supabase, instructorId, {
    category: NotifyCategory.TEST_SWAP,
    channel: "email",
    importance: NotifyImportance.IMPORTANT,
  });
  if (emailGate.allow && instructor?.email) {
    await sendEmail(instructor as any, title, message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const evt = (await req.json()) as Event;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    if (evt.kind === "offer_received") {
      const o = evt.record;
      if (o.status && o.status !== "pending") {
        return new Response(JSON.stringify({ ok: true, skipped: "non-pending" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: tr } = await supabase
        .from("test_requests")
        .select("instructor_id, test_centre_name")
        .eq("id", o.test_request_id)
        .maybeSingle();
      if (!tr?.instructor_id) {
        return new Response(JSON.stringify({ ok: false, reason: "no test_request" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const centre = o.offered_test_centre_name || tr.test_centre_name || "a test centre";
      const when = `${fmtDate(o.offered_test_date)}${o.offered_test_time ? ` at ${o.offered_test_time}` : ""}`;
      await notifyInstructor(
        supabase,
        tr.instructor_id,
        "New test swap offer",
        `${centre}${when ? ` — ${when}` : ""}`,
        { offer_id: o.id, test_request_id: o.test_request_id },
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (evt.kind === "have_test_posted") {
      const r = evt.record;
      if (r.request_type !== "have_test" || r.status !== "active") {
        return new Response(JSON.stringify({ ok: true, skipped: "not active have_test" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find instructors with active want_test at the same centre (excluding the poster)
      let q = supabase
        .from("test_requests")
        .select("instructor_id, test_centre_name")
        .eq("request_type", "want_test")
        .eq("status", "active")
        .neq("instructor_id", r.instructor_id);
      if (r.test_centre_id) {
        q = q.eq("test_centre_id", r.test_centre_id);
      } else if (r.test_centre_name) {
        q = q.ilike("test_centre_name", r.test_centre_name);
      } else {
        return new Response(JSON.stringify({ ok: true, skipped: "no centre" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: matches } = await q;
      const instructorIds = [...new Set((matches || []).map((m: any) => m.instructor_id).filter(Boolean))];
      const centre = r.test_centre_name || "a wanted centre";
      const when = `${fmtDate(r.test_date)}${r.test_time ? ` at ${r.test_time}` : ""}`;

      await Promise.all(
        instructorIds.map((id) =>
          notifyInstructor(
            supabase,
            id as string,
            "Test slot match available",
            `${centre}${when ? ` — ${when}` : ""}`,
            { test_request_id: r.id, source: "have_test_posted" },
          ),
        ),
      );

      return new Response(JSON.stringify({ ok: true, notified: instructorIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "unknown kind" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-test-swap-match error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
