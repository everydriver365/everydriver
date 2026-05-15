import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Drive365 Test Swap <noreply@drive365.co.uk>";
const ADMIN_BCC = Deno.env.get("ADMIN_ENQUIRY_EMAIL") || "enquiries@drive365.co.uk";

const D365_PRIMARY = "#142040";
const D365_ACCENT = "#2B7BC8";
const D365_TEXT = "#0f172a";
const D365_TEXT_MUTED = "#5b6577";
const D365_BORDER = "#e3e7ee";

interface Body {
  requesterSignupId: string;
  targetSignupId: string;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shell(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${D365_TEXT};">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#fff;border:1px solid ${D365_BORDER};border-radius:16px;padding:28px;">
        <div style="font-size:12px;color:${D365_ACCENT};font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Drive365 · Test Swap</div>
        <h1 style="margin:0 0 16px;color:${D365_PRIMARY};font-size:22px;">${esc(title)}</h1>
        ${inner}
      </div>
      <div style="text-align:center;color:${D365_TEXT_MUTED};font-size:12px;margin-top:16px;">
        Drive365 · You're receiving this because you registered for a free test swap match.
      </div>
    </div>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_KEY) throw new Error("RESEND_API_KEY not configured");
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

    // Defence-in-depth compatibility check (RPC also enforces)
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

    const resend = new Resend(RESEND_KEY);
    const meFirst = (me.full_name || "").split(" ")[0] || "Someone";
    const themFirst = (them.full_name || "").split(" ")[0] || "there";

    // Email to slot owner with requester's contact details
    const ownerHtml = shell(
      `${esc(meFirst)} would like to swap tests with you`,
      `
        <p style="margin:0 0 16px;">Good news — another learner registered with Drive365 Test Swap thinks your test date could work for them, and theirs could work for you.</p>

        <div style="border:1px solid ${D365_BORDER};border-radius:12px;padding:16px;margin:16px 0;">
          <div style="font-weight:600;margin-bottom:8px;">${esc(meFirst)}'s details</div>
          <div style="color:${D365_TEXT_MUTED};font-size:14px;line-height:1.6;">
            <div><strong style="color:${D365_TEXT};">Name:</strong> ${esc(me.full_name)}</div>
            <div><strong style="color:${D365_TEXT};">Phone:</strong> <a href="tel:${esc(me.phone)}" style="color:${D365_ACCENT};text-decoration:none;">${esc(me.phone)}</a></div>
            <div><strong style="color:${D365_TEXT};">Email:</strong> <a href="mailto:${esc(me.email)}" style="color:${D365_ACCENT};text-decoration:none;">${esc(me.email)}</a></div>
          </div>
        </div>

        <div style="border:1px solid ${D365_BORDER};border-radius:12px;padding:16px;margin:16px 0;">
          <div style="font-weight:600;margin-bottom:8px;">Their current test</div>
          <div style="color:${D365_TEXT_MUTED};font-size:14px;line-height:1.6;">
            ${me.has_test_booked ? `
              <div>${esc(me.current_centre_name || "—")}</div>
              <div>${fmtDate(me.current_test_date)} ${me.current_test_time ? `at ${esc(String(me.current_test_time).slice(0,5))}` : ""}</div>
            ` : `<div>They haven't booked a test yet — they're looking to take yours.</div>`}
            <div style="margin-top:6px;">Wants a date between <strong style="color:${D365_TEXT};">${fmtDate(me.earliest_new_date)}</strong> and <strong style="color:${D365_TEXT};">${fmtDate(me.latest_new_date)}</strong>.</div>
            ${me.notes ? `<div style="margin-top:8px;font-style:italic;">"${esc(me.notes)}"</div>` : ""}
          </div>
        </div>

        <p style="margin:16px 0 0;color:${D365_TEXT_MUTED};font-size:13px;">Please contact ${esc(meFirst)} directly to arrange the swap on the DVSA website. Drive365 doesn't change your booking for you.</p>
      `,
    );

    const requesterHtml = shell(
      `We've passed your details to ${esc(themFirst)}`,
      `
        <p style="margin:0 0 16px;">Thanks ${esc(meFirst)} — we've just emailed ${esc(themFirst)} your name, phone and email so they can get in touch about swapping driving test slots.</p>
        <div style="border:1px solid ${D365_BORDER};border-radius:12px;padding:16px;margin:16px 0;">
          <div style="font-weight:600;margin-bottom:8px;">Their test</div>
          <div style="color:${D365_TEXT_MUTED};font-size:14px;line-height:1.6;">
            <div>${esc(them.current_centre_name || "—")}</div>
            <div>${fmtDate(them.current_test_date)} ${them.current_test_time ? `at ${esc(String(them.current_test_time).slice(0,5))}` : ""}</div>
          </div>
        </div>
        <p style="margin:16px 0 0;color:${D365_TEXT_MUTED};font-size:13px;">If you don't hear back within a couple of days, log in to your matches page and pick another swapper. You can request as many as you like.</p>
      `,
    );

    const sends = await Promise.allSettled([
      resend.emails.send({
        from: FROM,
        to: them.email,
        bcc: ADMIN_BCC,
        subject: `${meFirst} wants to swap driving test slots with you`,
        reply_to: me.email,
        html: ownerHtml,
      }),
      resend.emails.send({
        from: FROM,
        to: me.email,
        subject: `We've sent your swap request to ${themFirst}`,
        html: requesterHtml,
      }),
    ]);

    const failures = sends.filter((s) => s.status === "rejected");
    if (failures.length) console.error("Email failures", failures);

    return new Response(JSON.stringify({ ok: true, sent: sends.length - failures.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-public-test-swap-request error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "Unknown" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
