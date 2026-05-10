import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, KeyRound, LogOut, Eye, EyeOff, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast as uiToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PWD_MIN = 10;
const pwdValid = (p: string) => p.length >= PWD_MIN && /\d/.test(p);

export function AccountSecurityPanel() {
  const navigate = useNavigate();

  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [provider, setProvider] = useState<string>("email");
  const isPasswordUser = provider === "email";

  // Shared current-password (used to re-auth before email/password change)
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);

  // Email change
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Password change
  const [password, setPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setCurrentEmail(data.user?.email ?? "");
      const prov = (data.user?.app_metadata?.provider as string | undefined) ?? "email";
      setProvider(prov);
    });
    return () => { active = false; };
  }, []);

  /** Returns null on success, or an error message string on failure. */
  const reauth = async (): Promise<string | null> => {
    if (!isPasswordUser) return null;
    if (!currentPassword) return "Enter your current password to continue.";
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (error) return "Current password is incorrect.";
    return null;
  };

  const handleEmailUpdate = async () => {
    setEmailError(null);
    if (!email) return;
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError("That's already your current email.");
      return;
    }
    setSavingEmail(true);
    const auth = await reauth();
    if (auth) {
      setSavingEmail(false);
      setEmailError(auth);
      return;
    }
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/instructor/settings/login-security` },
    );
    setSavingEmail(false);
    if (error) {
      setEmailError(error.message);
      uiToast({ title: "Couldn't update email", description: error.message, variant: "destructive" });
      return;
    }
    setPendingEmail(email);
    setEmail("");
    setCurrentPassword("");
    uiToast({
      title: "Check your inbox",
      description: `We've sent a confirmation link to ${email}.`,
    });
  };

  const handlePasswordUpdate = async () => {
    setPwdError(null);
    if (!pwdValid(password)) {
      setPwdError(`Use at least ${PWD_MIN} characters and include a number.`);
      return;
    }
    setSavingPwd(true);
    const auth = await reauth();
    if (auth) {
      setSavingPwd(false);
      setPwdError(auth);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPwd(false);
    if (error) {
      setPwdError(error.message);
      uiToast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    setPassword("");
    setCurrentPassword("");
    uiToast({ title: "Password updated", description: "Your new password is now active." });
  };

  const handleSignOutEverywhere = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);
    if (error) {
      uiToast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/instructor/login");
  };

  return (
    <div className="space-y-6">
      {/* Currently signed in */}
      <div className="text-xs text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">
          {currentEmail || "—"}
        </span>
        {!isPasswordUser && (
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {provider}
          </span>
        )}
      </div>

      {/* Re-auth (only for password users) */}
      {isPasswordUser && (
        <div className="space-y-2">
          <Label className="font-medium">Current password</Label>
          <p className="text-xs text-muted-foreground">
            Required to change your email or password.
          </p>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              placeholder="Current password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(s => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Change email */}
      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Change login email</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll need to confirm the new email address from a link we send to it.
        </p>
        {pendingEmail && (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              Confirmation sent to <strong>{pendingEmail}</strong>. Click the link in
              that email to finish the change. Until then you'll keep signing in with
              your current address.
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="new@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(null); }}
            autoComplete="email"
          />
          <Button
            onClick={handleEmailUpdate}
            disabled={savingEmail || !email || (isPasswordUser && !currentPassword)}
          >
            {savingEmail && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Send confirmation
          </Button>
        </div>
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      {/* Change password */}
      {isPasswordUser ? (
        <div className="space-y-2 border-t pt-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Change password</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            At least {PWD_MIN} characters, including a number.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwdError(null); }}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={handlePasswordUpdate}
              disabled={savingPwd || !password || !currentPassword}
            >
              {savingPwd && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update password
            </Button>
          </div>
          {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
        </div>
      ) : (
        <div className="space-y-2 border-t pt-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Password</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            You signed in with {provider}. Manage your password through your provider.
          </p>
        </div>
      )}

      {/* Sign out everywhere */}
      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Sign out of all devices</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ends every active session, including this one. You'll need to sign in again.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={signingOut}>
              {signingOut && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign out everywhere
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign you out on every device, including this one. You'll
                need to sign back in to keep using your portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOutEverywhere}>
                Sign out everywhere
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
