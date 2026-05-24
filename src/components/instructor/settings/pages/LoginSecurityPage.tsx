import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconLock, IconLockOpen, IconMail, IconUser, IconLogout,
  IconShieldCheck, IconEye, IconEyeOff, IconSend, IconDeviceFloppy,
  IconChevronRight,
} from "@tabler/icons-react";
import { TwoFactorPanel } from "./TwoFactorPanel";

// ---------- Hardcoded design tokens ----------
const BG = "#F2F4F8";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "0.5px solid #e0e3ea";
const DIVIDER = "1px solid #f0f1f4";
const TEXT = "#1a1a1f";
const MUTED = "#aaa";
const SUB = "#888";
const BLUE = "#2952b3";
const BLUE_TINT = "#e8eefb";
const RED = "#c9302c";
const RED_TINT = "#fbe8e8";
const GREEN = "#2d8a4e";
const GREEN_TINT = "#e8f5ee";
const FONT = "Poppins, system-ui, sans-serif";
const INPUT_BG = "#F2F4F8";
const INPUT_BORDER = "1px solid #eaecee";

// ---------- Shared bits ----------
function IconBox({
  size = 28, radius = 8, bg, color, children,
}: { size?: number; radius?: number; bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: radius, background: bg, color,
      display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
    }}>{children}</span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG, border: CARD_BORDER, borderRadius: 14,
      marginBottom: 12, overflow: "hidden", fontFamily: FONT, ...style,
    }}>{children}</div>
  );
}

function CardHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
      borderBottom: DIVIDER,
    }}>
      <span style={{ color: BLUE, display: "inline-flex" }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, flex: 1 }}>{title}</span>
      {right}
    </div>
  );
}

function FieldWrap({ children, pad = "0 14px 8px" }: { children: React.ReactNode; pad?: string }) {
  return <div style={{ padding: pad }}>{children}</div>;
}

function Description({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: MUTED, padding: "8px 14px 8px" }}>{children}</div>;
}

function PasswordInput({
  value, onChange, placeholder, autoComplete,
}: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", background: INPUT_BG,
      border: INPUT_BORDER, borderRadius: 8, padding: "0 8px 0 12px",
    }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          flex: 1, background: "transparent", border: 0, outline: "none",
          fontFamily: FONT, fontSize: 12, color: TEXT, padding: "10px 0",
        }}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"}
        style={{ background: "transparent", border: 0, color: MUTED, padding: 6, cursor: "pointer", display: "inline-flex" }}>
        {show ? <IconEyeOff size={16} stroke={1.5} /> : <IconEye size={16} stroke={1.5} />}
      </button>
    </div>
  );
}

function TextInput({
  type = "text", value, onChange, placeholder, autoComplete,
}: { type?: string; value: string; onChange: (v: string) => void; placeholder: string; autoComplete?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        width: "100%", background: INPUT_BG, border: INPUT_BORDER, borderRadius: 8,
        padding: "10px 12px", fontFamily: FONT, fontSize: 12, color: TEXT, outline: "none",
      }}
    />
  );
}

function PrimaryButton({
  onClick, disabled, children, bg = BLUE, icon,
}: { onClick: () => void; disabled?: boolean; children: React.ReactNode; bg?: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        background: bg, color: "#fff", border: 0, borderRadius: 9,
        padding: "11px 14px", fontFamily: FONT, fontSize: 12, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{children}
    </button>
  );
}

// ---------- Re-auth helper (Fix 1) ----------
async function reauthenticate(currentPassword: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return "We couldn't verify your identity.";
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email, password: currentPassword,
  });
  if (error) return "Incorrect password";
  return null;
}

// ---------- Page header ----------
function PageHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px 12px", fontFamily: FONT }}>
      <IconBox size={36} radius={10} bg={BLUE_TINT} color={BLUE}>
        <IconLock size={18} stroke={1.5} />
      </IconBox>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>Login &amp; security</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Email, password and sign out settings</div>
      </div>
    </div>
  );
}

// ---------- Card 1: Signed in as ----------
function SignedInCard() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <IconBox size={28} radius={8} bg={BLUE_TINT} color={BLUE}>
          <IconUser size={15} stroke={1.5} />
        </IconBox>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: SUB }}>Signed in as</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email ?? "—"}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- Card 2: Change email ----------
function ChangeEmailCard() {
  const [currentPw, setCurrentPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!currentPw || !newEmail) return;
    setBusy(true);
    const authError = await reauthenticate(currentPw);
    if (authError) {
      setBusy(false);
      toast({ title: authError, variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(false);
    toast({
      title: error ? "Couldn't update email" : "Confirmation email sent",
      description: error ? error.message : "Check your inbox at the new address to confirm the change.",
      variant: error ? "destructive" : undefined,
    });
    if (!error) { setCurrentPw(""); setNewEmail(""); }
  };

  return (
    <Card>
      <CardHeader icon={<IconMail size={15} stroke={1.5} />} title="Change login email" />
      <Description>We'll send a confirmation link to the new address</Description>
      <FieldWrap>
        <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Current password" autoComplete="current-password" />
      </FieldWrap>
      <FieldWrap pad="0 14px 12px">
        <TextInput type="email" value={newEmail} onChange={setNewEmail} placeholder="new@example.com" autoComplete="email" />
      </FieldWrap>
      <FieldWrap pad="0 14px 14px">
        <PrimaryButton onClick={submit} disabled={busy || !currentPw || !newEmail} icon={<IconSend size={14} stroke={1.5} />}>
          {busy ? "Sending…" : "Send confirmation"}
        </PrimaryButton>
      </FieldWrap>
    </Card>
  );
}

// ---------- Password strength ----------
function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#e0e3ea" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  // Base segment for any input
  s = Math.max(1, s + (pw.length >= 8 ? 1 : 0));
  if (s > 4) s = 4;
  const score = s as 0 | 1 | 2 | 3 | 4;
  const map = {
    1: { label: "Weak", color: "#c9302c" },
    2: { label: "Fair", color: "#d97706" },
    3: { label: "Strong", color: BLUE },
    4: { label: "Very strong", color: GREEN },
  } as const;
  return { score, ...map[score === 0 ? 1 : score] };
}

function StrengthBar({ pw }: { pw: string }) {
  const { score, label, color } = scorePassword(pw);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= score ? color : "#eaecee",
          }} />
        ))}
      </div>
      {pw && <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{label}</div>}
    </div>
  );
}

// ---------- Card 3: Change password ----------
function ChangePasswordCard() {
  const [currentPw, setCurrentPw] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = currentPw.length > 0 && pw.length >= 8 && pw === confirm;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    const authError = await reauthenticate(currentPw);
    if (authError) {
      setBusy(false);
      toast({ title: authError, variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    toast({
      title: error ? "Couldn't update password" : "Password updated",
      description: error?.message,
      variant: error ? "destructive" : undefined,
    });
    if (!error) { setCurrentPw(""); setPw(""); setConfirm(""); }
  };

  return (
    <Card>
      <CardHeader icon={<IconLockOpen size={15} stroke={1.5} />} title="Change password" />
      <Description>Must be at least 8 characters</Description>
      <FieldWrap>
        <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Current password" autoComplete="current-password" />
      </FieldWrap>
      <FieldWrap>
        <PasswordInput value={pw} onChange={setPw} placeholder="New password" autoComplete="new-password" />
        <StrengthBar pw={pw} />
      </FieldWrap>
      <FieldWrap pad="0 14px 12px">
        <PasswordInput value={confirm} onChange={setConfirm} placeholder="Confirm new password" autoComplete="new-password" />
        {confirm && pw !== confirm && (
          <div style={{ fontSize: 10, color: RED, marginTop: 4 }}>Passwords don't match.</div>
        )}
      </FieldWrap>
      <FieldWrap pad="0 14px 14px">
        <PrimaryButton onClick={submit} disabled={busy || !valid} bg={TEXT} icon={<IconDeviceFloppy size={14} stroke={1.5} />}>
          {busy ? "Updating…" : "Update password"}
        </PrimaryButton>
      </FieldWrap>
    </Card>
  );
}

// ---------- Card 4 header: 2FA status pill ----------
function TwoFactorHeaderCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) { setEnabled(false); return; }
    setEnabled(!!(data?.totp ?? []).find((f) => f.status === "verified"));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const pill = enabled === null ? null : enabled ? (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
      background: GREEN_TINT, color: GREEN,
    }}>Enabled</span>
  ) : (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
      background: "#eef0f3", color: "#888",
    }}>Disabled</span>
  );

  return (
    <Card style={{ padding: 0 }}>
      <CardHeader icon={<IconShieldCheck size={15} stroke={1.5} />} title="Two-factor authentication" right={pill} />
      <div className="settings-v2" style={{ padding: "8px 4px" }}>
        <TwoFactorPanel />
      </div>
    </Card>
  );
}

// ---------- Card 5: Sign out everywhere ----------
function SignOutEverywhereCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setBusy(false);
    setOpen(false);
    if (error) {
      toast({ title: "Couldn't sign out", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out of all devices" });
    }
  };
  return (
    <Card>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: "transparent", border: 0, width: "100%", textAlign: "left", cursor: "pointer",
            fontFamily: FONT,
          }}>
            <IconBox size={28} radius={8} bg={RED_TINT} color={RED}>
              <IconLogout size={15} stroke={1.5} />
            </IconBox>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: TEXT }}>Sign out everywhere</span>
              <span style={{ display: "block", fontSize: 10, color: MUTED, marginTop: 1 }}>Ends all active sessions on all devices</span>
            </span>
            <IconChevronRight size={16} stroke={1.5} color="#ccc" />
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
    </Card>
  );
}

// ---------- Page ----------
export function LoginSecurityPage() {
  return (
    <div style={{ background: BG, fontFamily: FONT, padding: "4px 0 12px" }}>
      <PageHeader />
      <SignedInCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
      <TwoFactorHeaderCard />
      <SignOutEverywhereCard />
    </div>
  );
}
