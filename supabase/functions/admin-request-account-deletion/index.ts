// admin-request-account-deletion
// Admin-initiated account deletion. Verifies the caller has the admin role,
// then schedules a 30-day grace deletion for the given instructor_id.
// Sets deleted_by to the admin's auth user id and uses admin-specific
// email wording. Mirrors request-account-deletion otherwise.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_NAME = "EveryDriver";
const FROM_ADDRESS = "EveryDriver <info@everydriver.co.uk>";
const GRACE_DAYS = 30;

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
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned)));
  return `${unsigned}.${b64urlEncode(sig)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderAdminInitiatedEmail(scheduledDate: string, cancelUrl: string): string {
  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc2626;">
    <h1 style="font-size: 22px; margin: 0;">Your account has been scheduled for deletion by an administrator</h1>
    <p style="color: #666; font-size: 13px; margin: 8px 0 0;">${APP_NAME}</p>
  </div>
  <div style="padding: 24px 0;">
    <p style="font-size: 15px;">An administrator has scheduled your ${APP_NAME} instructor account for permanent deletion on <strong>${escapeHtml(scheduledDate)}</strong>.</p>
    <p style="font-size: 14px; color: #444;">If you believe this is in error, you can cancel the deletion using the link below or contact support immediately.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${escapeHtml(cancelUrl)}" style="display: inline-block; background: #dc2626; color: #fff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px;">
        Cancel deletion
      </a>
    </div>
    <p style="font-size: 13px; color: #666;">Anonymised financial records will be retained for 6 years as required by HMRC. All other operational data will be permanently removed.</p>
  </div>
  <div style="border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #999; text-align: center;">${APP_NAME}</div>
</div>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Resend send failed: ${resp.status} ${txt}`);
  }
}

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

    const body = await req.json().catch(() => ({}));
    const instructorId = typeof body?.instructor_id === "string" ? body.instructor_id : "";
    if (!instructorId) {
      return new Response(JSON.stringify({ error: "Missing instructor_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authedClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminAuthUserId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: adminAuthUserId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: instructor, error: instErr } = await admin
      .from("instructors")
      .select("id, auth_user_id, deleted_at")
      .eq("id", instructorId)
      .maybeSingle();
    if (instErr) {
      return new Response(JSON.stringify({ error: "Lookup failed", detail: instErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (instructor.deleted_at) {
      return new Response(JSON.stringify({ error: "Account already scheduled for deletion" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Resolve instructor email from auth.users
    let contactEmail: string | null = null;
    if (instructor.auth_user_id) {
      const { data: userResp } = await admin.auth.admin.getUserById(instructor.auth_user_id);
      contactEmail = userResp?.user?.email ?? null;
    }
    const contactEmailEncrypted = contactEmail ? await aesEncryptEmail(contactEmail, EMAIL_KEY) : null;

    const sentinelUuid = crypto.randomUUID();
    const now = new Date();
    const purgeAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

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

    // Insert request row (so we can build cancel token), then attach token
    const { data: inserted, error: insErr } = await admin
      .from("account_deletion_requests")
      .insert({
        instructor_id: instructor.id,
        sentinel_uuid: sentinelUuid,
        requested_at: now.toISOString(),
        scheduled_purge_at: purgeAt.toISOString(),
        contact_email_encrypted: contactEmailEncrypted,
        deleted_by: adminAuthUserId,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      await admin
        .from("instructors")
        .update({ deleted_at: null, scheduled_purge_at: null })
        .eq("id", instructor.id);
      return new Response(JSON.stringify({ error: "Failed to record request", detail: insErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    await admin
      .from("account_deletion_requests")
      .update({ cancel_token: cancelToken })
      .eq("id", inserted.id);

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const baseUrl = origin || "https://everydriver.co";
    const cancelUrl = `${baseUrl.replace(/\/$/, "")}/cancel-deletion?token=${encodeURIComponent(cancelToken)}`;

    // Revoke all sessions for this user
    if (instructor.auth_user_id) {
      try {
        await admin.auth.admin.signOut(instructor.auth_user_id, "global");
      } catch (sErr) {
        console.error("[admin-request-account-deletion] signOut failed (non-fatal):", sErr);
      }
    }

    // Email instructor (admin-initiated wording)
    if (contactEmail) {
      try {
        const scheduledDate = purgeAt.toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        });
        await sendEmail(
          contactEmail,
          "Your account has been scheduled for deletion",
          renderAdminInitiatedEmail(scheduledDate, cancelUrl),
        );
      } catch (e) {
        console.error("[admin-request-account-deletion] email failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        deletion_request_id: inserted.id,
        scheduled_purge_at: purgeAt.toISOString(),
        cancel_token: cancelToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-request-account-deletion] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
