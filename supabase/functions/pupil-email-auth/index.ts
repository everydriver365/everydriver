import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

// Simple password hashing using Web Crypto API (PBKDF2)
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const actualSalt = salt || crypto.randomUUID();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(actualSalt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashHex = new TextDecoder().decode(hexEncode(new Uint8Array(derivedBits)));
  return { hash: `${actualSalt}:${hashHex}`, salt: actualSalt };
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(":");
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// Helper to get password hash from pupil_credentials table
async function getCredentials(supabase: any, pupilId: string) {
  const { data } = await supabase
    .from("pupil_credentials")
    .select("password_hash")
    .eq("pupil_id", pupilId)
    .single();
  return data?.password_hash || null;
}

// Helper to upsert password hash in pupil_credentials table
async function setCredentials(supabase: any, pupilId: string, hash: string) {
  await supabase
    .from("pupil_credentials")
    .upsert({ pupil_id: pupilId, password_hash: hash, updated_at: new Date().toISOString() }, { onConflict: "pupil_id" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, name } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!email) {
      return jsonResponse({ error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === "login") {
      if (!password) {
        return jsonResponse({ error: "Password is required" });
      }

      const { data: pupils, error: pupilError } = await supabase
        .from("pupils")
        .select(`
          id, name, email, phone,
          instructor:instructors!inner(
            id, app_slug, pupil_app_enabled
          )
        `)
        .ilike("email", cleanEmail)
        .limit(1);

      if (pupilError || !pupils || pupils.length === 0) {
        return jsonResponse({ error: "Email not found. Please check your email or contact your instructor." });
      }

      const pupil = pupils[0] as any;
      const instructor = Array.isArray(pupil.instructor) ? pupil.instructor[0] : pupil.instructor;

      if (!instructor?.pupil_app_enabled || !instructor?.app_slug) {
        return jsonResponse({ error: "Pupil portal is not enabled for your instructor." });
      }

      const storedHash = await getCredentials(supabase, pupil.id);

      // If no password set yet, this is first login - set the password
      if (!storedHash) {
        const { hash } = await hashPassword(password);
        await setCredentials(supabase, pupil.id, hash);

        return jsonResponse({
          success: true,
          firstLogin: true,
          pupilName: pupil.name,
          pupilId: pupil.id,
          instructorId: instructor.id,
          instructorSlug: instructor.app_slug,
        });
      }

      const valid = await verifyPassword(password, storedHash);
      if (!valid) {
        return jsonResponse({ error: "Incorrect password" });
      }

      return jsonResponse({
        success: true,
        pupilName: pupil.name,
        pupilId: pupil.id,
        instructorId: instructor.id,
        instructorSlug: instructor.app_slug,
      });

    } else if (action === "check") {
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name")
        .ilike("email", cleanEmail)
        .limit(1);

      if (!pupils || pupils.length === 0) {
        return jsonResponse({ exists: false });
      }

      const storedHash = await getCredentials(supabase, pupils[0].id);

      return jsonResponse({
        exists: true,
        hasPassword: !!storedHash,
        name: pupils[0].name.split(" ")[0],
      });

    } else if (action === "register") {
      if (!password || password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" });
      }

      const { data: pupils, error: pupilError } = await supabase
        .from("pupils")
        .select("id, name, instructor:instructors!inner(id, app_slug, pupil_app_enabled)")
        .ilike("email", cleanEmail)
        .limit(1);

      if (pupilError || !pupils || pupils.length === 0) {
        return jsonResponse({ error: "Email not found. Your instructor must add you to the system first." });
      }

      const pupil = pupils[0] as any;
      const existingHash = await getCredentials(supabase, pupil.id);

      if (existingHash) {
        return jsonResponse({ error: "Account already registered. Please sign in instead." });
      }

      const { hash } = await hashPassword(password);
      await setCredentials(supabase, pupil.id, hash);

      return jsonResponse({ success: true, message: "Account registered successfully" });

    } else {
      return jsonResponse({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Error in pupil-email-auth:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
