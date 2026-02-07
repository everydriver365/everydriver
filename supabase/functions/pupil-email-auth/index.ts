import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === "login") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Password is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find pupil by email
      const { data: pupils, error: pupilError } = await supabase
        .from("pupils")
        .select(`
          id, name, email, password_hash, phone,
          instructor:instructors!inner(
            id, app_slug, pupil_app_enabled
          )
        `)
        .ilike("email", cleanEmail)
        .limit(1);

      if (pupilError || !pupils || pupils.length === 0) {
        return new Response(
          JSON.stringify({ error: "Email not found. Please check your email or contact your instructor." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pupil = pupils[0] as any;
      const instructor = Array.isArray(pupil.instructor) ? pupil.instructor[0] : pupil.instructor;

      if (!instructor?.pupil_app_enabled || !instructor?.app_slug) {
        return new Response(
          JSON.stringify({ error: "Pupil portal not enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If no password set yet, this is first login - set the password
      if (!pupil.password_hash) {
        const { hash } = await hashPassword(password);
        await supabase
          .from("pupils")
          .update({ password_hash: hash })
          .eq("id", pupil.id);

        return new Response(
          JSON.stringify({
            success: true,
            firstLogin: true,
            pupilName: pupil.name,
            pupilId: pupil.id,
            instructorId: instructor.id,
            instructorSlug: instructor.app_slug,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password
      const valid = await verifyPassword(password, pupil.password_hash);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: "Incorrect password" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          pupilName: pupil.name,
          pupilId: pupil.id,
          instructorId: instructor.id,
          instructorSlug: instructor.app_slug,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "check") {
      // Check if email exists and if password is set
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name, password_hash")
        .ilike("email", cleanEmail)
        .limit(1);

      if (!pupils || pupils.length === 0) {
        return new Response(
          JSON.stringify({ exists: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          exists: true,
          hasPassword: !!pupils[0].password_hash,
          name: pupils[0].name.split(" ")[0],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in pupil-email-auth:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
