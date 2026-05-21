// Global MFA enforcement gate.
//
// Responsibilities:
//   1. After any sign-in, check the session's Authenticator Assurance Level.
//      If currentLevel === 'aal1' && nextLevel === 'aal2' (i.e. the user has
//      a TOTP factor enrolled but hasn't completed it on this session),
//      redirect to /2fa-challenge.
//   2. For admin users specifically, MFA is mandatory. If they have no
//      verified TOTP factor enrolled, redirect to /admin/2fa-enrol before
//      they can access any /admin route.
//   3. Exempt /reset-password, /update-password, all /*/login routes, and
//      the challenge / enrolment screens themselves.
//
// Biometric quick-sign-in note: NativeBiometric replays signInWithPassword,
// which produces an aal1 session. This gate then runs and requires TOTP if
// the user has a factor enrolled — biometric satisfies the first factor only.
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const EXEMPT_PREFIXES = [
  "/2fa-challenge",
  "/admin/2fa-enrol",
  "/reset-password",
  "/update-password",
];

const EXEMPT_EXACT = new Set<string>([
  "/instructor/login",
  "/instructor-app/login",
  "/admin/login",
  "/school/login",
  "/pupil-login",
  "/login",
  "/",
]);

function isExempt(pathname: string): boolean {
  if (EXEMPT_EXACT.has(pathname)) return true;
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Any login route is exempt.
  if (pathname.endsWith("/login") || pathname.includes("/auth")) return true;
  return false;
}

type Decision =
  | { kind: "ok" }
  | { kind: "challenge" }
  | { kind: "admin-enrol" };

export function MFAGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [decision, setDecision] = useState<Decision>({ kind: "ok" });
  const checkingRef = useRef(false);

  useEffect(() => {
    const evaluate = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setDecision({ kind: "ok" }); return; }

        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
          setDecision({ kind: "challenge" });
          return;
        }

        // Admin enforcement: admin users without a verified TOTP factor are
        // forced to enrol before accessing /admin routes.
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const verified = (factors?.totp ?? []).some((f) => f.status === "verified");
          if (!verified) { setDecision({ kind: "admin-enrol" }); return; }
        }

        setDecision({ kind: "ok" });
      } catch (err) {
        console.error("[MFAGate] evaluation failed", err);
        setDecision({ kind: "ok" });
      } finally {
        checkingRef.current = false;
      }
    };

    void evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "MFA_CHALLENGE_VERIFIED" || event === "TOKEN_REFRESHED") {
        void evaluate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [location.pathname]);

  if (isExempt(location.pathname)) return <>{children}</>;

  if (decision.kind === "challenge") {
    return <Navigate to={`/2fa-challenge?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (decision.kind === "admin-enrol" && location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin/2fa-enrol" replace />;
  }

  return <>{children}</>;
}
