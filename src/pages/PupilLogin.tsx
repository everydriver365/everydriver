import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, Lock, ScanFace, Eye, EyeOff, User, UserPlus, LifeBuoy } from "lucide-react";
import dsmLogo from "@/assets/dsm-logo.png";
import learnerHero from "@/assets/drive365-hero-learner.webp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PupilRegister from "@/components/pupil/PupilRegister";
import { setRememberMe as persistRememberMe } from "@/lib/sessionPersistence";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";

type LoginView = "login" | "forgot" | "reset-code" | "new-password";

const DSM_FIELD =
  "h-[60px] rounded-[18px] bg-white border border-[#E2E8F0] text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#0B5FFF]/30 focus-visible:border-[#0B5FFF] focus-visible:ring-offset-0 transition-all";

export default function PupilLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
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

  useEffect(() => {
    if ((window as any).PasswordCredential) {
      setFaceIdAvailable(true);
    }
  }, []);

  useEffect(() => {
    const tryAutoLogin = async () => {
      if (!(window as any).PasswordCredential) return;
      const remembered = localStorage.getItem("pupil_remembered_email");
      if (!remembered) return;

      try {
        const credential = await navigator.credentials.get({
          password: true,
          mediation: "optional",
        } as any);

        if (credential && credential.type === "password") {
          const pwCred = credential as any;
          setAutoLoggingIn(true);
          await performLogin(pwCred.id, pwCred.password || "");
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

      if ((window as any).PasswordCredential) {
        try {
          const CredCtor = (window as any).PasswordCredential;
          const cred = new CredCtor({
            id: loginEmail,
            password: loginPassword,
            name: data.pupilName,
          });
          await navigator.credentials.store(cred);
        } catch {
          // Continue
        }
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
    if (!(window as any).PasswordCredential) return;
    try {
      const credential = await navigator.credentials.get({
        password: true,
        mediation: "required",
      } as any);
      if (credential && credential.type === "password") {
        const pwCred = credential as any;
        setLoading(true);
        setEmail(pwCred.id);
        await performLogin(pwCred.id, pwCred.password || "");
        setLoading(false);
      }
    } catch {
      toast.error("Biometric login cancelled or not available");
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

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#0B5FFF] animate-spin mx-auto" />
          <p className="text-slate-500 text-sm mt-3">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-start sm:items-center justify-center px-4 py-8 sm:py-12"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #EAF1FF 0%, transparent 60%), linear-gradient(180deg, #F7F9FC 0%, #EEF2F8 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px] lg:max-w-[520px]"
      >
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img src={dsmLogo} alt="Driving School Manager" className="h-10 object-contain" />
        </div>

        {/* Main Card */}
        <div
          className="bg-white rounded-[28px] overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.08)" }}
        >
          {/* Illustration */}
          <div className="relative h-40 sm:h-44 overflow-hidden bg-gradient-to-b from-[#EAF1FF] to-white">
            <img
              src={learnerHero}
              alt="Learner driver"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
            {/* L-plate */}
            <div className="absolute top-3 right-3 w-9 h-9 rounded-md bg-white shadow-md flex items-center justify-center border border-slate-100">
              <span className="text-[#E11D48] font-black text-xl leading-none">L</span>
            </div>
          </div>

          {/* Heading */}
          <div className="px-6 pt-5 pb-2 text-center">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pupil Portal</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Manage lessons, progress, tests and bookings
            </p>
          </div>

          <div className="px-5 sm:px-6 pb-6">
            {/* Segmented control */}
            <div className="relative h-14 rounded-[18px] bg-slate-100/80 p-1.5 mt-4 mb-5 flex">
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-[14px] shadow-md"
                style={{
                  background: "linear-gradient(135deg, #0B5FFF 0%, #2563EB 100%)",
                  width: "calc(50% - 6px)",
                }}
                animate={{ left: activeTab === "login" ? 6 : "calc(50%)" }}
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
                    "relative z-10 flex-1 flex items-center justify-center gap-2 text-sm font-semibold rounded-[14px] transition-colors",
                    activeTab === seg.value ? "text-white" : "text-slate-600"
                  )}
                >
                  <seg.Icon className="w-4 h-4" />
                  {seg.label}
                </button>
              ))}
            </div>

            {/* Google */}
            <div className="mb-4">
              <GoogleSignInButton
                redirectTo={`${window.location.origin}/auth/redirect?portal=pupil`}
                className="w-full h-[58px] rounded-[18px] bg-white hover:bg-slate-50 text-slate-800 border border-[#E2E8F0] shadow-sm font-medium"
              />
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-white text-[11px] uppercase tracking-wider text-slate-400">or</span></div>
              </div>
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
                      className="space-y-4"
                      name="pupil-login"
                      method="post"
                      action="#"
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[13px] font-semibold text-slate-700 px-1">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                          <Input
                            id="email" name="email" type="email"
                            inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={cn(DSM_FIELD, "pl-12 pr-4 text-[15px]")}
                            autoComplete="username"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <Label htmlFor="password" className="text-[13px] font-semibold text-slate-700">Password</Label>
                          <button
                            type="button"
                            onClick={() => setLoginView("forgot")}
                            className="text-[12px] font-semibold text-[#0B5FFF] hover:text-[#2563EB] transition-colors"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                          <Input
                            id="password" name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={cn(DSM_FIELD, "pl-12 pr-12 text-[15px]")}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember toggle row */}
                      <div className="flex items-center justify-between rounded-[18px] bg-slate-50 border border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-[14px] font-semibold text-slate-800">Remember this device</p>
                          <p className="text-[12px] text-slate-500">Skip sign in next time</p>
                        </div>
                        <Switch checked={rememberMe} onCheckedChange={setRememberMe} />
                      </div>

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || !email.trim() || !password}
                        className="w-full h-16 rounded-[20px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
                        style={{
                          background: "linear-gradient(135deg, #0B5FFF 0%, #2563EB 100%)",
                          boxShadow: "0 12px 28px rgba(11,95,255,0.32)",
                        }}
                      >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
                        ) : (
                          <>Sign In <ArrowRight className="h-5 w-5" /></>
                        )}
                      </motion.button>

                      {faceIdAvailable && (
                        <button
                          type="button"
                          onClick={handleFaceIdLogin}
                          disabled={loading}
                          className="w-full h-12 rounded-[16px] bg-white border border-[#E2E8F0] text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                          <ScanFace className="h-5 w-5" />
                          Sign in with Face ID
                        </button>
                      )}

                      <p className="text-[12px] text-slate-500 text-center pt-1">
                        First time? Tap <span className="font-semibold text-slate-700">Register</span> to set up your password.
                      </p>
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
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                        <p className="text-sm text-slate-500">We'll send a 6-digit code to your email</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-700 px-1">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                          <Input
                            name="email" type="email" autoComplete="username"
                            inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={cn(DSM_FIELD, "pl-12 pr-4")}
                          />
                        </div>
                      </div>
                      <motion.button
                        type="button" whileTap={{ scale: 0.98 }}
                        disabled={loading || !email.trim()}
                        onClick={handleForgotPassword}
                        className="w-full h-16 rounded-[20px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #0B5FFF 0%, #2563EB 100%)", boxShadow: "0 12px 28px rgba(11,95,255,0.32)" }}
                      >
                        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                        Send Reset Code
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => setLoginView("login")}
                        className="w-full h-11 text-sm text-slate-500 hover:text-slate-900 font-medium"
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
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-900">Enter Reset Code</h3>
                        <p className="text-sm text-slate-500">Check your email for the 6-digit code</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-700 px-1">Reset Code</Label>
                        <Input
                          type="text" placeholder="000000"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className={cn(DSM_FIELD, "text-center text-xl tracking-[0.5em] placeholder:tracking-[0.5em]")}
                          maxLength={6}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-700 px-1">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                          <Input
                            name="new-password" type="password" autoComplete="new-password" placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={cn(DSM_FIELD, "pl-12 pr-4")}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-700 px-1">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                          <Input
                            name="confirm-password" type="password" autoComplete="new-password" placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(DSM_FIELD, "pl-12 pr-4")}
                          />
                        </div>
                      </div>
                      <motion.button
                        type="button" whileTap={{ scale: 0.98 }}
                        disabled={loading || resetCode.length !== 6 || !newPassword}
                        onClick={handleConfirmReset}
                        className="w-full h-16 rounded-[20px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #0B5FFF 0%, #2563EB 100%)", boxShadow: "0 12px 28px rgba(11,95,255,0.32)" }}
                      >
                        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                        Reset Password
                      </motion.button>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setLoginView("forgot")} className="flex-1 h-11 text-sm text-slate-500 hover:text-slate-900 font-medium">Resend code</button>
                        <button type="button" onClick={() => setLoginView("login")} className="flex-1 h-11 text-sm text-slate-500 hover:text-slate-900 font-medium">Back to sign in</button>
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
          </div>
        </div>

        {/* Support card */}
        <div className="mt-5 rounded-[22px] p-4 flex items-center gap-3 bg-[#EAF1FF] border border-[#DCE7FB]">
          <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <LifeBuoy className="h-5 w-5 text-[#0B5FFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">Need help?</p>
            <a href="mailto:support@everydriver.co.uk" className="text-[13px] text-[#0B5FFF] hover:underline truncate block">
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
              className="px-4 h-9 inline-flex items-center rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-600 hover:text-[#0B5FFF] hover:border-[#0B5FFF]/30 shadow-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} Driving School Manager
        </p>
      </motion.div>
    </div>
  );
}
