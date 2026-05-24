import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type Step = "password" | "acknowledge" | "submitting";

export function DangerZone() {
  const { user, signOut } = useInstructorAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("password");
    setPassword("");
    setMfaCode("");
    setMfaFactorId(null);
    setAck(false);
    setConfirmText("");
    setBusy(false);
    setError(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (busy) return;
    setOpen(v);
    if (!v) reset();
  };

  const handlePasswordConfirm = async () => {
    if (!user?.email || !password) {
      setError("Enter your password to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (signInErr) {
        setError("Password is incorrect.");
        setBusy(false);
        return;
      }
      setStep("acknowledge");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
    if (!mfaFactorId || mfaCode.length < 6) {
      setError("Enter your 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeErr || !challenge) {
        setError("Could not start MFA challenge.");
        setBusy(false);
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      });
      if (verifyErr) {
        setError("Invalid code.");
        setBusy(false);
        return;
      }
      setStep("acknowledge");
    } catch (e) {
      setError(e instanceof Error ? e.message : "MFA verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = ack && confirmText === "DELETE";

  const handleSubmitDeletion = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setStep("submitting");
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke(
        "request-account-deletion",
        { body: {} },
      );
      if (invokeErr || (data && (data as { error?: string }).error)) {
        const msg = invokeErr?.message ||
          (data as { error?: string })?.error ||
          "Deletion request failed.";
        setError(msg);
        setBusy(false);
        setStep("acknowledge");
        return;
      }
      toast.success(
        "Your account deletion has been scheduled. You have been signed out. Check your email for details and a cancellation link.",
        { duration: 10000 },
      );
      // Sign out locally and redirect.
      await signOut();
      setOpen(false);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deletion request failed.");
      setBusy(false);
      setStep("acknowledge");
    }
  };

  return (
    <Card className="border-l-4 border-l-destructive/70 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-5 w-5 text-destructive" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-sm">Delete your account</p>
            <p className="text-xs text-muted-foreground max-w-md">
              Permanently deletes your account and all associated data after a
              30-day grace period. Financial records are retained for 6 years as
              required by HMRC.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={() => setOpen(true)}
          >
            Delete account
          </Button>
        </div>
      </CardContent>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete account
            </SheetTitle>
            <SheetDescription>
              This is permanent after the 30-day grace period.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {step === "password" && (
              <div className="space-y-3">
                <Label htmlFor="dz-password">Confirm your password to continue</Label>
                <Input
                  id="dz-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={handlePasswordConfirm} disabled={busy || !password}>
                    {busy ? "Verifying..." : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {step === "mfa" && (
              <div className="space-y-3">
                <Label htmlFor="dz-mfa">Enter your 6-digit authenticator code</Label>
                <Input
                  id="dz-mfa"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  disabled={busy}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={handleMfaConfirm} disabled={busy || mfaCode.length !== 6}>
                    {busy ? "Verifying..." : "Continue"}
                  </Button>
                </div>
              </div>
            )}

            {(step === "acknowledge" || step === "submitting") && (
              <div className="space-y-4">
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2 text-sm">
                  <p>Your account and all lesson, pupil, and scheduling data will be permanently deleted.</p>
                  <p>Financial records (payments, invoices) will be anonymised and retained for 6 years as required by HMRC.</p>
                  <p>You will have 30 days to cancel this request.</p>
                  <p className="font-medium">This cannot be undone after the 30-day grace period.</p>
                </div>

                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={ack}
                    onCheckedChange={(v) => setAck(v === true)}
                    disabled={busy}
                  />
                  <span>I understand my account will be permanently deleted</span>
                </label>

                <div className="space-y-1.5">
                  <Label htmlFor="dz-confirm">Type DELETE to confirm</Label>
                  <Input
                    id="dz-confirm"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={busy}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSubmitDeletion}
                    disabled={!canSubmit || busy}
                  >
                    {busy ? "Submitting..." : "Delete my account"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
