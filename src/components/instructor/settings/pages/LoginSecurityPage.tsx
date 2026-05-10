import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SettingsListRow } from "../SettingsListRow";
import { StatusPill } from "../StatusPill";
import { IconMail, IconKey, IconLogout, IconShieldCheck, IconDeviceLaptop } from "@tabler/icons-react";

export function LoginSecurityPage() {
  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Sign-in</div>
          <div className="sv2-section-sub">Update the credentials you use to access your account.</div>
        </div>
        <div>
          <ChangeEmailRow />
          <ChangePasswordRow />
          <SignOutEverywhereRow />
        </div>
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Two-factor authentication</div>
          <div className="sv2-section-sub">Add a second step when signing in from a new device.</div>
        </div>
        <SettingsListRow
          icon={<IconShieldCheck size={16} stroke={1.5} />}
          name="Authenticator app"
          meta="Use an app like 1Password or Authy to generate codes"
          status={<StatusPill variant="warning">Coming soon</StatusPill>}
        />
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Active sessions</div>
          <div className="sv2-section-sub">Devices currently signed in to your account.</div>
        </div>
        <SettingsListRow
          icon={<IconDeviceLaptop size={16} stroke={1.5} />}
          name="This device"
          meta="Active now"
          status={<StatusPill variant="success">Current</StatusPill>}
        />
      </section>
    </>
  );
}

function ChangeEmailRow() {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email });
    setBusy(false);
    setOpen(false);
    toast({
      title: error ? "Couldn't update email" : "Confirmation email sent",
      description: error ? error.message : "Check your inbox at the new address to confirm the change.",
      variant: error ? "destructive" : undefined,
    });
    if (!error) setEmail("");
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="sv2-row w-full text-left" style={{ background: "transparent", border: 0, cursor: "pointer" }}>
          <span className="sv2-row-icon"><IconMail size={16} stroke={1.5} /></span>
          <span className="flex-1 min-w-0">
            <span className="sv2-row-name block">Change login email</span>
            <span className="sv2-row-meta block">A confirmation link is sent to the new address.</span>
          </span>
          <span className="sv2-btn">Change</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change login email</AlertDialogTitle>
          <AlertDialogDescription>
            We'll send a confirmation link to the new address. The change takes effect once you click the link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <label className="sv2-label">New email address</label>
          <input
            className="sv2-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !email} onClick={(e) => { e.preventDefault(); void submit(); }}>
            {busy ? "Sending…" : "Send confirmation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ChangePasswordRow() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = pw.length >= 8 && pw === confirm;
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    setOpen(false);
    toast({
      title: error ? "Couldn't update password" : "Password updated",
      description: error?.message,
      variant: error ? "destructive" : undefined,
    });
    if (!error) { setPw(""); setConfirm(""); }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="sv2-row w-full text-left" style={{ background: "transparent", border: 0, cursor: "pointer" }}>
          <span className="sv2-row-icon"><IconKey size={16} stroke={1.5} /></span>
          <span className="flex-1 min-w-0">
            <span className="sv2-row-name block">Change password</span>
            <span className="sv2-row-meta block">Use at least 8 characters.</span>
          </span>
          <span className="sv2-btn">Change</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change password</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a strong password you don't reuse on other sites.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <label className="sv2-label">New password</label>
            <input className="sv2-input" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          </div>
          <div>
            <label className="sv2-label">Confirm new password</label>
            <input className="sv2-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            {confirm && pw !== confirm && <div className="sv2-helper" style={{ color: "var(--color-text-danger)" }}>Passwords don't match.</div>}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !valid} onClick={(e) => { e.preventDefault(); void submit(); }}>
            {busy ? "Updating…" : "Update password"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SignOutEverywhereRow() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setBusy(false);
    setOpen(false);
    if (error) toast({ title: "Couldn't sign out", description: error.message, variant: "destructive" });
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="sv2-row w-full text-left" style={{ background: "transparent", border: 0, cursor: "pointer" }}>
          <span className="sv2-row-icon"><IconLogout size={16} stroke={1.5} /></span>
          <span className="flex-1 min-w-0">
            <span className="sv2-row-name block">Sign out of all devices</span>
            <span className="sv2-row-meta block">Ends every active session, including this one.</span>
          </span>
          <span className="sv2-btn">Sign out</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll need to sign in again on this device and any others where you're currently signed in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void submit(); }}>
            {busy ? "Signing out…" : "Sign out everywhere"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
