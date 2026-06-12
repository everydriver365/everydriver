// send-deletion-reminders
// Daily cron. Sends T+7, T+25, and T+29 reminder emails to instructors whose
// account is pending deletion. At T+25 also notifies pupils with an auth
// account. At T+29 the cancel link is omitted (within 24h of purge).
//
// Idempotency: a row in account_deletion_reminders_sent prevents
// re-sending the same reminder kind.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_NAME = "EveryDriver";
const SUPPORT_EMAIL = "support@everydriver.co.uk";


// ---------- crypto / email helpers (mirror request-account-deletion) ----------
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

async function aesDecryptEmail(stored: string, keyMaterial: string): Promise<string | null> {
  try {
    if (!stored.startsWith("v1:")) return null;
    const bytes = b64urlDecode(stored.slice(3));
    const iv = bytes.slice(0, 12);
    const ct = bytes.slice(12);
    const keyBytes = await sha256(keyMaterial);
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

// Email content is built inline in the handler using sendBrandedEmail.


// ---------- handler ----------
interface ReminderRow {
  id: string;
  instructor_id: string;
  sentinel_uuid: string;
  scheduled_purge_at: string;
  requested_at: string;
  contact_email_encrypted: string | null;
  cancel_token: string | null;
}

function daysSince(requestedAt: string): number {
  const ms = Date.now() - new Date(requestedAt).getTime();
  return Math.floor(ms / 86400000);
}

function cancelUrlFor(token: string | null): string | null {
  if (!token) return null;
  const base = Deno.env.get("ACCOUNT_DELETION_CANCEL_BASE_URL") || "https://everydriver.co";
  return `${base.replace(/\/$/, "")}/cancel-deletion?token=${encodeURIComponent(token)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EMAIL_KEY = Deno.env.get("ACCOUNT_DELETION_EMAIL_KEY");
    if (!EMAIL_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rows, error } = await admin
      .from("account_deletion_requests")
      .select("id, instructor_id, sentinel_uuid, scheduled_purge_at, requested_at, contact_email_encrypted, cancel_token")
      .is("cancelled_at", null)
      .is("completed_at", null);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { id: string; kind: string; sent: boolean; detail?: string }[] = [];

    for (const r of (rows as ReminderRow[] | null) || []) {
      const elapsed = daysSince(r.requested_at);
      let kind: "t7" | "t25" | "t29" | null = null;
      if (elapsed === 7) kind = "t7";
      else if (elapsed === 25) kind = "t25";
      else if (elapsed === 29) kind = "t29";
      if (!kind) continue;

      // Idempotency check
      const { data: alreadySent } = await admin
        .from("account_deletion_reminders_sent")
        .select("id")
        .eq("deletion_request_id", r.id)
        .eq("kind", kind)
        .maybeSingle();
      if (alreadySent) {
        results.push({ id: r.id, kind, sent: false, detail: "already sent" });
        continue;
      }

      const scheduledDate = new Date(r.scheduled_purge_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
      const cancelUrl = kind === "t29" ? null : cancelUrlFor(r.cancel_token);

      // Instructor reminder
      let sentOk = true;
      let detail: string | undefined;
      if (r.contact_email_encrypted) {
        const email = await aesDecryptEmail(r.contact_email_encrypted, EMAIL_KEY);
        if (email) {
          try {
            const subject =
              kind === "t7" ? "Reminder — your account will be deleted in 23 days" :
              kind === "t25" ? "Final warning — your account will be deleted in 5 days" :
              "Last chance — your account will be deleted tomorrow";
            const result = await sendBrandedEmail({
              to: email,
              subject,
              heading: subject,
              intro: `Your ${APP_NAME} instructor account is scheduled for permanent deletion on ${scheduledDate}.`,
              paragraphs: [
                "After that date, all your operational data will be removed and cannot be recovered. Anonymised financial records will be retained for 6 years as required by HMRC.",
                ...(cancelUrl ? [] : [`Cancellation is no longer available online. Please contact ${SUPPORT_EMAIL} immediately if you need to stop this deletion.`]),
              ],
              ctaLabel: cancelUrl ? "Cancel deletion" : null,
              ctaUrl: cancelUrl,
              idempotencyKey: `acct-del-rem-${r.id}-${kind}`,
            }, admin);
            if (result.enqueued === 0) { sentOk = false; detail = result.errors.join("; "); }
          } catch (e) {
            sentOk = false;
            detail = e instanceof Error ? e.message : String(e);
          }
        }
      }

      // T+25: also email pupils with auth accounts
      if (kind === "t25" && sentOk) {
        try {
          const { data: pupils } = await admin
            .from("pupils")
            .select("auth_user_id")
            .eq("instructor_id", r.instructor_id)
            .not("auth_user_id", "is", null);
          const ids = ((pupils as { auth_user_id: string }[] | null) || [])
            .map((p) => p.auth_user_id).filter(Boolean);
          for (const id of ids) {
            try {
              const { data: u } = await admin.auth.admin.getUserById(id);
              const pe = u?.user?.email;
              if (pe) {
                await sendBrandedEmail({
                  to: pe,
                  subject: "Your driving lesson data will be deleted in 5 days",
                  heading: "Your driving lesson data will be deleted in 5 days",
                  intro: `Your driving instructor is closing their ${APP_NAME} account on ${scheduledDate}.`,
                  paragraphs: [
                    `After that date, your lesson, scheduling and progress data linked to them will be removed. Your ${APP_NAME} login (if you have one) is unaffected.`,
                    `Questions? Contact ${SUPPORT_EMAIL}.`,
                  ],
                  idempotencyKey: `acct-del-pupwarn-${r.id}-${id}`,
                }, admin);
              }
            } catch (e) {
              console.error("[send-deletion-reminders] pupil email failed:", e);
            }
          }
        } catch (e) {
          console.error("[send-deletion-reminders] pupil lookup failed:", e);
        }
      }


      // Record send
      await admin
        .from("account_deletion_reminders_sent")
        .insert({ deletion_request_id: r.id, kind, sent_ok: sentOk, detail: detail || null });

      results.push({ id: r.id, kind, sent: sentOk, detail });
    }

    return new Response(JSON.stringify({ checked: (rows || []).length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-deletion-reminders] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
