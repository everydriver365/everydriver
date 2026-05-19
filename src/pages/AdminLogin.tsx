import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, AlertCircle, ArrowLeft, Shield, Lock, Award, Car, Mail, Check, ChevronRight,
} from "lucide-react";
import { z } from "zod";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";
import { isEmailNotConfirmedError, resendSignupConfirmation } from "@/lib/emailConfirmation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  PortalLoginLayout,
  portalTokens as t,
  portalInputStyle,
  portalLabelStyle,
  portalInputFocus,
  portalInputBlur,
} from "@/components/auth/PortalLoginLayout";
import { DarkMobileAuthForm } from "@/components/auth/DarkMobileAuthForm";
import everydriverLogo from "@/assets/ed-white-logo.png";
import dsmLogo from "@/assets/dsm-logo.png";
import adminHero from "@/assets/drive365-hero-driver.webp";
import { useClearOnDeepLink } from "@/hooks/useClearOnDeepLink";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const emailSchema = z.object({ email: z.string().email("Please enter a valid email address") });

type ViewMode = "login" | "signup" | "forgot" | "reset";

function EveryDriverMark({ size = 14 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: size + 14, height: size + 14, background: "#10B981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Car size={size + 2} color="#FFF" strokeWidth={2} />
      </div>
      <span style={{ fontSize: size + 4, fontWeight: 700, color: t.white, letterSpacing: -0.2 }}>EveryDriver</span>
    </div>
  );
}
function EveryDriverMarkDark({ size = 12 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: size + 10, height: size + 10, background: "#10B981", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Car size={size} color="#FFF" strokeWidth={2} />
      </div>
      <span style={{ fontSize: size + 2, fontWeight: 700, color: t.navy, letterSpacing: -0.1 }}>EveryDriver</span>
    </div>
  );
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const { signIn, isAdmin, user } = useAdminAuth();
  const navigate = useNavigate();

  useClearOnDeepLink(() => { setError(""); setSuccess(""); });

  useState(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") setViewMode("reset");
  });

  if (user && isAdmin) {
    navigate("/admin");
    return null;
  }

  const canSubmit =
    viewMode === "reset"
      ? newPassword.length >= 6 && newPassword === confirmPassword
      : viewMode === "forgot"
        ? email.trim().length > 0
        : email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (viewMode === "forgot") {
      const v = emailSchema.safeParse({ email });
      if (!v.success) { setError(v.error.errors[0].message); return; }
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?portal=admin`,
      });
      if (resetError) { setError(resetError.message); setLoading(false); return; }
      setSuccess("Password reset email sent! Check your inbox.");
      setLoading(false);
      return;
    }

    if (viewMode === "reset") {
      if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
      if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      setSuccess("Password updated successfully! You can now sign in.");
      setViewMode("login"); setNewPassword(""); setConfirmPassword(""); setLoading(false);
      return;
    }

    const v = loginSchema.safeParse({ email, password });
    if (!v.success) { setError(v.error.errors[0].message); return; }
    setLoading(true);

    if (viewMode === "signup") {
      const redirectUrl = `${window.location.origin}/admin/login`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: redirectUrl },
      });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      setSuccess(
        signUpData.session
          ? "Account created! Please contact an administrator to grant you admin access, then sign in."
          : "Account created! Check your inbox to verify your email, then sign in. An administrator will need to grant you admin access."
      );
      setViewMode("login"); setLoading(false); return;
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      if (isEmailNotConfirmedError(signInError)) {
        setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
        void resendSignupConfirmation(email, `${window.location.origin}/admin/login`);
      } else {
        setError(signInError.message);
      }
      setLoading(false); return;
    }
    setRememberMe(rememberMe);
    setTimeout(() => setLoading(false), 1500);
  };

  const title =
    viewMode === "signup" ? "Create admin account" :
    viewMode === "forgot" ? "Reset password" :
    viewMode === "reset" ? "Set new password" : "Welcome back";
  const subtitle =
    viewMode === "signup" ? "Create an account to request admin access." :
    viewMode === "forgot" ? "Enter your email and we'll send a reset link." :
    viewMode === "reset" ? "Enter and confirm your new password." :
    "Sign in to the EveryDriver admin console.";

  return (
    <>
      {/* ============== MOBILE-ONLY — shared dark navy shell ============== */}
      <DarkMobileAuthForm
        logoSrc={dsmLogo}
        logoAlt="Driving School Manager"
        title={title}
        subtitle={subtitle}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPw}
        setShowPassword={setShowPw}
        rememberMe={rememberMe}
        setRememberMe={setRememberMeState}
        isForgot={viewMode === "forgot"}
        onForgotToggle={(v) => { setViewMode(v ? "forgot" : "login"); setError(""); setSuccess(""); }}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onGoogleClick={() => {
          const wrap = document.getElementById("mobile-admin-google");
          wrap?.querySelector<HTMLButtonElement>("button")?.click();
        }}
        hiddenSlot={
          <div id="mobile-admin-google" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
            <GoogleSignInButton redirectTo={`${window.location.origin}/auth/redirect?portal=admin`} />
          </div>
        }
      />

      {/* ============== DESKTOP / TABLET ============== */}
      <div className="hidden md:block">
    <PortalLoginLayout
      leftBrand={<EveryDriverMark size={20} />}
      leftBrandCaption="Platform control centre"
      leftTag="Admin portal"
      leftHeadline={<>Manage the<br />platform,<br /><span style={{ color: "#10B981" }}>end&nbsp;to&nbsp;end.</span></>}
      leftSub="Instructors, bookings, payments and analytics — oversee the entire EveryDriver network from one console."
      leftFeatures={[
        { Icon: Shield, title: "Full platform oversight", sub: "Instructors, schools, pupils & finances" },
        { Icon: Lock, title: "Role-based access control", sub: "Granular permissions per team member" },
        { Icon: Award, title: "Real-time analytics", sub: "Live KPIs across the network" },
      ]}
      leftFooter={`© ${new Date().getFullYear()} EveryDriver Ltd · Admin console`}
      cardBrand={<EveryDriverMarkDark size={12} />}
      cardTag="Admin portal"
      cardTitle={title}
      cardSubtitle={subtitle}
      footer={
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, fontSize: 11, color: t.muted }}>
          <Link to="/drive365" style={{ color: t.mid, textDecoration: "none" }}>Drive365</Link><span>·</span>
          <Link to="/pupil/login" style={{ color: t.mid, textDecoration: "none" }}>Pupil</Link><span>·</span>
          <Link to="/instructor-app/login" style={{ color: t.mid, textDecoration: "none" }}>Instructor</Link><span>·</span>
          <Link to="/school/login" style={{ color: t.mid, textDecoration: "none" }}>School</Link>
        </div>
      }
      mobileHero={{
        heroSrc: adminHero,
        logoSrc: dsmLogo,
        logoAlt: "EveryDriver Admin",
        title,
        subtitle,
      }}
    >
      <form onSubmit={handleSubmit} name="admin-login" method="post" action="#">

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 14 }}>
              <div style={{ padding: "10px 12px", borderRadius: 9, background: "#FBEAEA", border: `1px solid ${t.red}`, color: t.redDark, fontSize: 12, display: "flex", gap: 8 }}>
                <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  {error}
                  {error.toLowerCase().includes("verify your email") && (
                    <button
                      type="button"
                      style={{ display: "block", marginTop: 4, textDecoration: "underline", background: "none", border: "none", color: t.redDark, fontWeight: 500, cursor: "pointer", fontSize: 12, padding: 0 }}
                      onClick={async () => {
                        if (!email.trim()) return;
                        const { error: resendErr } = await resendSignupConfirmation(email, `${window.location.origin}/admin/login`);
                        if (resendErr) setError(resendErr.message);
                        else setSuccess("Confirmation email sent. Check your inbox.");
                      }}
                    >
                      Resend confirmation email
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {success && (
          <div style={{ padding: "10px 12px", borderRadius: 9, background: "rgba(29,158,117,0.1)", border: `1px solid ${t.green}`, color: t.greenDark, fontSize: 12, marginBottom: 14 }}>
            {success}
          </div>
        )}

        {viewMode === "reset" ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={portalLabelStyle}>New password</label>
              <input
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={portalInputStyle}
                onFocus={portalInputFocus}
                onBlur={portalInputBlur}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={portalLabelStyle}>Confirm password</label>
              <input
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={portalInputStyle}
                onFocus={portalInputFocus}
                onBlur={portalInputBlur}
              />
            </div>
          </>
        ) : (
          <>
            {(viewMode === "login" || viewMode === "signup") && (
              <div style={{ marginBottom: 22 }}>
                <GoogleSignInButton
                  redirectTo={`${window.location.origin}/auth/redirect?portal=admin`}
                  className="w-full"
                />
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
                  <div style={{ flex: 1, height: 1, background: "#E8EDF6" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.placeholder, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>OR CONTINUE WITH EMAIL</span>
                  <div style={{ flex: 1, height: 1, background: "#E8EDF6" }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={portalLabelStyle}>Email address</label>
              <div style={{ position: "relative" }}>
                <input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                  autoComplete="username"
                  style={{ ...portalInputStyle, paddingRight: 40 }}
                  onFocus={portalInputFocus}
                  onBlur={portalInputBlur}
                />
                <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)" }}>
                  <Mail size={15} color={t.placeholder} strokeWidth={1.7} />
                </div>
              </div>
            </div>

            {viewMode !== "forgot" && (
              <div style={{ marginBottom: 14 }}>
                <label style={portalLabelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete={viewMode === "signup" ? "new-password" : "current-password"}
                    style={{ ...portalInputStyle, paddingRight: 40 }}
                    onFocus={portalInputFocus}
                    onBlur={portalInputBlur}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: t.placeholder, fontSize: 11, fontWeight: 600 }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {viewMode === "login" && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, padding: "12px 14px", background: t.surface, borderRadius: 9 }}>
                <div
                  onClick={() => setRememberMeState((v) => !v)}
                  style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    backgroundColor: rememberMe ? t.blue : t.white,
                    border: `1.5px solid ${rememberMe ? t.blue : t.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  {rememberMe && <Check size={11} color={t.white} strokeWidth={3} />}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.navy }}>
                  Keep me signed in
                  <div style={{ fontSize: 11, fontWeight: 300, color: t.muted, marginTop: 2 }}>
                    Stays signed in on this browser until you sign out.
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          style={{
            width: "100%", backgroundColor: t.red, border: "none", borderRadius: 10, padding: 14,
            fontSize: 15, fontWeight: 600, color: t.white, cursor: canSubmit && !loading ? "pointer" : "default",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 16, letterSpacing: "0.01em",
            opacity: canSubmit && !loading ? 1 : 0.45,
            transition: "opacity 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => { if (canSubmit && !loading) (e.currentTarget as HTMLElement).style.background = t.redDark; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = t.red; }}
        >
          {loading ? (<><Loader2 size={15} className="animate-spin" /> {viewMode === "signup" ? "Creating…" : viewMode === "forgot" ? "Sending…" : viewMode === "reset" ? "Updating…" : "Signing in…"}</>)
            : viewMode === "signup" ? "Create account"
            : viewMode === "forgot" ? "Send reset link"
            : viewMode === "reset" ? "Update password"
            : <>Sign In <ChevronRight size={15} color={t.white} strokeWidth={2.2} /></>}
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {viewMode === "login" && (
            <>
              <button type="button" onClick={() => { setViewMode("forgot"); setError(""); setSuccess(""); }}
                style={{ fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer" }}>
                Forgot password?
              </button>
              <p style={{ fontSize: 13, fontWeight: 300, color: t.muted, margin: 0 }}>
                Need an account?{" "}
                <button type="button" onClick={() => { setViewMode("signup"); setError(""); setSuccess(""); }}
                  style={{ fontWeight: 600, color: t.blue, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                  Sign up
                </button>
              </p>
            </>
          )}
          {viewMode === "signup" && (
            <p style={{ fontSize: 13, fontWeight: 300, color: t.muted, margin: 0 }}>
              Already have an account?{" "}
              <button type="button" onClick={() => { setViewMode("login"); setError(""); setSuccess(""); }}
                style={{ fontWeight: 600, color: t.blue, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Sign in
              </button>
            </p>
          )}
          {(viewMode === "forgot" || viewMode === "reset") && (
            <button type="button" onClick={() => { setViewMode("login"); setError(""); setSuccess(""); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer" }}>
              <ArrowLeft size={13} /> Back to sign in
            </button>
          )}
        </div>
      </form>
    </PortalLoginLayout>
      </div>
    </>
  );
}
