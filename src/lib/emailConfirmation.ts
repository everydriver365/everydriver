import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true when a Supabase auth error indicates the user's email
 * has not yet been confirmed. Catches both message and code variants.
 */
export function isEmailNotConfirmedError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("email address not confirmed") ||
    msg.includes("confirm your email")
  );
}

/**
 * Resend the email-confirmation link for a signup.
 * Pass the same redirect URL that was used at signup so the user
 * lands back in the right portal after clicking the link.
 */
export async function resendSignupConfirmation(email: string, redirectTo?: string) {
  return supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
}
