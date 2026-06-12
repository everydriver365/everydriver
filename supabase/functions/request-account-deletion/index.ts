// request-account-deletion
// Initiates the 30-day grace-period account deletion flow for an authenticated instructor.
// Does NOT call purge_instructor_data — that is handled by the T+30 cron in 4e-3.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_NAME = "EveryDriver";

const GRACE_DAYS = 30;

// ---------- crypto helpers ----------
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

async function aesEncryptEmail(plain: string, keyMaterial: string): Promise<string> {
  const keyBytes = await sha256(keyMaterial);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return "v1:" + b64urlEncode(out);
}

async function signCancelJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (o: unknown) => b64urlEncode(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${b64urlEncode(sig)}`;
}

// Email sending now uses the unified sendBrandedEmail helper below.


// ---------- handler ----------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    // Optional deletion reason from body (best-effort; ignored if body missing/invalid)
    let reason: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.reason === "string" && body.reason.trim()) {
        reason = body.reason.trim().slice(0, 500);
      }
    } catch { /* no body is fine */ }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EMAIL_KEY = Deno.env.get("ACCOUNT_DELETION_EMAIL_KEY");
    const CANCEL_SECRET = Deno.env.get("ACCOUNT_DELETION_CANCEL_SECRET");
    if (!EMAIL_KEY || !CANCEL_SECRET) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify caller
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authedClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authUserId = claimsData.claims.sub as string;

    // Service client for privileged work
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Reject admins/pupils — only instructors may request self-deletion
    const { data: adminRole } = await admin.rpc("has_role", { _user_id: authUserId, _role: "admin" });
    if (adminRole) {
      return new Response(JSON.stringify({ error: "Admins cannot self-delete via this endpoint" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: instructor, error: instErr } = await admin
      .from("instructors")
      .select("id, deleted_at")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (instErr) {
      return new Response(JSON.stringify({ error: "Lookup failed", detail: instErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor record not found for caller" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (instructor.deleted_at) {
      return new Response(JSON.stringify({ error: "Account already scheduled for deletion" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Existing open request?
    const { data: openReq } = await admin
      .from("account_deletion_requests")
      .select("id")
      .eq("instructor_id", instructor.id)
      .is("cancelled_at", null)
      .is("completed_at", null)
      .maybeSingle();
    if (openReq) {
      return new Response(JSON.stringify({ error: "Deletion already requested" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Contact email from auth.users
    const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(authUserId);
    if (userErr || !userResp?.user?.email) {
      return new Response(JSON.stringify({ error: "Could not resolve account email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const contactEmail = userResp.user.email;
    const contactEmailEncrypted = await aesEncryptEmail(contactEmail, EMAIL_KEY);

    const sentinelUuid = crypto.randomUUID();
    const now = new Date();
    const purgeAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

    // Mark instructor as soft-deleted with scheduled purge
    const { error: updErr } = await admin
      .from("instructors")
      .update({ deleted_at: now.toISOString(), scheduled_purge_at: purgeAt.toISOString() })
      .eq("id", instructor.id);
    if (updErr) {
      return new Response(JSON.stringify({ error: "Failed to mark instructor", detail: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create deletion request row
    const { data: inserted, error: insErr } = await admin
      .from("account_deletion_requests")
      .insert({
        instructor_id: instructor.id,
        sentinel_uuid: sentinelUuid,
        requested_at: now.toISOString(),
        scheduled_purge_at: purgeAt.toISOString(),
        contact_email_encrypted: contactEmailEncrypted,
        deleted_by: null,
        reason,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      // Roll back instructor change on failure
      await admin
        .from("instructors")
        .update({ deleted_at: null, scheduled_purge_at: null })
        .eq("id", instructor.id);
      return new Response(JSON.stringify({ error: "Failed to record request", detail: insErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build cancel token + URL
    const expSec = Math.floor(purgeAt.getTime() / 1000);
    const cancelToken = await signCancelJwt(
      {
        instructor_id: instructor.id,
        deletion_request_id: inserted.id,
        iat: Math.floor(now.getTime() / 1000),
        exp: expSec,
      },
      CANCEL_SECRET,
    );

    // Persist token so reminder/admin flows can re-use the same cancel link.
    await admin
      .from("account_deletion_requests")
      .update({ cancel_token: cancelToken })
      .eq("id", inserted.id);

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || "https://everydriver.co";
    const cancelUrl = `${baseUrl.replace(/\/$/, "")}/cancel-deletion?token=${encodeURIComponent(cancelToken)}`;

    // Revoke all sessions for this user (global signout)
    try {
      await admin.auth.admin.signOut(authUserId, "global");
    } catch (sErr) {
      console.error("[request-account-deletion] signOut failed (non-fatal):", sErr);
    }

    // T+0 confirmation email
    try {
      const scheduledDate = purgeAt.toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
      await sendBrandedEmail({
        to: contactEmail,
        subject: "Account deletion requested — you have 30 days to cancel",
        heading: "Account deletion requested",
        intro: `We've received a request to delete your ${APP_NAME} instructor account. Your account is scheduled for permanent deletion on ${scheduledDate}.`,
        paragraphs: [
          "What will be deleted:\n• Your account and all lesson, pupil, and scheduling data",
          "What will be retained:\n• Financial records (payments, invoices) — anonymised and retained for 6 years as required by HMRC",
          `You have 30 days to cancel this request. After ${scheduledDate}, this cannot be undone.`,
          "If you didn't request this, click the cancel link below immediately and contact support.",
        ],
        ctaLabel: "Cancel deletion",
        ctaUrl: cancelUrl,
        idempotencyKey: `acct-del-confirm-${inserted.id}`,
      }, admin);
    } catch (emailErr) {
      console.error("[request-account-deletion] email send failed:", emailErr);
    }


    return new Response(
      JSON.stringify({
        scheduled_purge_at: purgeAt.toISOString(),
        cancel_token_expiry: new Date(expSec * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[request-account-deletion] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
