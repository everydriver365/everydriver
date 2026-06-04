import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { UnifiedMobileLoginCard } from "@/components/auth/UnifiedMobileLoginCard";
import { setRememberMe } from "@/lib/sessionPersistence";

const FONT = `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

export default function UnifiedLogin() {
  const navigate = useNavigate();

  // Remember that this device is running the pupil app so a cold launch
  // (e.g. native build) returns to the pupil login next time.
  useEffect(() => {
    import("@/lib/appVariant").then((m) => m.rememberAppVariant("pupil"));
  }, []);

  const handleSignIn = async (email: string, password: string, rememberMe: boolean) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setRememberMe(rememberMe);
    navigate("/auth/redirect", { replace: true });
  };

  const handleForgot = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F2F4F8", fontFamily: FONT }}>
      <UnifiedMobileLoginCard
        portalName="Drive365"
        descriptor="For pupils, parents and instructors"
        onSignIn={handleSignIn}
        onForgot={handleForgot}
        className="rounded-none"
        googleSlot={
          <GoogleSignInButton
            redirectTo={`${window.location.origin}/auth/redirect`}
            className="w-full"
          />
        }
      />
    </div>
  );
}
