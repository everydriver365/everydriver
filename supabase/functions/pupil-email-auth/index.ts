import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import { Resend } from "npm:resend@4.0.1";

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

function generateResetCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * 10)];
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, password, name, code, instructorId } = await req.json();
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

      // Try to find existing pupil by email
      const { data: pupils, error: pupilError } = await supabase
        .from("pupils")
        .select("id, name, instructor:instructors!inner(id, app_slug, pupil_app_enabled)")
        .ilike("email", cleanEmail)
        .limit(1);

      let pupilId: string;

      if (pupils && pupils.length > 0) {
        // Existing pupil — check if already registered
        const pupil = pupils[0] as any;
        const existingHash = await getCredentials(supabase, pupil.id);
        if (existingHash) {
          return jsonResponse({ error: "Account already registered. Please sign in instead." });
        }
        pupilId = pupil.id;
      } else if (instructorId) {
        // No existing pupil but instructor provided — create new pupil record
        if (!name?.trim()) {
          return jsonResponse({ error: "Name is required for new registrations" });
        }

        // Validate instructor exists and has pupil app enabled
        const { data: instructor } = await supabase
          .from("instructors")
          .select("id, pupil_app_enabled")
          .eq("id", instructorId)
          .single();

        if (!instructor) {
          return jsonResponse({ error: "Instructor not found" });
        }
        if (!instructor.pupil_app_enabled) {
          return jsonResponse({ error: "Pupil portal is not enabled for this instructor" });
        }

        // Create the pupil
        const { data: newPupil, error: createError } = await supabase
          .from("pupils")
          .insert({
            name: name.trim(),
            email: cleanEmail,
            instructor_id: instructorId,
          })
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

      const { hash } = await hashPassword(password);
      await setCredentials(supabase, pupilId, hash);

      return jsonResponse({ success: true, message: "Account registered successfully" });

    } else if (action === "forgot_password") {
      // Look up the pupil
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name")
        .ilike("email", cleanEmail)
        .limit(1);

      // Always return success to prevent email enumeration
      if (!pupils || pupils.length === 0) {
        return jsonResponse({ success: true, message: "If an account exists with that email, a reset code has been sent." });
      }

      const pupil = pupils[0];
      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      // Store reset code in pupil_otp_codes table (reusing existing table)
      await supabase
        .from("pupil_otp_codes")
        .upsert({
          phone: cleanEmail, // using phone column to store email for reset codes
          otp_code: resetCode,
          expires_at: expiresAt,
          verified: false,
        }, { onConflict: "phone" });

      // Send email via Resend
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
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      }

      return jsonResponse({ success: true, message: "If an account exists with that email, a reset code has been sent." });

    } else if (action === "confirm_reset") {
      if (!code) {
        return jsonResponse({ error: "Reset code is required" });
      }
      if (!password || password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" });
      }

      // Look up the reset code
      const { data: otpRecord } = await supabase
        .from("pupil_otp_codes")
        .select("*")
        .eq("phone", cleanEmail)
        .eq("otp_code", code)
        .eq("verified", false)
        .single();

      if (!otpRecord) {
        return jsonResponse({ error: "Invalid or expired reset code" });
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return jsonResponse({ error: "Reset code has expired. Please request a new one." });
      }

      // Find the pupil
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id")
        .ilike("email", cleanEmail)
        .limit(1);

      if (!pupils || pupils.length === 0) {
        return jsonResponse({ error: "Account not found" });
      }

      // Set new password
      const { hash } = await hashPassword(password);
      await setCredentials(supabase, pupils[0].id, hash);

      // Mark OTP as used
      await supabase
        .from("pupil_otp_codes")
        .update({ verified: true })
        .eq("phone", cleanEmail);

      return jsonResponse({ success: true, message: "Password has been reset successfully" });

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
