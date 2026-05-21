// MFA challenge screen — shown when AAL is aal1 but factor is enrolled.
// Accepts a 6-digit TOTP code or a single-use recovery code.
//
// Recovery code path: verify-mfa-recovery-code marks the code as used and
// returns success, but does NOT elevate the AAL of the current session.
// Per spec, after a recovery-code login the user is signed out and prompted
// to set up a new authenticator — this prevents a leaked recovery code from
// permanently bypassing 2FA.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function MFAChallenge() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data) { setError(error?.message ?? "Couldn't load factors"); return; }
      const verified = (data.totp ?? []).find((f) => f.status === "verified");
      if (!verified) {
        // No factor enrolled — nothing to challenge.
        navigate(next, { replace: true });
        return;
      }
      setFactorId(verified.id);
    })();
  }, [navigate, next]);

  const submitTotp = async () => {
    if (!factorId) return;
    setBusy(true); setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId, code: code.trim(),
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    navigate(next, { replace: true });
  };

  const submitRecovery = async () => {
    setBusy(true); setError(null);
    const { data, error } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
      "verify-mfa-recovery-code",
      { body: { code: recovery.trim() } },
    );
    if (error || !data?.success) {
      setBusy(false);
      setError(error?.message ?? "Invalid or already-used recovery code");
      return;
    }
    // Recovery code does NOT satisfy aal2 server-side. Per spec: sign out
    // and instruct the user to set up a new authenticator next time.
    await supabase.auth.signOut();
    setBusy(false);
    toast({
      title: "Recovery code accepted",
      description: "Please sign in again and set up a new authenticator app.",
    });
    navigate("/instructor/login", { replace: true });
  };

  const heading = useMemo(() => (mode === "totp"
    ? "Enter your 6-digit code"
    : "Enter a recovery code"), [mode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">Two-factor required</h1>
        <p className="text-sm text-muted-foreground mb-4">{heading}</p>

        {mode === "totp" ? (
          <>
            <input
              className="sv2-input w-full text-center text-lg tracking-widest font-mono"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
            {error && <div className="text-sm text-destructive mt-2">{error}</div>}
            <button
              type="button"
              className="sv2-btn w-full mt-3"
              disabled={busy || code.length !== 6 || !factorId}
              onClick={() => void submitTotp()}
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground mt-3 underline w-full"
              onClick={() => { setMode("recovery"); setError(null); }}
            >
              Use a recovery code instead
            </button>
          </>
        ) : (
          <>
            <input
              className="sv2-input w-full font-mono"
              autoComplete="off"
              autoFocus
              value={recovery}
              onChange={(e) => setRecovery(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH-IJKL"
            />
            {error && <div className="text-sm text-destructive mt-2">{error}</div>}
            <button
              type="button"
              className="sv2-btn w-full mt-3"
              disabled={busy || recovery.trim().length < 8}
              onClick={() => void submitRecovery()}
            >
              {busy ? "Checking…" : "Use recovery code"}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground mt-3 underline w-full"
              onClick={() => { setMode("totp"); setError(null); }}
            >
              Back to authenticator code
            </button>
          </>
        )}

        <button
          type="button"
          className="text-xs text-muted-foreground mt-6 underline w-full"
          onClick={async () => { await supabase.auth.signOut(); navigate("/", { replace: true }); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
