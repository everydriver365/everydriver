// Mandatory 2FA enrolment screen for admin users.
// Admins cannot reach any /admin route until they have a verified TOTP factor.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function generateRecoveryCodes(): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  const bytes = new Uint8Array(120);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 10; i += 1) {
    let s = "";
    for (let j = 0; j < 12; j += 1) s += alphabet[bytes[i * 12 + j] % alphabet.length];
    codes.push(`${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`);
  }
  return codes;
}

export default function Admin2FAEnrol() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"qr" | "verify" | "codes">("qr");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      setBusy(true);
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      setBusy(false);
      if (error || !data) {
        toast({ title: "Couldn't start enrolment", description: error?.message, variant: "destructive" });
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, []);

  const verify = async () => {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) { setBusy(false); toast({ title: "Invalid code", description: error.message, variant: "destructive" }); return; }
    const fresh = generateRecoveryCodes();
    const { error: storeError } = await supabase.functions.invoke(
      "store-mfa-recovery-codes",
      { body: { codes: fresh } },
    );
    setBusy(false);
    if (storeError) {
      toast({ title: "Couldn't store recovery codes", description: storeError.message, variant: "destructive" });
      return;
    }
    setCodes(fresh);
    setStep("codes");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Admin two-factor required</h1>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication is mandatory for admin accounts. Set up an authenticator app to continue.
          </p>
        </div>

        {busy && !qr && <div className="py-8 text-center text-sm text-muted-foreground">Preparing…</div>}

        {step === "qr" && qr && (
          <>
            <div className="flex justify-center">
              <img src={qr} alt="Authenticator QR code" width={200} height={200} className="rounded border" />
            </div>
            {secret && (
              <div className="text-xs text-center break-all">
                <div className="text-muted-foreground">Or enter this key manually:</div>
                <code className="font-mono">{secret}</code>
              </div>
            )}
            <button type="button" className="sv2-btn w-full" onClick={() => setStep("verify")}>
              I've scanned it — continue
            </button>
          </>
        )}

        {step === "verify" && (
          <>
            <label className="sv2-label">6-digit code</label>
            <input
              className="sv2-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
            <button
              type="button"
              className="sv2-btn w-full"
              disabled={busy || code.length !== 6}
              onClick={() => void verify()}
            >{busy ? "Verifying…" : "Verify and enable"}</button>
          </>
        )}

        {step === "codes" && (
          <>
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Save these recovery codes now.</strong> Each can be used once. They will not be shown again.
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {codes.map((c) => <div key={c} className="border rounded px-2 py-1 text-center">{c}</div>)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => { void navigator.clipboard.writeText(codes.join("\n")); toast({ title: "Copied" }); }}
              >Copy all</button>
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => {
                  const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "admin-recovery-codes.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >Download</button>
            </div>
            <button type="button" className="sv2-btn w-full" onClick={() => navigate("/admin", { replace: true })}>
              I've saved them — continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
