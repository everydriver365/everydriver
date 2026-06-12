import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_BCC = Deno.env.get("ADMIN_ENQUIRY_EMAIL") || "enquiries@everydriver.co.uk";

interface Body { requesterSignupId: string; targetSignupId: string }

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { requesterSignupId, targetSignupId } = (await req.json()) as Body;
    if (!requesterSignupId || !targetSignupId) throw new Error("Missing ids");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: rows, error } = await supabase
      .from("public_test_swap_signups")
      .select("id, full_name, email, phone, current_centre_name, current_test_date, current_test_time, earliest_new_date, latest_new_date, has_test_booked, notes")
      .in("id", [requesterSignupId, targetSignupId]);
    if (error) throw error;

    const me = rows?.find((r: any) => r.id === requesterSignupId);
    const them = rows?.find((r: any) => r.id === targetSignupId);
    if (!me || !them) throw new Error("Signups not found");

    // Defence-in-depth compatibility check
    const themDate = them.current_test_date ? new Date(them.current_test_date) : null;
    const myEarliest = new Date(me.earliest_new_date);
    const myLatest = new Date(me.latest_new_date);
    if (!themDate || themDate < myEarliest || themDate > myLatest) {
      throw new Error("Their test date no longer fits your window");
    }
    if (me.has_test_booked && me.current_test_date) {
      const myDate = new Date(me.current_test_date);
      const theirEarliest = new Date(them.earliest_new_date);
      const theirLatest = new Date(them.latest_new_date);
      if (myDate < theirEarliest || myDate > theirLatest) {
        throw new Error("Your test date no longer fits their window");
      }
    }

    const meFirst = (me.full_name || "").split(" ")[0] || "Someone";
    const themFirst = (them.full_name || "").split(" ")[0] || "there";

    const ownerDetails = [
      { label: "Name", value: me.full_name || "—" },
      { label: "Phone", value: me.phone || "—" },
      { label: "Email", value: me.email || "—" },
    ];
    if (me.has_test_booked && me.current_test_date) {
      ownerDetails.push(
        { label: "Their centre", value: me.current_centre_name || "—" },
        { label: "Their test", value: `${fmtDate(me.current_test_date)}${me.current_test_time ? ` at ${String(me.current_test_time).slice(0,5)}` : ""}` },
      );
    }
    ownerDetails.push(
      { label: "Wants between", value: `${fmtDate(me.earliest_new_date)} – ${fmtDate(me.latest_new_date)}` },
    );

    const sends = await Promise.allSettled([
      sendBrandedEmail({
        to: [them.email, ADMIN_BCC],
        subject: `${meFirst} wants to swap driving test slots with you`,
        heading: `${meFirst} would like to swap tests with you`,
        intro: "Another learner registered with EveryDriver Test Swap thinks your test date could work for them, and theirs could work for you.",
        paragraphs: [
          ...(me.has_test_booked ? [] : ["They haven't booked a test yet — they're looking to take yours."]),
          ...(me.notes ? [`Note: ${me.notes}`] : []),
          `Please contact ${meFirst} directly to arrange the swap on the DVSA website. EveryDriver doesn't change your booking for you.`,
        ],
        details: ownerDetails,
        idempotencyKey: `pswap-owner-${requesterSignupId}-${targetSignupId}`,
      }, supabase),
      sendBrandedEmail({
        to: me.email,
        subject: `We've sent your swap request to ${themFirst}`,
        heading: `We've passed your details to ${themFirst}`,
        intro: `Thanks ${meFirst} — we've just emailed ${themFirst} your name, phone and email so they can get in touch about swapping driving test slots.`,
        details: [
          { label: "Their centre", value: them.current_centre_name || "—" },
          { label: "Their test", value: `${fmtDate(them.current_test_date)}${them.current_test_time ? ` at ${String(them.current_test_time).slice(0,5)}` : ""}` },
        ],
        paragraphs: ["If you don't hear back within a couple of days, log in to your matches page and pick another swapper. You can request as many as you like."],
        idempotencyKey: `pswap-requester-${requesterSignupId}-${targetSignupId}`,
      }, supabase),
    ]);

    const failures = sends.filter((s) => s.status === "rejected");
    if (failures.length) console.error("Email failures", failures);

    return new Response(JSON.stringify({ ok: true, sent: sends.length - failures.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-public-test-swap-request error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
