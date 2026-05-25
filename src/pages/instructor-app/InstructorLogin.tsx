import { useState, useEffect, useRef } from "react";
import dsmLogo from "@/assets/dsm-logo.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import {
  Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, Mail, Check,
  ChevronRight, CheckCircle2, MailCheck, Calendar, User, ShieldCheck, Lock, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  getBiometryLabel,
} from "@/lib/biometricAuth";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";
import { isEmailNotConfirmedError, resendSignupConfirmation } from "@/lib/emailConfirmation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MobileLoginHero } from "@/components/auth/MobileLoginHero";
import { DarkMobileAuthForm } from "@/components/auth/DarkMobileAuthForm";
import { useClearOnDeepLink } from "@/hooks/useClearOnDeepLink";
import instructorHero from "@/assets/every-instructor-hero.webp";
import mobileLoginHero from "@/assets/mobile-login-hero.png";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const LOGIN_LOG_PREFIX = "[InstructorLogin]";

const t = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  red: "#CC2229",
  redDark: "#A81E24",
  green: "#1D9E75",
  greenDark: "#085041",
  mid: "#6B7280",
  muted: "#9CA3AF",
  placeholder: "#C4C9D4",
  surface: "#F2F4F8",
  white: "#FFFFFF",
  border: "#DDE3ED",
};

function DSMLogoImg({ height = 28 }: { height?: number }) {
  return <img src={dsmLogo} alt="DSM — Driving School Manager" style={{ height, width: "auto" }} />;
}

function FaceIdIcon({ scanning }: { scanning: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path d="M2 8V5a3 3 0 013-3h3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M22 8V5a3 3 0 00-3-3h-3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M2 16v3a3 3 0 003 3h3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M22 16v3a3 3 0 01-3 3h-3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={9} cy={10} r={1} fill="currentColor" />
      <circle cx={15} cy={10} r={1} fill="currentColor" />
      <path d="M9 14.5s1 1.5 3 1.5 3-1.5 3-1.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      <path
        d="M7.5 12h9"
        stroke={t.blue}
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{
          opacity: scanning ? undefined : 0.4,
          animation: scanning ? "dsm365-faceid-scan 1.8s ease-in-out infinite" : undefined,
        }}
      />
    </svg>
  );
}

export default function InstructorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMeState] = useState(getRememberMe() ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSentTo, setResetSentTo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState("Face ID / Touch ID");
  const [faceIdState, setFaceIdState] = useState<"idle" | "scanning" | "success">("idle");
  const activeAuthAttemptRef = useRef(0);

  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showVerifyBanner = searchParams.get("verify") === "1";

  // Single source of truth for clearing transient auth state. Used by both
  // deep-link arrivals AND the mobile sign-in ↔ forgot-password toggle so no
  // stale banner / password / loading flag leaks across views.
  const clearAuthTransientState = () => {
    activeAuthAttemptRef.current += 1;
    setError("");
    setResetSent(false);
    setResetSentTo("");
    setPassword("");
    setLoading(false);
    setFaceIdState("idle");
  };

  const startAuthAttempt = () => {
    activeAuthAttemptRef.current += 1;
    return activeAuthAttemptRef.current;
  };

  const isActiveAuthAttempt = (attemptId: number) => activeAuthAttemptRef.current === attemptId;

  useClearOnDeepLink(clearAuthTransientState);

  const switchMobileView = (toForgot: boolean) => {
    clearAuthTransientState();
    setIsForgotPassword(toForgot);
  };

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill && !email) setEmail(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  useEffect(() => {
    (async () => {
      try {
        const available = await isBiometricAvailable("instructor");
        setBiometricAvailable(available);
        if (available) setBiometryLabel(await getBiometryLabel());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleBiometricLogin = async () => {
    if (faceIdState === "scanning") return;
    const attemptId = startAuthAttempt();
    setFaceIdState("scanning");
    setError("");
    const safety = window.setTimeout(() => {
      if (!isActiveAuthAttempt(attemptId)) return;
      setFaceIdState("idle");
      setError("Biometric login timed out. Please use email and password.");
    }, 20000);
    try {
      const creds = await getBiometricCredentials("instructor", "Sign in to DSM365");
      if (!isActiveAuthAttempt(attemptId)) return;
      if (!creds) {
        setFaceIdState("idle");
        setError("No saved credentials found. Please log in manually first.");
        return;
      }
      console.info(`${LOGIN_LOG_PREFIX} biometric sign-in submitted`);
      const { error: signInError } = await signIn(creds.email, creds.password);
      if (!isActiveAuthAttempt(attemptId)) return;
      if (signInError) {
        setFaceIdState("idle");
        setError("Biometric login failed. Please use email and password.");
      } else {
        setFaceIdState("success");
        toast.success("Welcome back!");
        console.info(`${LOGIN_LOG_PREFIX} biometric redirecting to instructor dashboard`);
        navigate("/instructor");
      }
    } catch {
      if (!isActiveAuthAttempt(attemptId)) return;
      setFaceIdState("idle");
      setError("Biometric login not available. Please use email and password.");
    } finally {
      window.clearTimeout(safety);
    }
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setError("");

    if (isForgotPassword) {
      const trimmed = email.trim();
      const v = z.string().trim().email().safeParse(trimmed);
      if (!v.success) { setError("Please enter a valid email address"); return; }
      if (resendCooldown > 0) return;
      setLoading(true);
      try {
        const { error: resetError } = await resetPassword(trimmed);
        if (resetError) setError(resetError.message);
        else {
          setResetSent(true);
          setResetSentTo(trimmed);
          setResendCooldown(30);
          toast.success("Password reset email sent. Check your inbox.");
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    const validation = loginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) { setError(validation.error.errors[0].message); return; }

    const attemptId = startAuthAttempt();
    setLoading(true);
    console.info(`${LOGIN_LOG_PREFIX} password sign-in submitted`);
    try {
      const { error: signInError, session } = await signIn(email.trim(), password);
      if (!isActiveAuthAttempt(attemptId)) return;
      if (signInError) {
        if (isEmailNotConfirmedError(signInError)) {
          setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
          void resendSignupConfirmation(email.trim(), `${window.location.origin}/instructor-app/login`);
        } else if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else if (/timed out|timeout|busy|try again|database error/i.test(signInError.message)) {
          setError("The login service is busy. Please wait a few seconds and try again.");
        } else {
          setError(signInError.message);
        }
      } else {
        setRememberMe(rememberMe);
        await saveBiometricCredentials("instructor", email.trim(), password);
        if (!isActiveAuthAttempt(attemptId)) return;
        setBiometricAvailable(true);
        toast.success("Welcome back!");
        console.info(`${LOGIN_LOG_PREFIX} password redirecting to instructor dashboard`, {
          sessionReceived: Boolean(session),
        });
        navigate("/instructor");
      }
    } catch {
      if (!isActiveAuthAttempt(attemptId)) return;
      setError("An unexpected error occurred");
    } finally {
      if (isActiveAuthAttempt(attemptId)) setLoading(false);
    }
  };

  const features = [
    { iconBg: "rgba(26,82,160,0.25)", Icon: Calendar, title: "Schedule & lessons", sub: "Full diary, bookings and lesson history" },
    { iconBg: "rgba(26,82,160,0.25)", Icon: User, title: "Pupil management", sub: "Progress, payments and notes" },
    { iconBg: "rgba(204,34,41,0.25)", Icon: ShieldCheck, title: "CPD & compliance", sub: "DVSA records and credential tracking" },
  ];

  return (
    <>
      {/* ============== MOBILE-ONLY — shared dark-navy shell (matches pupil login) ============== */}
      <DarkMobileAuthForm
        logoSrc={dsmLogo}
        logoAlt="Driving School Manager"
        heroSrc={mobileLoginHero}
        heroAlt="Driving School Manager"
        title={isForgotPassword ? "Reset password" : "Welcome back"}
        subtitle={
          isForgotPassword
            ? resetSent
              ? `We've sent a reset link to ${resetSentTo}`
              : "Enter your email and we'll send you a reset link."
            : "Sign in to your Driving School Manager account."
        }
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPw}
        setShowPassword={setShowPw}
        rememberMe={rememberMe}
        setRememberMe={setRememberMeState}
        isForgot={isForgotPassword}
        onForgotToggle={switchMobileView}
        loading={loading}
        error={error}
        onSubmit={handleSignIn}
        signUpHref="/instructor-app/signup"
        signUpLabel="Don't have an account?"
        biometricAvailable={biometricAvailable && !isForgotPassword}
        biometricLoading={faceIdState === "scanning"}
        onBiometric={handleBiometricLogin}
        surface="light"
        heroOffsetY={-50}
      />


    <div className="hidden md:block" style={{ minHeight: "100vh", fontFamily: "Poppins, system-ui, sans-serif", background: t.surface }}>
      <style>{`@keyframes dsm365-faceid-scan { 0%,100% { opacity: 0.15 } 50% { opacity: 1 } }`}</style>
      <MobileLoginHero
        heroSrc={instructorHero}
        logoSrc={dsmLogo}
        logoAlt="Driving School Manager"
        title={isForgotPassword ? (resetSent ? "Check your email" : "Reset password") : "Welcome back"}
        subtitle={
          isForgotPassword
            ? resetSent
              ? `We've sent a reset link to ${resetSentTo}`
              : "Enter your email and we'll send you a reset link."
            : "Sign in to your Driving School Manager account."
        }
      />
      <div className="md:grid md:grid-cols-2" style={{ minHeight: "100vh" }}>



        {/* LeftPanel — hidden on mobile */}
        <div
          className="hidden md:flex"
          style={{
            backgroundColor: t.navy,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -120, left: -120, width: 380, height: 380, borderRadius: "50%", border: "60px solid rgba(26,82,160,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(204,34,41,0.07)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <DSMLogoImg height={36} />
            <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.35)", marginTop: 7, letterSpacing: "0.04em" }}>
              Driving School Manager
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 18 }}>
              <div style={{ width: 16, height: 2, background: t.red, borderRadius: 1, flexShrink: 0 }} />
              Instructor portal
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: t.white, lineHeight: 1.12, letterSpacing: -0.8, marginBottom: 14 }}>
              Manage your<br/>school,<br/>
              <span style={{ color: t.red }}>your way.</span>
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.4)", lineHeight: 1.75, marginBottom: 36, maxWidth: 320 }}>
              Pupils, lessons, payments and scheduling — all in one place. Built for DVSA-approved instructors.
            </p>

            {features.map((f) => {
              const Icon = f.Icon;
              return (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: f.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.white }}>{f.title}</div>
                    <div style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{f.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1 }}>
            © 2026 DSM365 Ltd · DVSA approved platform
          </p>
        </div>

        {/* RightPanel */}
        <div className="px-5 pt-2 pb-8 md:p-12" style={{ backgroundColor: t.surface, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[420px] md:bg-white md:border md:border-[#DDE3ED] md:shadow-[0_4px_24px_rgba(15,32,68,0.06)] md:rounded-[18px] md:p-9"
          >
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 10, marginBottom: 26 }}>
              <DSMLogoImg height={22} />
              <span style={{ fontSize: 11, fontWeight: 500, color: t.muted, letterSpacing: "0.03em" }}>Instructor portal</span>
            </div>

            <h2 className="hidden md:block" style={{ fontSize: 22, fontWeight: 700, color: t.navy, letterSpacing: -0.4, marginBottom: 5 }}>
              {isForgotPassword ? (resetSent ? "Check your email" : "Reset password") : "Welcome back"}
            </h2>
            <p className="hidden md:block" style={{ fontSize: 13, fontWeight: 300, color: t.muted, marginBottom: 22, lineHeight: 1.6 }}>
              {isForgotPassword
                ? resetSent
                  ? `We've sent a reset link to ${resetSentTo}`
                  : "Enter your email and we'll send you a reset link."
                : "Sign in to your Driving School Manager account."}
            </p>


            {showVerifyBanner && !error && !isForgotPassword && (
              <div style={{ padding: "10px 12px", borderRadius: 9, background: "#FEF3C7", border: "1px solid #FCD34D", color: "#92400E", fontSize: 12, marginBottom: 14, display: "flex", gap: 8 }}>
                <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Almost there — check your inbox and click the confirmation link.</span>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", marginBottom: 14 }}
                >
                  <div style={{ padding: "10px 12px", borderRadius: 9, background: "#FBEAEA", border: `1px solid ${t.red}`, color: t.redDark, fontSize: 12, display: "flex", gap: 8 }}>
                    <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isForgotPassword && resetSent && (
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(29,158,117,0.08)", border: `1px solid rgba(29,158,117,0.4)`, display: "flex", gap: 10, marginBottom: 16 }}>
                <MailCheck size={18} color={t.green} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: t.greenDark, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={13} /> Reset link sent
                  </div>
                  Open the email at <strong>{resetSentTo}</strong> and click the link to set a new password. The link expires in 1 hour.
                </div>
              </div>
            )}

            <form onSubmit={handleSignIn} name="instructor-login" method="post" action="#">
              {/* Biometric */}
              {biometricAvailable && !isForgotPassword && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={faceIdState === "scanning"}
                  style={{
                    width: "100%",
                    background: t.surface,
                    border: `1.5px solid ${faceIdState === "success" ? t.green : faceIdState === "scanning" ? t.blue : t.border}`,
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    color: faceIdState === "success" ? t.greenDark : faceIdState === "scanning" ? t.blue : "#374151",
                    cursor: faceIdState === "scanning" ? "default" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginBottom: 10,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  {faceIdState === "success"
                    ? <CheckCircle2 size={22} color={t.green} strokeWidth={1.8} />
                    : <FaceIdIcon scanning={faceIdState === "scanning"} />}
                  {faceIdState === "success"
                    ? "Recognised — signing in"
                    : faceIdState === "scanning"
                      ? "Scanning…"
                      : `Sign in with ${biometryLabel}`}
                </button>
              )}

              {!isForgotPassword && (
                <div style={{ marginBottom: 22 }}>
                  <GoogleSignInButton
                    redirectTo={`${window.location.origin}/auth/redirect?portal=instructor`}
                    className="w-full"
                  />
                </div>
              )}

              {!isForgotPassword && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 1, background: "#E8EDF6" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.placeholder, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>OR CONTINUE WITH EMAIL</span>
                  <div style={{ flex: 1, height: 1, background: "#E8EDF6" }} />
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={255}
                    disabled={loading}
                    style={{
                      width: "100%",
                      border: `1.5px solid ${t.border}`,
                      borderRadius: 9,
                      padding: "12px 40px 12px 14px",
                      fontSize: 14,
                      fontWeight: 400,
                      color: t.navy,
                      backgroundColor: t.white,
                      fontFamily: "inherit",
                      outline: "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = t.blue; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,82,160,0.09)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                    <Mail size={15} color={t.placeholder} strokeWidth={1.7} />
                  </div>
                </div>
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      maxLength={128}
                      disabled={loading}
                      style={{
                        width: "100%",
                        border: `1.5px solid ${t.border}`,
                        borderRadius: 9,
                        padding: "12px 40px 12px 14px",
                        fontSize: 14,
                        fontWeight: 400,
                        color: t.navy,
                        backgroundColor: t.white,
                        fontFamily: "inherit",
                        outline: "none",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = t.blue; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,82,160,0.09)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((p) => !p)}
                      style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: t.placeholder }}
                    >
                      {showPw ? <EyeOff size={15} strokeWidth={1.7} /> : <Eye size={15} strokeWidth={1.7} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember me */}
              {!isForgotPassword && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, padding: "12px 14px", background: t.surface, borderRadius: 9 }}>
                  <div
                    onClick={() => setRememberMeState((v) => !v)}
                    style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                      backgroundColor: rememberMe ? t.blue : t.white,
                      border: `1.5px solid ${rememberMe ? t.blue : t.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                  >
                    {rememberMe && <Check size={11} color={t.white} strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: t.navy, marginBottom: 2 }}>
                      Remember me (enables {biometryLabel})
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 300, color: t.muted, lineHeight: 1.5 }}>
                      Face ID is only available in the iOS or Android app. Remember me keeps you signed in on this browser.
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={(!isForgotPassword && !canSubmit) || loading || (isForgotPassword && resendCooldown > 0)}
                style={{
                  width: "100%",
                  backgroundColor: t.red,
                  border: "none",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  color: t.white,
                  cursor: (canSubmit || isForgotPassword) && !loading ? "pointer" : "default",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 16,
                  letterSpacing: "0.01em",
                  opacity: ((isForgotPassword || canSubmit) && !loading) ? 1 : 0.45,
                  transition: "opacity 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { if ((canSubmit || isForgotPassword) && !loading) (e.currentTarget as HTMLElement).style.background = t.redDark; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = t.red; }}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> {isForgotPassword ? "Sending…" : "Signing in…"}</>
                ) : isForgotPassword ? (
                  resetSent ? (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend reset link") : "Send reset link"
                ) : (
                  <>Sign In <ChevronRight size={15} color={t.white} strokeWidth={2.2} /></>
                )}
              </button>

              {/* Links */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setError(""); setResetSent(false); setResetSentTo(""); setResendCooldown(0); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <ArrowLeft size={13} /> Back to sign in
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(""); }}
                      style={{ fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Forgot password?
                    </button>
                    <p style={{ fontSize: 13, fontWeight: 300, color: t.muted, margin: 0 }}>
                      Don't have an account?{" "}
                      <Link to="/instructor-app/signup" style={{ fontWeight: 600, color: t.blue, fontSize: 13, textDecoration: "none" }}>
                        Request access
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </form>

            {/* Trust Strip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 20, paddingTop: 18, borderTop: "1px solid #E8EDF6" }}>
              {[
                { Icon: Lock, label: "SSL secured" },
                { Icon: ShieldCheck, label: "DVSA approved" },
                { Icon: Clock, label: "UK support" },
              ].map(({ Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.placeholder }}>
                  <Icon size={12} color={t.placeholder} strokeWidth={1.8} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  );
}
