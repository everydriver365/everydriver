// Stores bcrypt hashes of MFA recovery codes for the authenticated instructor.
// Caller submits 10 plain codes (generated client-side at enrolment or regen).
// Server hashes each and replaces any existing codes for that instructor.
// Plain codes are NEVER persisted, NEVER logged.
import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => null);
    const codes: unknown = body?.codes;
    if (
      !Array.isArray(codes) ||
      codes.length !== 10 ||
      !codes.every((c) => typeof c === "string" && c.length >= 8 && c.length <= 64)
    ) {
      return new Response(
        JSON.stringify({ error: "Expected exactly 10 codes (8–64 chars each)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Require an active TOTP factor before allowing code storage —
    // prevents storing codes for accounts that have no second factor.
    const { data: factors, error: factorsError } =
      await userClient.auth.mfa.listFactors();
    if (factorsError) {
      return new Response(JSON.stringify({ error: factorsError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const hasVerifiedTotp = (factors?.totp ?? []).some(
      (f) => f.status === "verified",
    );
    if (!hasVerifiedTotp) {
      return new Response(
        JSON.stringify({ error: "TOTP factor must be verified before storing recovery codes" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Resolve instructor id from the user.
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: instructor, error: instructorError } = await serviceClient
      .from("instructors")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (instructorError || !instructor) {
      return new Response(
        JSON.stringify({ error: "Instructor profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Hash all codes with bcrypt (cost 10).
    const hashes = await Promise.all(
      codes.map((code) => bcrypt.hash(code as string, 10)),
    );

    // Replace any existing codes (regeneration invalidates the old set).
    const { error: deleteError } = await serviceClient
      .from("instructor_mfa_recovery_codes")
      .delete()
      .eq("instructor_id", instructor.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = hashes.map((code_hash) => ({
      instructor_id: instructor.id,
      code_hash,
    }));
    const { error: insertError } = await serviceClient
      .from("instructor_mfa_recovery_codes")
      .insert(rows);
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, stored: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("store-mfa-recovery-codes error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
