// Verifies a single-use MFA recovery code for the authenticated instructor.
// On success the matched code row is marked used_at = now() and cannot be
// reused. Plain codes are NEVER persisted, NEVER logged.
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
    const plainCode: unknown = body?.code;
    if (typeof plainCode !== "string" || plainCode.length < 8 || plainCode.length > 64) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: instructor } = await serviceClient
      .from("instructors")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!instructor) {
      return new Response(JSON.stringify({ error: "Instructor profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rows, error: rowsError } = await serviceClient
      .from("instructor_mfa_recovery_codes")
      .select("id, code_hash")
      .eq("instructor_id", instructor.id)
      .is("used_at", null);
    if (rowsError) {
      return new Response(JSON.stringify({ error: rowsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let matchedId: string | null = null;
    for (const row of rows ?? []) {
      // Constant-time comparison inside bcrypt itself.
      // Awaiting in a loop is intentional — bcrypt cost is small (10) and the
      // set is bounded to 10 codes.
      // deno-lint-ignore no-await-in-loop
      const ok = await bcrypt.compare(plainCode, row.code_hash);
      if (ok) {
        matchedId = row.id as string;
        break;
      }
    }

    if (!matchedId) {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await serviceClient
      .from("instructor_mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", matchedId)
      .is("used_at", null);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-mfa-recovery-code error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
