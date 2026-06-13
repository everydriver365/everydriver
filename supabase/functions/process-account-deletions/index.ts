// process-account-deletions
// Daily cron worker. Picks up account_deletion_requests whose
// scheduled_purge_at is due, revokes external provider tokens (best effort),
// runs purge_instructor_data(), deletes the auth user, and emails the
// instructor + any pupils that had auth accounts.
//
// Hard limit: max 10 rows per invocation to keep within edge function
// runtime budget. Remaining rows process on the next cron tick.

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
const MAX_PER_RUN = 10;


// ---------- helpers ----------
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

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
  } catch (e) {
    console.error("[process-account-deletions] decrypt failed:", e);
    return null;
  }
}

// Emails sent via sendBrandedEmail (Lovable Emails).


// ---------- provider revocation (best effort) ----------
type RevocationOutcome = "success" | "failure" | "skipped";
interface RevocationResult {
  outcome: RevocationOutcome;
  detail?: string;
}

async function revokeGoogle(instructorId: string, admin: ReturnType<typeof createClient>): Promise<RevocationResult> {
  try {
    const { data, error } = await admin
      .from("instructor_google_tokens")
      .select("access_token, refresh_token")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (error) return { outcome: "failure", detail: error.message };
    const token = (data as { access_token?: string; refresh_token?: string } | null)
      ?.refresh_token ||
      (data as { access_token?: string; refresh_token?: string } | null)?.access_token;
    if (!token) return { outcome: "skipped", detail: "no token on file" };
    const resp = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `token=${encodeURIComponent(token)}`,
    });
    if (!resp.ok && resp.status !== 400) {
      const txt = await resp.text();
      return { outcome: "failure", detail: `${resp.status} ${txt}` };
    }
    return { outcome: "success" };
  } catch (e) {
    return { outcome: "failure", detail: e instanceof Error ? e.message : String(e) };
  }
}

async function revokeSquare(_instructorId: string, _admin: ReturnType<typeof createClient>): Promise<RevocationResult> {
  return { outcome: "skipped", detail: "Square integration removed" };
}


async function revokeGoCardless(instructorId: string, admin: ReturnType<typeof createClient>): Promise<RevocationResult> {
  const token = Deno.env.get("GOCARDLESS_ACCESS_TOKEN");
  const env = (Deno.env.get("GOCARDLESS_ENVIRONMENT") || "production").toLowerCase();
  if (!token) return { outcome: "skipped", detail: "GoCardless not configured" };
  try {
    const { data: mandates } = await admin
      .from("gocardless_mandates" as never)
      .select("mandate_id")
      .eq("instructor_id", instructorId);
    const mandateList = (mandates as { mandate_id: string }[] | null) || [];
    if (mandateList.length === 0) return { outcome: "skipped", detail: "no mandates on file" };
    const host = env === "sandbox" ? "api-sandbox.gocardless.com" : "api.gocardless.com";
    let failures = 0;
    for (const m of mandateList) {
      const resp = await fetch(`https://${host}/mandates/${encodeURIComponent(m.mandate_id)}/actions/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "GoCardless-Version": "2015-07-06",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: {} }),
      });
      if (!resp.ok && resp.status !== 422) failures += 1;
    }
    if (failures > 0) return { outcome: "failure", detail: `${failures}/${mandateList.length} mandates failed to cancel` };
    return { outcome: "success", detail: `cancelled ${mandateList.length} mandates` };
  } catch (e) {
    return { outcome: "skipped", detail: e instanceof Error ? e.message : "no mandate store" };
  }
}

async function revokeMetaWhatsApp(): Promise<RevocationResult> {
  return { outcome: "skipped", detail: "no per-instructor token to revoke" };
}

async function revokeXeroQuickBooks(): Promise<RevocationResult> {
  return { outcome: "skipped", detail: "not configured" };
}

async function revokeStripe(): Promise<RevocationResult> {
  return { outcome: "skipped", detail: "Stripe not used" };
}

async function runAllRevocations(
  instructorId: string,
  admin: ReturnType<typeof createClient>,
): Promise<Record<string, RevocationResult>> {
  const out: Record<string, RevocationResult> = {};
  out.google = await revokeGoogle(instructorId, admin);
  out.square = await revokeSquare(instructorId, admin);
  out.xero_quickbooks = await revokeXeroQuickBooks();
  out.gocardless = await revokeGoCardless(instructorId, admin);
  out.meta_whatsapp = await revokeMetaWhatsApp();
  out.stripe = await revokeStripe();
  return out;
}

// (Email content inlined into sendBrandedEmail calls below.)


// ---------- worker ----------
interface DeletionRow {
  id: string;
  instructor_id: string;
  sentinel_uuid: string;
  scheduled_purge_at: string;
  contact_email_encrypted: string | null;
  failed_at: string | null;
}

async function processOne(
  row: DeletionRow,
  admin: ReturnType<typeof createClient>,
  emailKey: string,
): Promise<{ ok: boolean; detail?: string }> {
  const { data: instructorRow } = await admin
    .from("instructors")
    .select("auth_user_id, name")
    .eq("id", row.instructor_id)
    .maybeSingle();
  const authUserId = (instructorRow as { auth_user_id?: string; name?: string } | null)?.auth_user_id ?? null;

  let revocationResults: Record<string, RevocationResult> = {};
  try {
    revocationResults = await runAllRevocations(row.instructor_id, admin);
  } catch (e) {
    console.error("[process-account-deletions] revocation phase failed:", e);
    revocationResults = { error: { outcome: "failure", detail: e instanceof Error ? e.message : String(e) } };
  }

  let purgeSummary: unknown = null;
  try {
    const { data, error } = await admin.rpc("purge_instructor_data", {
      p_instructor_id: row.instructor_id,
      p_sentinel_uuid: row.sentinel_uuid,
    });
    if (error) throw error;
    purgeSummary = data;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[process-account-deletions] purge failed for", row.sentinel_uuid, detail);
    await admin
      .from("account_deletion_requests")
      .update({
        failed_at: new Date().toISOString(),
        failure_reason: detail,
        revocation_results: revocationResults,
      })
      .eq("id", row.id);
    await admin.from("data_audit_log").insert({
      action: "instructor_purge_failed",
      target_table: "instructors",
      target_id: row.sentinel_uuid,
      details: { sentinel_uuid: row.sentinel_uuid, reason: detail, revocation_results: revocationResults },
    } as never).then(() => undefined).catch(() => undefined);
    return { ok: false, detail };
  }

  let authDeleteWarning: string | null = null;
  if (authUserId) {
    try {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      if (error) authDeleteWarning = error.message;
    } catch (e) {
      authDeleteWarning = e instanceof Error ? e.message : String(e);
    }
    if (authDeleteWarning) {
      console.warn("[process-account-deletions] auth.deleteUser failed (continuing):", authDeleteWarning);
    }
  }

  await admin
    .from("account_deletion_requests")
    .update({
      completed_at: new Date().toISOString(),
      failed_at: null,
      failure_reason: authDeleteWarning ? `auth.deleteUser warning: ${authDeleteWarning}` : null,
      revocation_results: revocationResults,
      purge_summary: purgeSummary,
    })
    .eq("id", row.id);

  await admin.from("data_audit_log").insert({
    action: "instructor_purge_completed",
    target_table: "instructors",
    target_id: row.sentinel_uuid,
    details: {
      sentinel_uuid: row.sentinel_uuid,
      revocation_results: revocationResults,
      purge_summary: purgeSummary,
      auth_delete_warning: authDeleteWarning,
    },
  } as never).then(() => undefined).catch(() => undefined);

  if (row.contact_email_encrypted) {
    const instructorEmail = await aesDecryptEmail(row.contact_email_encrypted, emailKey);
    if (instructorEmail) {
      try {
        await sendBrandedEmail({
          to: instructorEmail,
          subject: "Your account has been permanently deleted",
          heading: "Your account has been permanently deleted",
          intro: `Your ${APP_NAME} instructor account and personal data have been permanently deleted as requested.`,
          paragraphs: [
            "What was deleted:\n• Your login and account profile\n• Your pupils, lesson schedule, calendar, and operational data\n• Linked accounts with Google, Square, GoCardless and other providers",
            "What was retained:\n• Anonymised financial records (payments, invoices, MTD submissions) retained for 6 years as required by HMRC\n• A non-identifying audit log entry confirming the deletion was completed",
            `Questions? Contact ${SUPPORT_EMAIL}.`,
          ],
          idempotencyKey: `acct-del-done-${row.id}`,
        }, admin);
      } catch (e) {
        console.error("[process-account-deletions] instructor email failed:", e);
      }
    }
  }

  const notifiedAuthIds = ((purgeSummary as { notified_pupil_auth_ids?: string[] } | null)?.notified_pupil_auth_ids) || [];
  for (const pupilAuthId of notifiedAuthIds) {
    if (!pupilAuthId) continue;
    try {
      const { data: u } = await admin.auth.admin.getUserById(pupilAuthId);
      const pupilEmail = u?.user?.email;
      if (pupilEmail) {
        await sendBrandedEmail({
          to: pupilEmail,
          subject: "Your driving lesson data has been deleted",
          heading: "Your driving lesson data has been deleted",
          intro: `Your driving instructor has closed their ${APP_NAME} account, and your lesson, scheduling, and progress data linked to them has been removed.`,
          paragraphs: [
            `Your ${APP_NAME} login (if you have one) is unaffected — you can still sign in and use the app with any other instructor.`,
            `Questions? Contact ${SUPPORT_EMAIL}.`,
          ],
          idempotencyKey: `acct-del-pupil-${row.id}-${pupilAuthId}`,
        }, admin);
      }
    } catch (e) {
      console.error("[process-account-deletions] pupil email failed:", e);
    }
  }


  return { ok: true };
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

    const nowIso = new Date().toISOString();
    const { data: rows, error } = await admin
      .from("account_deletion_requests")
      .select("id, instructor_id, sentinel_uuid, scheduled_purge_at, contact_email_encrypted, failed_at")
      .lte("scheduled_purge_at", nowIso)
      .is("cancelled_at", null)
      .is("completed_at", null)
      .order("scheduled_purge_at", { ascending: true })
      .limit(MAX_PER_RUN);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = (rows as DeletionRow[] | null) || [];
    const results: { sentinel_uuid: string; ok: boolean; detail?: string }[] = [];
    for (const r of list) {
      const res = await processOne(r, admin, EMAIL_KEY);
      results.push({ sentinel_uuid: r.sentinel_uuid, ok: res.ok, detail: res.detail });
    }

    return new Response(
      JSON.stringify({ processed: results.length, max_per_run: MAX_PER_RUN, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[process-account-deletions] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
