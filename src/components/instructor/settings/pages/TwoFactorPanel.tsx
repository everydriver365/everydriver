// Two-factor authentication management panel for instructors.
// Uses Supabase Auth MFA (TOTP only). Real factor state is loaded via
// supabase.auth.mfa.listFactors() — never derived from local component state.
// Recovery codes are generated client-side, hashed server-side via the
// store-mfa-recovery-codes edge function, and shown to the user exactly once.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsListRow } from "../SettingsListRow";
import { StatusPill } from "../StatusPill";
import { IconShieldCheck, IconShieldOff, IconKey, IconRefresh } from "@tabler/icons-react";

type Factor = { id: string; status: string; factor_type: string; friendly_name?: string };

/** Generate 10 cryptographically random recovery codes (format AAAA-BBBB-CCCC). */
function generateRecoveryCodes(): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const codes: string[] = [];
  const bytes = new Uint8Array(120); // 10 codes × 12 chars
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 10; i += 1) {
    let s = "";
    for (let j = 0; j < 12; j += 1) {
      s += alphabet[bytes[i * 12 + j] % alphabet.length];
    }
    codes.push(`${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`);
  }
  return codes;
}

export function TwoFactorPanel() {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState<Factor | null>(null);
  const [unusedCount, setUnusedCount] = useState<number | null>(null);
  const [enrolOpen, setEnrolOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      console.error("[2FA] listFactors failed", error);
      setFactor(null);
    } else {
      const verified = (data?.totp ?? []).find((f) => f.status === "verified");
      setFactor(verified ? (verified as Factor) : null);
    }
    // Remaining recovery codes count (metadata only — never the hashes).
    const { count } = await supabase
      .from("instructor_mfa_recovery_codes")
      .select("id", { count: "exact", head: true })
      .is("used_at", null);
    setUnusedCount(count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="sv2-card">
      <div style={{ marginBottom: 4 }}>
        <div className="sv2-section-title">Two-factor authentication</div>
        <div className="sv2-section-sub">Add a second step when signing in from a new device.</div>
      </div>

      {loading ? (
        <SettingsListRow
          icon={<IconShieldCheck size={16} stroke={1.5} />}
          name="Authenticator app"
          meta="Checking status…"
        />
      ) : factor ? (
        <>
          <SettingsListRow
            icon={<IconShieldCheck size={16} stroke={1.5} />}
            name="Authenticator app"
            meta="Codes from your authenticator app are required when signing in."
            status={<StatusPill variant="success">Active</StatusPill>}
          />
          <button
            type="button"
            className="sv2-row w-full text-left"
            style={{ background: "transparent", border: 0, cursor: "pointer" }}
            onClick={() => setRegenOpen(true)}
          >
            <span className="sv2-row-icon"><IconRefresh size={16} stroke={1.5} /></span>
            <span className="flex-1 min-w-0">
              <span className="sv2-row-name block">Recovery codes</span>
              <span className="sv2-row-meta block">
                {unusedCount === null ? "—" : `${unusedCount} unused`} · Regenerate invalidates the old set
              </span>
            </span>
            <span className="sv2-btn">Regenerate</span>
          </button>
          <button
            type="button"
            className="sv2-row w-full text-left"
            style={{ background: "transparent", border: 0, cursor: "pointer" }}
            onClick={() => setRemoveOpen(true)}
          >
            <span className="sv2-row-icon"><IconShieldOff size={16} stroke={1.5} /></span>
            <span className="flex-1 min-w-0">
              <span className="sv2-row-name block">Remove two-factor authentication</span>
              <span className="sv2-row-meta block">Requires password confirmation.</span>
            </span>
            <span className="sv2-btn">Remove</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          className="sv2-row w-full text-left"
          style={{ background: "transparent", border: 0, cursor: "pointer" }}
          onClick={() => setEnrolOpen(true)}
        >
          <span className="sv2-row-icon"><IconShieldCheck size={16} stroke={1.5} /></span>
          <span className="flex-1 min-w-0">
            <span className="sv2-row-name block">Set up authenticator app</span>
            <span className="sv2-row-meta block">Use Google Authenticator, 1Password, Authy or similar.</span>
          </span>
          <span className="sv2-btn">Set up</span>
        </button>
      )}

      <EnrolSheet open={enrolOpen} onOpenChange={setEnrolOpen} onComplete={refresh} />
      <RemoveDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        factorId={factor?.id ?? null}
        onComplete={refresh}
      />
      <RegenDialog open={regenOpen} onOpenChange={setRegenOpen} onComplete={refresh} />
    </section>
  );
}

// ---------- Enrolment ----------

function EnrolSheet({
  open, onOpenChange, onComplete,
}: { open: boolean; onOpenChange: (v: boolean) => void; onComplete: () => void | Promise<void> }) {
  const [step, setStep] = useState<"qr" | "verify" | "codes">("qr");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      // reset on close
      setStep("qr"); setFactorId(null); setQr(null); setSecret(null);
      setCode(""); setRecoveryCodes([]); setBusy(false);
      return;
    }
    void (async () => {
      setBusy(true);
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      setBusy(false);
      if (error || !data) {
        toast({ title: "Couldn't start enrolment", description: error?.message, variant: "destructive" });
        onOpenChange(false);
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, [open, onOpenChange]);

  const verify = async () => {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) {
      setBusy(false);
      toast({ title: "Invalid code", description: error.message, variant: "destructive" });
      return;
    }
    // Generate, hash via edge function, then show once.
    const codes = generateRecoveryCodes();
    const { error: storeError } = await supabase.functions.invoke(
      "store-mfa-recovery-codes",
      { body: { codes } },
    );
    setBusy(false);
    if (storeError) {
      toast({
        title: "2FA enabled, but recovery codes failed",
        description: storeError.message + " — regenerate from the panel.",
        variant: "destructive",
      });
      await onComplete();
      onOpenChange(false);
      return;
    }
    setRecoveryCodes(codes);
    setStep("codes");
  };

  const finish = async () => {
    await onComplete();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Set up authenticator app</SheetTitle>
          <SheetDescription>
            Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
          </SheetDescription>
        </SheetHeader>

        {busy && !qr && <div className="py-8 text-center text-sm text-muted-foreground">Preparing…</div>}

        {step === "qr" && qr && (
          <div className="space-y-4 mt-4">
            <div className="flex justify-center">
              <img src={qr} alt="Authenticator QR code" width={200} height={200} className="rounded border" />
            </div>
            {secret && (
              <div className="text-xs text-center break-all">
                <div className="text-muted-foreground">Or enter this key manually:</div>
                <code className="font-mono">{secret}</code>
              </div>
            )}
            <button
              type="button"
              className="sv2-btn w-full"
              onClick={() => setStep("verify")}
              disabled={busy}
            >
              I've scanned it — continue
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-3 mt-4">
            <label className="sv2-label">6-digit code from your app</label>
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
            >
              {busy ? "Verifying…" : "Verify and enable"}
            </button>
          </div>
        )}

        {step === "codes" && recoveryCodes.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Save these recovery codes now.</strong> Each can be used once if you lose your
              authenticator. They will not be shown again.
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((c) => <div key={c} className="border rounded px-2 py-1 text-center">{c}</div>)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => {
                  void navigator.clipboard.writeText(recoveryCodes.join("\n"));
                  toast({ title: "Copied to clipboard" });
                }}
              >Copy all</button>
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => {
                  const blob = new Blob([recoveryCodes.join("\n") + "\n"], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "drive365-recovery-codes.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >Download</button>
            </div>
            <button type="button" className="sv2-btn w-full" onClick={() => void finish()}>
              I've saved them — done
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------- Remove (password confirm + unenroll) ----------

function RemoveDialog({
  open, onOpenChange, factorId, onComplete,
}: { open: boolean; onOpenChange: (v: boolean) => void; factorId: string | null; onComplete: () => void | Promise<void> }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!factorId) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setBusy(false);
      toast({ title: "Couldn't verify identity", variant: "destructive" });
      return;
    }
    // Re-authenticate with password to confirm the user is present.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email, password,
    });
    if (signInError) {
      setBusy(false);
      toast({ title: "Incorrect password", description: signInError.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't remove 2FA", description: error.message, variant: "destructive" });
      return;
    }
    setPassword("");
    onOpenChange(false);
    toast({ title: "Two-factor authentication removed" });
    await onComplete();
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove two-factor authentication?</AlertDialogTitle>
          <AlertDialogDescription>
            Your account will be less secure. Confirm your password to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <label className="sv2-label">Password</label>
          <input className="sv2-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !password}
            onClick={(e) => { e.preventDefault(); void submit(); }}
          >
            {busy ? "Removing…" : "Remove 2FA"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- Regenerate codes (requires TOTP) ----------

function RegenDialog({
  open, onOpenChange, onComplete,
}: { open: boolean; onOpenChange: (v: boolean) => void; onComplete: () => void | Promise<void> }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (!open) { setCode(""); setCodes(null); setBusy(false); }
  }, [open]);

  const verifyAndRegen = async () => {
    setBusy(true);
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factorsData) {
      setBusy(false);
      toast({ title: "Couldn't load factors", description: factorsError?.message, variant: "destructive" });
      return;
    }
    const verified = (factorsData.totp ?? []).find((f) => f.status === "verified");
    if (!verified) {
      setBusy(false);
      toast({ title: "No active 2FA factor", variant: "destructive" });
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId: verified.id, code: code.trim(),
    });
    if (vErr) {
      setBusy(false);
      toast({ title: "Invalid code", description: vErr.message, variant: "destructive" });
      return;
    }
    const fresh = generateRecoveryCodes();
    const { error: storeError } = await supabase.functions.invoke(
      "store-mfa-recovery-codes",
      { body: { codes: fresh } },
    );
    setBusy(false);
    if (storeError) {
      toast({ title: "Couldn't store new codes", description: storeError.message, variant: "destructive" });
      return;
    }
    setCodes(fresh);
    await onComplete();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Regenerate recovery codes</AlertDialogTitle>
          <AlertDialogDescription>
            All existing recovery codes will stop working. Enter a code from your authenticator
            app to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!codes ? (
          <>
            <div>
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
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy || code.length !== 6}
                onClick={(e) => { e.preventDefault(); void verifyAndRegen(); }}
              >
                {busy ? "Working…" : "Regenerate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Save these codes now.</strong> They will not be shown again.
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {codes.map((c) => <div key={c} className="border rounded px-2 py-1 text-center">{c}</div>)}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => {
                  void navigator.clipboard.writeText(codes.join("\n"));
                  toast({ title: "Copied to clipboard" });
                }}
              >Copy all</button>
              <button
                type="button"
                className="sv2-btn flex-1"
                onClick={() => {
                  const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "drive365-recovery-codes.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >Download</button>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); onOpenChange(false); }}>
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
