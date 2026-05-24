import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+44" + cleaned.substring(1);
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+44" + cleaned;
  }
  return cleaned;
}

// Synthetic email for parent Supabase users — phone-based identity.
function syntheticParentEmail(normalisedPhone: string): string {
  const digits = normalisedPhone.replace(/[^0-9]/g, "");
  return `parent.${digits}@parents.drive365.internal`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalisedPhone = cleanPhoneNumber(phone);

    // 1. Verify OTP
    const { data: otpRow, error: otpError } = await supabaseAdmin
      .from("parent_otp_codes")
      .select("*")
      .eq("phone", normalisedPhone)
      .single();

    if (otpError || !otpRow) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(otpRow.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (otpRow.code !== code) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find or create the Supabase auth user for this parent.
    const email = syntheticParentEmail(normalisedPhone);

    // Check parents table first.
    const { data: existingParent } = await supabaseAdmin
      .from("parents")
      .select("id, auth_user_id")
      .eq("phone", normalisedPhone)
      .maybeSingle();

    let parentAuthUserId: string | null = existingParent?.auth_user_id ?? null;

    // If no parents row, try to find an existing auth user (slow but bounded).
    if (!parentAuthUserId) {
      try {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const found = list?.users?.find(
          (u: any) =>
            u.email?.toLowerCase() === email.toLowerCase() ||
            u.phone === normalisedPhone ||
            u.user_metadata?.parent_phone === normalisedPhone,
        );
        if (found) parentAuthUserId = found.id;
      } catch (e) {
        console.warn("listUsers failed, will attempt create:", e);
      }
    }

    // Create user if still not found.
    if (!parentAuthUserId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: "parent", parent_phone: normalisedPhone },
      });
      if (createErr || !created?.user) {
        // Possible race: user was created between our search and create.
        // Try one more lookup on the synthetic email.
        try {
          const { data: list2 } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 200,
          });
          const f2 = list2?.users?.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
          );
          if (f2) parentAuthUserId = f2.id;
        } catch {}
        if (!parentAuthUserId) {
          throw createErr ?? new Error("Could not create parent user");
        }
      } else {
        parentAuthUserId = created.user.id;
      }
    }

    // 3. Upsert parents row.
    const { data: parentRow, error: parentUpsertErr } = await supabaseAdmin
      .from("parents")
      .upsert(
        { auth_user_id: parentAuthUserId, phone: normalisedPhone },
        { onConflict: "auth_user_id" },
      )
      .select("id")
      .single();
    if (parentUpsertErr || !parentRow) throw parentUpsertErr ?? new Error("parents upsert failed");

    // 4. Upsert parent role.
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: parentAuthUserId, role: "parent" } as any,
        { onConflict: "user_id,role" },
      );

    // 5. Link pupils to this parent via phone matching (last 9 digits).
    const last9 = normalisedPhone.slice(-9);
    const { data: linkedPupils } = await supabaseAdmin
      .from("pupils")
      .select("id, parent_phone")
      .ilike("parent_phone", `%${last9}`);

    if (linkedPupils && linkedPupils.length > 0) {
      await supabaseAdmin
        .from("pupils")
        .update({ parent_user_id: parentRow.id } as any)
        .in("id", linkedPupils.map((p: any) => p.id));
    }

    // 6. Mark OTP as used.
    await supabaseAdmin
      .from("parent_otp_codes")
      .update({ verified: true })
      .eq("id", otpRow.id);

    // 7. Issue a magic-link OTP that the client can verify to establish a session.
    // (supabase-js has no admin.createSession — generateLink + client verifyOtp is the
    // supported way to mint a real session from server-side.)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw linkErr ?? new Error("Could not generate session token");
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        parent_id: parentRow.id,
        // Client calls supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })
        token_hash: linkData.properties.hashed_token,
        email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in verify-parent-otp:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
