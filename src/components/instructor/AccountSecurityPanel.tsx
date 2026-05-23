import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, KeyRound, LogOut, Eye, EyeOff, Info, Lock, User as UserIcon, Key, LockOpen, Send, Save, Mic } from "lucide-react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (password !== confirmPassword) {
      setPwdError("Passwords don't match.");
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
    setConfirmPassword("");
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

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    background: "#F2F4F8",
    border: "1px solid #eaecee",
    borderRadius: 8,
    padding: "8px 36px 8px 11px",
    fontSize: 12,
    color: "#1a1a1f",
    fontFamily: "inherit",
    outline: "none",
  };
  const sectionLabel = (Icon: any, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px 4px" }}>
      <Icon size={15} color="#2952b3" />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>{label}</span>
    </div>
  );
  const sectionDesc = (text: string) => (
    <p style={{ fontSize: 10, color: "#aaa", margin: 0, padding: "0 14px 8px" }}>{text}</p>
  );
  const divider = <div style={{ height: 1, background: "#f0f1f4" }} />;
  const inputWithIcon = (
    input: React.ReactNode,
    icon: React.ReactNode,
    bottomPad = 12,
  ) => (
    <div style={{ position: "relative", padding: `0 14px ${bottomPad}px` }}>
      {input}
      <span style={{ position: "absolute", right: 24, top: 0, bottom: bottomPad, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
    </div>
  );

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, background: "#e8eefb",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Lock size={18} color="#2952b3" />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1f", margin: 0, lineHeight: 1.2 }}>Login & security</h2>
          <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>Email, password and sign out settings</p>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14, overflow: "hidden" }}>
        {/* Signed in banner */}
        <div style={{
          background: "#f8f9fb", padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, background: "#e8eefb",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <UserIcon size={15} color="#2952b3" />
          </span>
          <div style={{ minWidth: 0, fontSize: 11 }}>
            <span style={{ color: "#888" }}>Signed in as </span>
            <span style={{ fontWeight: 600, color: "#1a1a1f" }}>{currentEmail || "—"}</span>
            {!isPasswordUser && (
              <span style={{ marginLeft: 6, fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.4 }}>
                · {provider}
              </span>
            )}
          </div>
        </div>

        {divider}

        {/* Current password */}
        {isPasswordUser && (
          <>
            {sectionLabel(Key, "Current password")}
            {sectionDesc("Required to change your email or password")}
            {inputWithIcon(
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                style={fieldStyle}
              />,
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
                style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "inline-flex" }}
              >
                {showCurrent ? <EyeOff size={15} color="#ccc" /> : <Eye size={15} color="#ccc" />}
              </button>,
            )}
            {divider}
          </>
        )}

        {/* Change email */}
        {sectionLabel(Mail, "Change login email")}
        {sectionDesc("We'll send a confirmation link to the new address")}
        {pendingEmail && (
          <div style={{
            display: "flex", gap: 8,
            margin: "0 14px 8px",
            padding: 10, border: "1px solid #fde68a", background: "#fffbeb",
            color: "#92400e", fontSize: 11, borderRadius: 8,
          }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Confirmation sent to <strong>{pendingEmail}</strong>. Click the link in that email to finish the change.</span>
          </div>
        )}
        {inputWithIcon(
          <input
            type="email"
            placeholder="new@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
            autoComplete="email"
            style={fieldStyle}
          />,
          <Mic size={15} color="#ccc" />,
        )}
        <div style={{ padding: "0 14px 12px" }}>
          <button
            type="button"
            onClick={handleEmailUpdate}
            disabled={savingEmail || !email || (isPasswordUser && !currentPassword)}
            style={{
              width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "#2952b3", color: "#fff", border: "none",
              padding: "10px 12px", borderRadius: 9,
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              cursor: savingEmail || !email || (isPasswordUser && !currentPassword) ? "not-allowed" : "pointer",
              opacity: savingEmail || !email || (isPasswordUser && !currentPassword) ? 0.55 : 1,
            }}
          >
            {savingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send confirmation
          </button>
          {emailError && <p style={{ margin: "8px 0 0", fontSize: 11, color: "#c9302c" }}>{emailError}</p>}
        </div>

        {divider}

        {/* Change password */}
        {isPasswordUser ? (
          <>
            {sectionLabel(LockOpen, "Change password")}
            {sectionDesc(`Must be at least ${PWD_MIN} characters`)}
            {inputWithIcon(
              <input
                type={showNew ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwdError(null); }}
                autoComplete="new-password"
                style={fieldStyle}
              />,
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide password" : "Show password"}
                style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "inline-flex" }}
              >
                {showNew ? <EyeOff size={15} color="#ccc" /> : <Eye size={15} color="#ccc" />}
              </button>,
              8,
            )}
            {inputWithIcon(
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(null); }}
                autoComplete="new-password"
                style={fieldStyle}
              />,
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "inline-flex" }}
              >
                {showConfirm ? <EyeOff size={15} color="#ccc" /> : <Eye size={15} color="#ccc" />}
              </button>,
            )}
            <div style={{ padding: "0 14px 12px" }}>
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={savingPwd || !password || !currentPassword}
                style={{
                  width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#1a1a1f", color: "#fff", border: "none",
                  padding: "10px 12px", borderRadius: 9,
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                  cursor: savingPwd || !password || !currentPassword ? "not-allowed" : "pointer",
                  opacity: savingPwd || !password || !currentPassword ? 0.55 : 1,
                }}
              >
                {savingPwd ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Update password
              </button>
              {pwdError && <p style={{ margin: "8px 0 0", fontSize: 11, color: "#c9302c" }}>{pwdError}</p>}
            </div>
          </>
        ) : (
          <div style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <KeyRound size={15} color="#2952b3" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>Password</span>
            </div>
            <p style={{ fontSize: 10, color: "#aaa", margin: 0 }}>
              You signed in with {provider}. Manage your password through your provider.
            </p>
          </div>
        )}
      </div>

      {/* Sign out everywhere - unchanged behaviour, restyled wrapper */}
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <LogOut size={15} color="#2952b3" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>Sign out of all devices</span>
        </div>
        <p style={{ fontSize: 10, color: "#aaa", margin: "0 0 10px" }}>
          Ends every active session, including this one. You'll need to sign in again.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={signingOut} size="sm">
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
