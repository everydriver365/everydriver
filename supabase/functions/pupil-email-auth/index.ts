import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function generateResetCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

// Find existing auth.users row by email via a secure RPC (added in migration).
async function findAuthUserByEmail(admin: any, email: string): Promise<string | null> {
  const { data, error } = await admin.rpc("get_auth_user_id_by_email", { p_email: email });
  if (error) {
    console.error("get_auth_user_id_by_email error:", error);
    return null;
  }
  return (data as string) || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, name, code, instructorId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (!email) return jsonResponse({ error: "Email is required" });
    const cleanEmail = email.trim().toLowerCase();

    if (action === "login") {
      if (!password) return jsonResponse({ error: "Password is required" });

      const { data: pupils, error: pupilError } = await admin
        .from("pupils")
        .select(`
          id, name, email, auth_user_id,
          instructor:instructors!inner(id, app_slug, pupil_app_enabled)
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

      let firstLogin = false;

      // Ensure an auth.users row exists & is linked
      if (!pupil.auth_user_id) {
        // Try create new auth user with this password
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: { pupil_name: pupil.name },
        });

        let authUserId: string | null = created?.user?.id ?? null;

        if (createErr || !authUserId) {
          // User likely already exists from a previous attempt — find them
          authUserId = await findAuthUserByEmail(admin, cleanEmail);
          if (!authUserId) {
            console.error("Could not create or find auth user:", createErr);
            return jsonResponse({ error: "Could not initialise your account. Please try again." });
          }
          // Set the password to what they just typed so first migration succeeds
          await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
        }

        await admin.from("pupils").update({ auth_user_id: authUserId }).eq("id", pupil.id);
        firstLogin = true;
      }

      return jsonResponse({
        success: true,
        firstLogin,
        pupilName: pupil.name,
        pupilId: pupil.id,
        instructorId: instructor.id,
        instructorSlug: instructor.app_slug,
      });

    } else if (action === "check") {
      const { data: pupils } = await admin
        .from("pupils")
        .select("id, name, auth_user_id")
        .ilike("email", cleanEmail)
        .limit(1);

      if (!pupils || pupils.length === 0) return jsonResponse({ exists: false });

      return jsonResponse({
        exists: true,
        hasPassword: !!pupils[0].auth_user_id,
        name: pupils[0].name.split(" ")[0],
      });

    } else if (action === "register") {
      if (!password || password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" });
      }

      const { data: pupils } = await admin
        .from("pupils")
        .select("id, name, auth_user_id, instructor:instructors!inner(id, app_slug, pupil_app_enabled)")
        .ilike("email", cleanEmail)
        .limit(1);

      let pupilId: string;

      if (pupils && pupils.length > 0) {
        const pupil = pupils[0] as any;
        if (pupil.auth_user_id) {
          return jsonResponse({ error: "Account already registered. Please sign in instead." });
        }
        pupilId = pupil.id;
      } else if (instructorId) {
        if (!name?.trim()) return jsonResponse({ error: "Name is required for new registrations" });

        const { data: instructor } = await admin
          .from("instructors")
          .select("id, pupil_app_enabled")
          .eq("id", instructorId)
          .single();

        if (!instructor) return jsonResponse({ error: "Instructor not found" });
        if (!instructor.pupil_app_enabled) return jsonResponse({ error: "Pupil portal is not enabled for this instructor" });

        const { data: newPupil, error: createError } = await admin
          .from("pupils")
          .insert({ name: name.trim(), email: cleanEmail, instructor_id: instructorId })
          .select("id")
          .single();

        if (createError || !newPupil) {
          console.error("Error creating pupil:", createError);
          return jsonResponse({ error: "Failed to create account. Please try again." });
        }
        pupilId = newPupil.id;
      } else {
        return jsonResponse({ error: "Email not found. Your instructor must add you to the system first, or register via your instructor's direct link." });
      }

      // Create the auth user
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { pupil_name: name?.trim() },
      });

      let authUserId = created?.user?.id ?? null;
      if (createErr || !authUserId) {
        // Already exists in auth.users (maybe used elsewhere) — reuse and set password
        authUserId = await findAuthUserByEmail(admin, cleanEmail);
        if (!authUserId) {
          console.error("Failed to create auth user:", createErr);
          return jsonResponse({ error: "Could not create your account. Please try again." });
        }
        await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
      }

      await admin.from("pupils").update({ auth_user_id: authUserId }).eq("id", pupilId);

      return jsonResponse({ success: true, message: "Account registered successfully" });

    } else if (action === "forgot_password") {
      const { data: pupils } = await admin
        .from("pupils")
        .select("id, name")
        .ilike("email", cleanEmail)
        .limit(1);

      // Always return success to prevent enumeration
      if (!pupils || pupils.length === 0) {
        return jsonResponse({ success: true, message: "If an account exists with that email, a reset code has been sent." });
      }

      const pupil = pupils[0];
      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await admin
        .from("pupil_otp_codes")
        .upsert({ phone: cleanEmail, otp_code: resetCode, expires_at: expiresAt, verified: false }, { onConflict: "phone" });

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const firstName = pupil.name?.split(" ")[0] || "there";
        await resend.emails.send({
          from: "EveryDriver <noreply@everydriver.co.uk>",
          to: cleanEmail,
          subject: "Your Password Reset Code",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #10b981; font-size: 24px; margin: 0;">EveryDriver</h1>
              </div>
              <p style="color: #334155; font-size: 16px;">Hi ${firstName},</p>
              <p style="color: #475569; font-size: 14px;">You requested a password reset. Use the code below to set a new password:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; background: #f1f5f9; padding: 16px 32px; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #0f172a; border-radius: 12px;">${resetCode}</span>
              </div>
              <p style="color: #94a3b8; font-size: 13px; text-align: center;">This code expires in 15 minutes.</p>
            </div>`,
        });
      }

      return jsonResponse({ success: true, message: "If an account exists with that email, a reset code has been sent." });

    } else if (action === "confirm_reset") {
      if (!code) return jsonResponse({ error: "Reset code is required" });
      if (!password || password.length < 6) return jsonResponse({ error: "Password must be at least 6 characters" });

      const { data: otpRecord } = await admin
        .from("pupil_otp_codes")
        .select("*")
        .eq("phone", cleanEmail)
        .eq("otp_code", code)
        .eq("verified", false)
        .single();

      if (!otpRecord) return jsonResponse({ error: "Invalid or expired reset code" });
      if (new Date(otpRecord.expires_at) < new Date()) return jsonResponse({ error: "Reset code has expired. Please request a new one." });

      const { data: pupils } = await admin
        .from("pupils")
        .select("id, auth_user_id")
        .ilike("email", cleanEmail)
        .limit(1);

      if (!pupils || pupils.length === 0) return jsonResponse({ error: "Account not found" });

      let authUserId = pupils[0].auth_user_id;
      if (!authUserId) {
        // Create auth user with the new password
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
        });
        authUserId = created?.user?.id ?? null;
        if (createErr || !authUserId) {
          authUserId = await findAuthUserByEmail(admin, cleanEmail);
        }
        if (!authUserId) return jsonResponse({ error: "Could not reset password. Please try again." });
        await admin.from("pupils").update({ auth_user_id: authUserId }).eq("id", pupils[0].id);
      } else {
        await admin.auth.admin.updateUserById(authUserId, { password });
      }

      await admin.from("pupil_otp_codes").update({ verified: true }).eq("phone", cleanEmail);

      return jsonResponse({ success: true, message: "Password has been reset successfully" });

    } else {
      return jsonResponse({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Error in pupil-email-auth:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: jsonHeaders });
  }
});
