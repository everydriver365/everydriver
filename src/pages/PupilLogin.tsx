import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Loader2,
  ChevronRight,
  Lock,
  ScanFace,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Calendar,
  ArrowLeftRight,
  ShieldCheck,
  LifeBuoy,
  User,
  UserPlus,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PupilRegister from "@/components/pupil/PupilRegister";
import { setRememberMe as persistRememberMe } from "@/lib/sessionPersistence";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";
import drive365Logo from "@/assets/drive365-logo.png";
import drive365LogoWhite from "@/assets/drive365-logo-white.png";
import pupilHero from "@/assets/drive365-hero-learner.webp";
import mobileLoginHero from "@/assets/mobile-login-hero.png";
import { MobileLoginHero } from "@/components/auth/MobileLoginHero";
import { UnifiedMobileLoginCard } from "@/components/auth/UnifiedMobileLoginCard";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  getBiometryLabel,
} from "@/lib/biometricAuth";

type LoginView = "login" | "forgot" | "reset-code" | "new-password";

/** Drive365 brand mark – DRIVE on red block, 365 on blue block. */
const DSMLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const cls =
    size === "sm"
      ? { text: "text-[12px]", px: "px-[7px]", py: "py-[3px]" }
      : size === "lg"
      ? { text: "text-[18px]", px: "px-[11px]", py: "py-[5px]" }
      : { text: "text-[14px]", px: "px-[9px]", py: "py-[4px]" };
  return (
    <div className="inline-flex items-center select-none">
      <div className={cn("bg-[#CC2229] rounded-l-[4px]", cls.px, cls.py)}>
        <span className={cn("font-extrabold text-white tracking-[0.5px]", cls.text)}>DRIVE</span>
      </div>
      <div className={cn("bg-[#1A52A0] rounded-r-[4px]", cls.px, cls.py)}>
        <span className={cn("font-extrabold text-white tracking-[0.3px]", cls.text)}>365</span>
      </div>
    </div>
  );
};

const FIELD =
  "h-[50px] rounded-[9px] bg-[#F9FAFB] border-[1.5px] border-[#E8EDF6] text-[#0F2044] placeholder:text-[#C4C9D4] focus-visible:ring-2 focus-visible:ring-[#1A52A0]/15 focus-visible:border-[#1A52A0] focus-visible:ring-offset-0 text-[14px]";

export default function PupilLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginView, setLoginView] = useState<LoginView>("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slugInstructorId, setSlugInstructorId] = useState<string | null>(null);
  const [slugInstructorName, setSlugInstructorName] = useState<string | null>(null);
  const navigate = useNavigate();
  const { instructorSlug } = useParams<{ instructorSlug: string }>();

  // Look up instructor from slug
  useEffect(() => {
    if (!instructorSlug) return;
    const fetchInstructor = async () => {
      const { data } = await supabase
        .from("public_instructors" as any)
        .select("id, name")
        .eq("app_slug", instructorSlug)
        .eq("pupil_app_enabled", true)
        .single();
      if (data) {
        setSlugInstructorId((data as any).id);
        setSlugInstructorName((data as any).name);
        setActiveTab("register");
      }
    };
    fetchInstructor();
  }, [instructorSlug]);

  const [biometryLabel, setBiometryLabel] = useState<string>("Face ID");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [available, label] = await Promise.all([
        isBiometricAvailable("pupil"),
        getBiometryLabel(),
      ]);
      if (cancelled) return;
      setFaceIdAvailable(available);
      setBiometryLabel(label);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      const remembered = localStorage.getItem("pupil_remembered_email");
      if (!remembered) return;
      try {
        const creds = await getBiometricCredentials("pupil", "Sign in to your pupil portal");
        if (creds?.email && creds?.password) {
          setAutoLoggingIn(true);
          await performLogin(creds.email, creds.password);
        }
      } catch {
        // Silently fail
      }
    };
    tryAutoLogin();
  }, []);

  useEffect(() => {
    const handler = () => setActiveTab("login");
    window.addEventListener("pupil-registered", handler);
    return () => window.removeEventListener("pupil-registered", handler);
  }, []);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("pupil_remembered_email");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
        body: { action: "login", email: loginEmail, password: loginPassword },
      });

      if (error) {
        const errorBody = typeof error === "object" && "context" in error
          ? await (error as any).context?.json?.().catch(() => null)
          : null;
        const msg = errorBody?.error || data?.error || "Something went wrong. Please try again.";
        toast.error(msg);
        setAutoLoggingIn(false);
        return false;
      }

      if (data.error) {
        toast.error(data.error);
        setAutoLoggingIn(false);
        return false;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (signInError) {
        toast.error(signInError.message || "Could not sign you in. Please try again.");
        setAutoLoggingIn(false);
        return false;
      }

      persistRememberMe(rememberMe);
      if (rememberMe || localStorage.getItem("pupil_remembered_email")) {
        localStorage.setItem("pupil_remembered_email", loginEmail);
      }

      // Always arm Face ID after a successful password sign-in so the next
      // visit can use biometrics. Remember me only controls session persistence
      // (handled by persistRememberMe above), not whether Face ID is enabled.
      try {
        await saveBiometricCredentials("pupil", loginEmail, loginPassword);
        setFaceIdAvailable(true);
      } catch {
        // Best-effort — biometric save failure shouldn't block the login.
      }

      const firstName = data.pupilName?.split(" ")[0] || "";
      if (data.firstLogin) {
        toast.success(`Welcome ${firstName}! Your password has been set.`);
      } else {
        toast.success(`Welcome back, ${firstName}!`);
      }

      navigate(`/p/${data.instructorSlug}`);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.");
      setAutoLoggingIn(false);
      return false;
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    if (!password) { toast.error("Please enter your password"); return; }
    setLoading(true);
    await performLogin(email.trim(), password);
    setLoading(false);
  };

  const handleFaceIdLogin = async () => {
    setFaceIdLoading(true);
    try {
      const creds = await getBiometricCredentials("pupil", "Sign in to your pupil portal");
      if (creds?.email && creds?.password) {
        setFaceIdSuccess(true);
        setEmail(creds.email);
        await performLogin(creds.email, creds.password);
      } else {
        toast.error("No saved sign-in found. Sign in with your password once to enable Face ID.");
      }
    } catch {
      toast.error("Biometric login cancelled or not available");
    } finally {
      setFaceIdLoading(false);
      setTimeout(() => setFaceIdSuccess(false), 800);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { toast.error("Please enter your email first"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("pupil-email-auth", {
        body: { action: "forgot_password", email: email.trim() },
      });
      if (error) {
        toast.error("Something went wrong. Please try again.");
      } else {
        toast.success("If an account exists, a reset code has been sent to your email.");
        setLoginView("reset-code");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleConfirmReset = async () => {
    if (!resetCode.trim()) { toast.error("Please enter the reset code"); return; }
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
        body: { action: "confirm_reset", email: email.trim(), code: resetCode.trim(), password: newPassword },
      });
      if (data?.error) {
        toast.error(data.error);
      } else if (error) {
        toast.error("Something went wrong. Please try again.");
      } else {
        toast.success("Password reset successfully! Please sign in.");
        setLoginView("login");
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
        setPassword("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#1A52A0] animate-spin mx-auto" />
          <p className="text-[#6B7280] text-sm mt-3">Signing you in...</p>
        </div>
      </div>
    );
  }

  const features = [
    { Icon: Calendar, bg: "#E6F1FB", stroke: "#1A52A0", title: "Book & manage lessons", sub: "Upcoming lessons, hours & notes" },
    { Icon: ArrowLeftRight, bg: "#E6F1FB", stroke: "#1A52A0", title: "Free test swap service", sub: "Earlier dates, at no cost" },
    { Icon: ShieldCheck, bg: "#FBEAEA", stroke: "#CC2229", title: "Free retest guarantee", sub: "Money back if you pass first time" },
  ];

  // ============ MOBILE LOGIN — full-bleed Drive365 blue, single-screen ============
  const showMobileNewLogin = activeTab === "login" && loginView === "login";

  return (
    <>
      {showMobileNewLogin && (
        <UnifiedMobileLoginCard
          portalName="Drive365"
          descriptor="For pupils"
          brand="drive365"
          subtitle="Sign in to manage your driving lessons"
          biometricScope="pupil"
          heroImage={mobileLoginHero}
          heroAlt="Drive365 pupil"

          onSignIn={async (em, pw, _remember) => {
            const ok = await performLogin(em, pw);
            if (!ok) return { error: "Could not sign you in" };
          }}
          onForgot={async (em) => {
            const { error } = await supabase.functions.invoke("pupil-email-auth", {
              body: { action: "forgot_password", email: em },
            });
            if (error) return { error: "Could not send reset email" };
          }}
          footer={
            <span style={{ fontSize: 12, color: "#888" }}>
              New to Drive365?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                style={{ background: "transparent", border: "none", color: "#2952B3", fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                Create account
              </button>
            </span>
          }
        />
      )}


      {/* ============ DESKTOP + mobile fallback (register/forgot views) ============ */}
      <div className={cn("min-h-screen w-full bg-white flex flex-col md:flex-row", showMobileNewLogin && "hidden md:flex")}>
      <MobileLoginHero
        heroSrc={pupilHero}
        logoSrc={drive365Logo}
        logoAlt="Drive365 Pupil"
        title={slugInstructorName ? `Sign in to ${slugInstructorName}` : "Welcome back"}
        subtitle="Sign in to manage lessons, track progress and pay your instructor."
      />
      {/* LEFT PANEL — tablet/desktop only */}

      <aside
        className="hidden md:flex flex-col justify-between relative overflow-hidden flex-1 p-11"
        style={{ backgroundColor: "#0F2044" }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute"
          style={{ top: -120, left: -120, width: 380, height: 380, borderRadius: "50%", border: "60px solid rgba(26,82,160,0.12)" }}
        />
        <div
          className="pointer-events-none absolute"
          style={{ bottom: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(204,34,41,0.07)" }}
        />

        <div className="relative z-10">
          <img src={drive365LogoWhite} alt="Drive365" className="h-9 object-contain" />
          <p className="text-[11px] font-light mt-[7px] tracking-[0.04em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Pupil portal · Drive365
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-[7px] mb-[18px]">
            <div className="w-4 h-[2px] rounded-sm" style={{ background: "#CC2229" }} />
            <span className="text-[11px] font-semibold tracking-[0.09em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              Pupil panel
            </span>
          </div>
          <h1
            className="text-[36px] font-bold leading-[42px] tracking-[-0.8px] mb-3"
            style={{ color: "#FFFFFF" }}
          >
            Your driving<br />journey,<br />
            <span className="italic" style={{ color: "#CC2229" }}>all in one place.</span>
          </h1>
          <p className="text-[14px] font-light leading-6 mb-8 max-w-[310px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Book lessons, track your progress, pay your instructor and pass faster — all from one dashboard.
          </p>

          <div className="space-y-[10px] max-w-[360px]">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-[10px] p-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: f.stroke === "#CC2229" ? "rgba(204,34,41,0.25)" : "rgba(26,82,160,0.25)" }}
                >
                  <f.Icon className="w-[18px] h-[18px]" style={{ color: "rgba(255,255,255,0.85)" }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "#FFFFFF" }}>{f.title}</p>
                  <p className="text-[11px] font-light mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] font-light relative z-10" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} Drive365 Ltd · DVSA approved
        </p>
      </aside>


      {/* RIGHT PANEL */}
      <main className="flex-1 flex justify-center items-start md:items-center bg-white px-5 pt-2 pb-10 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[390px]"
        >
          <div className="hidden md:block">
            <img src={drive365Logo} alt="Drive365" className="h-7 object-contain" />
            <div className="h-7" />

            <h2 className="text-[22px] font-bold text-[#0F2044] tracking-[-0.4px] mb-[5px]">
              Welcome back
            </h2>
            <p className="text-[13px] font-light text-[#9CA3AF] leading-5 mb-[26px]">
              Sign in to your Drive365 account to continue.
            </p>
          </div>


          {/* Segmented control: Sign In / Register */}
          <div className="relative h-12 rounded-[12px] bg-[#F2F4F8] p-1 mb-5 flex">
            <motion.div
              className="absolute top-1 bottom-1 rounded-[10px] bg-white shadow-sm border border-[#E8EDF6]"
              style={{ width: "calc(50% - 4px)" }}
              animate={{ left: activeTab === "login" ? 4 : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
            {[
              { value: "login", label: "Sign In", Icon: User },
              { value: "register", label: "Register", Icon: UserPlus },
            ].map((seg) => (
              <button
                key={seg.value}
                type="button"
                onClick={() => setActiveTab(seg.value)}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 text-[13px] font-semibold rounded-[10px] transition-colors",
                  activeTab === seg.value ? "text-[#0F2044]" : "text-[#6B7280]"
                )}
              >
                <seg.Icon className="w-4 h-4" />
                {seg.label}
              </button>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="login" className="mt-0">
              <AnimatePresence mode="wait">
                {loginView === "login" && (
                  <motion.form
                    key="login-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleLogin}
                    name="pupil-login"
                    method="post"
                    action="#"
                  >
                    {/* Email */}
                    <div className="mb-[14px]">
                      <Label
                        htmlFor="email"
                        className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block"
                      >
                        Email address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email" name="email" type="email"
                          inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn(FIELD, "pr-11")}
                          autoComplete="username"
                        />
                        <Mail className="absolute right-[13px] top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C9D4]" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-[14px]">
                      <Label
                        htmlFor="password"
                        className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block"
                      >
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password" name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={cn(FIELD, "pr-11")}
                          autoComplete="current-password"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleLogin();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[#C4C9D4] hover:text-[#6B7280]"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between mb-5">
                      <button
                        type="button"
                        onClick={() => setRememberMe((p) => !p)}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={cn(
                            "w-[19px] h-[19px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors",
                            rememberMe
                              ? "bg-[#1A52A0] border-[#1A52A0]"
                              : "bg-white border-[#DDE3ED]"
                          )}
                        >
                          {rememberMe && <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />}
                        </span>
                        <span className="text-[13px] font-normal text-[#6B7280]">Remember me</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginView("forgot")}
                        className="text-[13px] font-medium text-[#1A52A0] hover:text-[#0F2044]"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Sign in button */}
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      disabled={!canSubmit || loading}
                      style={{ opacity: canSubmit && !loading ? 1 : 0.5 }}
                      className="w-full h-12 rounded-[9px] bg-[#CC2229] hover:bg-[#A81E24] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors mb-[10px] disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Sign in
                          <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.2} />
                        </>
                      )}
                    </motion.button>

                    {/* Face ID button */}
                    {faceIdAvailable && (
                      <button
                        type="button"
                        onClick={handleFaceIdLogin}
                        disabled={faceIdLoading || loading}
                        className={cn(
                          "w-full rounded-[9px] bg-[#F2F4F8] border-[1.5px] py-[12px] flex items-center justify-center gap-[9px] mb-6 transition-colors",
                          faceIdSuccess
                            ? "border-[#1D9E75]"
                            : faceIdLoading
                            ? "border-[#1A52A0]"
                            : "border-[#E8EDF6] hover:border-[#DDE3ED]"
                        )}
                      >
                        {faceIdSuccess ? (
                          <CheckCircle2 className="h-[22px] w-[22px] text-[#1D9E75]" />
                        ) : (
                          <ScanFace
                            className="h-[22px] w-[22px]"
                            style={{ color: faceIdLoading ? "#1A52A0" : "#374151" }}
                          />
                        )}
                        <span
                          className="text-[14px] font-medium"
                          style={{
                            color: faceIdSuccess
                              ? "#085041"
                              : faceIdLoading
                              ? "#1A52A0"
                              : "#374151",
                          }}
                        >
                          {faceIdSuccess
                            ? "Recognised — signing in"
                            : faceIdLoading
                            ? "Scanning…"
                            : "Sign in with Face ID"}
                        </span>
                      </button>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-[#F0F2F5]" />
                      <span className="text-[11px] font-medium text-[#C4C9D4] uppercase tracking-wider">
                        or continue with
                      </span>
                      <div className="flex-1 h-px bg-[#F0F2F5]" />
                    </div>

                    {/* Google */}
                    <div className="mb-[22px]">
                      <GoogleSignInButton
                        redirectTo={`${window.location.origin}/auth/redirect?portal=pupil`}
                        className="w-full h-[44px] rounded-[9px] bg-[#F9FAFB] hover:bg-white border-[1.5px] border-[#E8EDF6] text-[#374151] text-[13px] font-medium"
                        label="Continue with Google"
                      />
                    </div>

                    {/* Register link */}
                    <div className="text-center">
                      <span className="text-[13px] font-light text-[#9CA3AF]">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("register")}
                          className="font-semibold text-[#CC2229] hover:text-[#A81E24]"
                        >
                          Register for free
                        </button>
                      </span>
                    </div>
                  </motion.form>
                )}

                {loginView === "forgot" && (
                  <motion.div
                    key="forgot-form"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-[18px] font-bold text-[#0F2044]">Reset password</h3>
                      <p className="text-[13px] font-light text-[#9CA3AF]">
                        We'll send a 6-digit code to your email.
                      </p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                        Email address
                      </Label>
                      <div className="relative">
                        <Input
                          name="email" type="email" autoComplete="username"
                          inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={cn(FIELD, "pr-11")}
                        />
                        <Mail className="absolute right-[13px] top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C9D4]" />
                      </div>
                    </div>
                    <motion.button
                      type="button" whileTap={{ scale: 0.98 }}
                      disabled={loading || !email.trim()}
                      onClick={handleForgotPassword}
                      style={{ opacity: email.trim() && !loading ? 1 : 0.5 }}
                      className="w-full h-12 rounded-[9px] bg-[#CC2229] hover:bg-[#A81E24] text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                      Send reset code
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setLoginView("login")}
                      className="w-full h-10 text-[13px] text-[#6B7280] hover:text-[#0F2044] font-medium"
                    >
                      Back to sign in
                    </button>
                  </motion.div>
                )}

                {loginView === "reset-code" && (
                  <motion.div
                    key="reset-form"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-[18px] font-bold text-[#0F2044]">Enter reset code</h3>
                      <p className="text-[13px] font-light text-[#9CA3AF]">
                        Check your email for the 6-digit code.
                      </p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                        Reset code
                      </Label>
                      <Input
                        type="text" placeholder="000000"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className={cn(FIELD, "text-center text-xl tracking-[0.5em] placeholder:tracking-[0.5em]")}
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                        New password
                      </Label>
                      <div className="relative">
                        <Input
                          name="new-password" type="password" autoComplete="new-password" placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={cn(FIELD, "pr-11")}
                        />
                        <Lock className="absolute right-[13px] top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C9D4]" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                        Confirm password
                      </Label>
                      <div className="relative">
                        <Input
                          name="confirm-password" type="password" autoComplete="new-password" placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn(FIELD, "pr-11")}
                        />
                        <Lock className="absolute right-[13px] top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C9D4]" />
                      </div>
                    </div>
                    <motion.button
                      type="button" whileTap={{ scale: 0.98 }}
                      disabled={loading || resetCode.length !== 6 || !newPassword}
                      onClick={handleConfirmReset}
                      style={{ opacity: resetCode.length === 6 && newPassword && !loading ? 1 : 0.5 }}
                      className="w-full h-12 rounded-[9px] bg-[#CC2229] hover:bg-[#A81E24] text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                      Reset password
                    </motion.button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setLoginView("forgot")} className="flex-1 h-10 text-[13px] text-[#6B7280] hover:text-[#0F2044] font-medium">Resend code</button>
                      <button type="button" onClick={() => setLoginView("login")} className="flex-1 h-10 text-[13px] text-[#6B7280] hover:text-[#0F2044] font-medium">Back to sign in</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <PupilRegister
                  instructorId={slugInstructorId}
                  instructorName={slugInstructorName}
                />
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Support card */}
          <div className="mt-6 rounded-[12px] p-3 flex items-center gap-3 bg-[#E6F1FB] border border-[#DCE7FB]">
            <div className="h-10 w-10 rounded-[10px] bg-white flex items-center justify-center shadow-sm shrink-0">
              <LifeBuoy className="h-[18px] w-[18px] text-[#1A52A0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0F2044]">Need help?</p>
              <a href="mailto:support@everydriver.co.uk" className="text-[12px] text-[#1A52A0] hover:underline truncate block">
                support@everydriver.co.uk
              </a>
            </div>
          </div>

          {/* Bottom nav pills */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {[
              { to: "/drive365", label: "Drive365" },
              { to: "/instructor-app", label: "Instructor Home" },
              { to: "/instructor-app/login", label: "Instructor Login" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 h-8 inline-flex items-center rounded-full bg-white border border-[#E8EDF6] text-[11px] font-semibold text-[#6B7280] hover:text-[#1A52A0] hover:border-[#1A52A0]/30 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <p className="mt-5 text-center text-[11px] font-light text-[#C4C9D4] md:hidden">
            © {new Date().getFullYear()} Drive365 Ltd · DVSA approved
          </p>
        </motion.div>
      </main>
      </div>
    </>
  );
}
