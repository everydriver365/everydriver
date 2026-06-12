// cancel-account-deletion
// Verifies a signed cancel JWT (no auth session required) and reverses the soft-deletion.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_NAME = "EveryDriver";


// ---------- crypto helpers ----------
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function sha256(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

async function verifyCancelJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const unsigned = `${h}.${p}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(s),
    new TextEncoder().encode(unsigned),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (!exp || exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
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
    console.error("[cancel-account-deletion] decrypt failed:", e);
    return null;
  }
}

// Email now sent via sendBrandedEmail (Lovable Emails pipeline).


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
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const EMAIL_KEY = Deno.env.get("ACCOUNT_DELETION_EMAIL_KEY");
    const CANCEL_SECRET = Deno.env.get("ACCOUNT_DELETION_CANCEL_SECRET");
    if (!EMAIL_KEY || !CANCEL_SECRET) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await verifyCancelJwt(token, CANCEL_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const instructorId = payload.instructor_id as string;
    const deletionRequestId = payload.deletion_request_id as string;
    if (!instructorId || !deletionRequestId) {
      return new Response(JSON.stringify({ error: "Malformed token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: row, error: rowErr } = await admin
      .from("account_deletion_requests")
      .select("id, instructor_id, cancelled_at, completed_at, contact_email_encrypted")
      .eq("id", deletionRequestId)
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (rowErr) {
      return new Response(JSON.stringify({ error: "Lookup failed", detail: rowErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!row) {
      return new Response(JSON.stringify({ error: "Deletion request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.completed_at) {
      return new Response(JSON.stringify({ error: "Account has already been purged and cannot be restored" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (row.cancelled_at) {
      return new Response(
        JSON.stringify({ message: "Account deletion already cancelled. Please log in to continue." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date().toISOString();
    const { error: updReqErr } = await admin
      .from("account_deletion_requests")
      .update({ cancelled_at: now })
      .eq("id", row.id);
    if (updReqErr) {
      return new Response(JSON.stringify({ error: "Failed to cancel", detail: updReqErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updInstErr } = await admin
      .from("instructors")
      .update({ deleted_at: null, scheduled_purge_at: null })
      .eq("id", instructorId);
    if (updInstErr) {
      console.error("[cancel-account-deletion] instructor restore failed:", updInstErr);
      // Continue — request row already cancelled.
    }

    // Email cancellation confirmation
    try {
      const email = row.contact_email_encrypted
        ? await aesDecryptEmail(row.contact_email_encrypted, EMAIL_KEY)
        : null;
      if (email) {
        await sendBrandedEmail({
          to: email,
          subject: "Account deletion cancelled — welcome back",
          heading: "Account deletion cancelled",
          intro: "Welcome back. Your account deletion request has been cancelled and your account is fully restored.",
          paragraphs: ["Please log in to continue."],
          ctaLabel: "Log in",
          ctaUrl: "https://everydriver.co.uk/login",
          footerNote: APP_NAME,
          idempotencyKey: `acct-del-cancel-${row.id}`,
        }, admin);
      }
    } catch (emailErr) {
      console.error("[cancel-account-deletion] email send failed:", emailErr);
    }


    return new Response(
      JSON.stringify({ message: "Account deletion cancelled. Please log in to continue." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[cancel-account-deletion] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
