import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, AlertCircle, Eye, EyeOff, Share, Plus, Download, X, Fingerprint, ArrowRight, Shield, Lock, Award, Car, Mail, Check, ChevronRight, CheckCircle2, ScanFace } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  isNativePlatform,
  isWrappedApp,
} from "@/lib/biometricAuth";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";
import { isEmailNotConfirmedError, resendSignupConfirmation } from "@/lib/emailConfirmation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { SignInEnvironmentHint } from "@/components/auth/SignInEnvironmentHint";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MobileLoginHero } from "@/components/auth/MobileLoginHero";
import {
  MobilePortalLoginShell,
  darkPortalInputClass,
  darkPortalInputStyle,
  darkPortalLabelClass,
  darkPortalPrimaryBtnClass,
  darkPortalGhostBtnClass,
  darkPortalGhostBtnStyle,
} from "@/components/auth/MobilePortalLoginShell";
import { cn } from "@/lib/utils";
import dsmLogo from "@/assets/dsm-logo.png";
import instructorHero from "@/assets/every-instructor-hero.webp";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    PasswordCredential: {
      new(data: { id: string; password: string; name?: string }): Credential;
    };
  }
}

export default function InstructorPortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkInstallState = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;
      const isDismissed = localStorage.getItem('instructor-install-dismissed');
      
      setIsIOS(isIOSDevice);
      setIsInstalled(isStandalone);
      
      if (!isStandalone && !isDismissed) {
        setShowInstallPrompt(true);
      }
    };

    const checkBiometricAvailability = async () => {
      // Only check availability — never auto-trigger Face ID on page load.
      // Auto-triggering left the spinner stuck in TestFlight and blocked
      // email/password sign-in. Face ID now only runs when the user taps the button.
      try {
        const available = await isBiometricAvailable("instructor");
        setBiometricAvailable(available);
      } catch (err) {
        console.log('Biometric not available:', err);
      }
    };

    checkInstallState();
    checkBiometricAvailability();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        toast.success("App installed successfully!");
      }
      setDeferredPrompt(null);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    // Hard cap so the spinner can never get stuck in TestFlight.
    const safety = setTimeout(() => {
      setBiometricLoading(false);
      setError("Face ID timed out. Please use email and password.");
    }, 20000);
    try {
      const creds = await getBiometricCredentials("instructor", "Sign in to EveryDriver");
      if (!creds) {
        setError("No saved credentials found. Please log in manually first.");
        return;
      }
      const { error: signInError } = await signIn(creds.email, creds.password);
      if (signInError) {
        setError("Biometric login failed. Please use email and password.");
      } else {
        toast.success("Welcome back!", { duration: 2000 });
        navigate("/instructor");
      }
    } catch (err) {
      console.error("Biometric login error:", err);
      setError("Biometric login not available. Please use email and password.");
    } finally {
      clearTimeout(safety);
      setBiometricLoading(false);
    }
  };

  const saveCredentialsForBiometric = async (emailToSave: string, passwordToSave: string) => {
    await saveBiometricCredentials("instructor", emailToSave, passwordToSave);
    setBiometricAvailable(true);
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem('instructor-install-dismissed', 'true');
    setShowInstallPrompt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isForgotPassword) {
      const emailValidation = z.string().trim().email().safeParse(email);
      if (!emailValidation.success) {
        setError("Please enter a valid email address");
        return;
      }
      
      setLoading(true);
      try {
        const { error: resetError } = await resetPassword(email.trim());
        if (resetError) {
          setError(resetError.message);
        } else {
          toast.success("Password reset email sent! Check your inbox.");
          setIsForgotPassword(false);
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
      return;
    }

    const validation = loginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    
    try {
      const { error: signInError } = await signIn(email.trim(), password);
      
      if (signInError) {
        if (isEmailNotConfirmedError(signInError)) {
          setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
          void resendSignupConfirmation(email.trim(), `${window.location.origin}/instructor/login`);
        } else if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else if (/timed out|timeout|busy|try again|database error/i.test(signInError.message)) {
          setError("The login service is busy. Please wait a few seconds and try again.");
        } else {
          setError(signInError.message);
        }
      } else {
        setRememberMe(rememberMe);
        // Always seed quick-sign-in credentials so the Face ID / Quick Sign In
        // button appears on next launch.
        await saveCredentialsForBiometric(email.trim(), password);
        toast.success("Welcome back!", { duration: 2000 });
        navigate("/instructor");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = isForgotPassword ? !!email.trim() : !!email.trim() && !!password;

  return (
    <div className="min-h-screen bg-white lg:bg-gradient-to-br lg:from-slate-900 lg:via-slate-800 lg:to-slate-900 flex flex-col lg:flex-row">
      {/* ============== MOBILE-ONLY — shared dark-navy shell ============== */}
      <MobilePortalLoginShell
        logoSrc={dsmLogo}
        logoAlt="DSM"
        logoHeightPx={42}
        title={isForgotPassword ? "Reset password" : "Welcome back"}
        subtitle={
          isForgotPassword
            ? "Enter your email and we'll send a reset link."
            : "Sign in to your instructor portal"
        }
        footer={
          !isForgotPassword ? (
            <span className="text-[13px] text-white">
              Don't have an account?{" "}
              <Link to="/instructor-app/signup" className="font-bold text-white">
                Request access
              </Link>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-[13px] font-semibold text-white"
            >
              Back to sign in
            </button>
          )
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-1" name="instructor-portal-login" method="post" action="#">
          {error && (
            <div className="mb-3 rounded-[10px] px-3 py-2 flex items-start gap-2 bg-white/10 border border-white/20">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-white" />
              <p className="text-[12px] font-medium text-white">{error}</p>
            </div>
          )}

          <label htmlFor="instr-m-email" className={darkPortalLabelClass}>Email</label>
          <div className="relative mb-[14px]">
            <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white" strokeWidth={1.8} />
            <input
              id="instr-m-email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={darkPortalInputClass}
              style={darkPortalInputStyle}
              maxLength={255}
            />
          </div>

          {!isForgotPassword && (
            <>
              <label htmlFor="instr-m-password" className={darkPortalLabelClass}>Password</label>
              <div className="relative mb-[14px]">
                <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white" strokeWidth={1.8} />
                <input
                  id="instr-m-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className={cn(darkPortalInputClass, "pr-12")}
                  style={darkPortalInputStyle}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 p-1 text-white/80"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setRememberMeState((p) => !p)} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-[5px] flex items-center justify-center transition-colors",
                      rememberMe ? "bg-white" : "bg-transparent",
                    )}
                    style={{ border: "1.5px solid rgba(255,255,255,0.9)" }}
                  >
                    {rememberMe && <Check className="h-3 w-3 text-[#0F2044]" strokeWidth={3.5} />}
                  </span>
                  <span className="text-[13px] font-medium text-white">Remember me</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[13px] font-semibold text-white"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.985, opacity: 0.85 }}
            disabled={!canSubmit || loading || biometricLoading}
            style={{ opacity: canSubmit && !loading && !biometricLoading ? 1 : 0.6 }}
            className={darkPortalPrimaryBtnClass}
          >
            <span className="py-4 text-[15px] flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isForgotPassword ? "Send reset link" : "Sign in")}
            </span>
          </motion.button>

          {!isForgotPassword && (
            <>
              <div className="flex items-center gap-3 mt-6 mb-5">
                <div className="flex-1 h-px bg-white/25" />
                <span className="text-[12px] text-white/70 uppercase" style={{ letterSpacing: "2px" }}>or</span>
                <div className="flex-1 h-px bg-white/25" />
              </div>

              <button
                type="button"
                onClick={() => {
                  const wrap = document.getElementById("mobile-google-oauth-wrap");
                  wrap?.querySelector<HTMLButtonElement>("button")?.click();
                }}
                className={darkPortalGhostBtnClass}
                style={darkPortalGhostBtnStyle}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.2 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.2 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.7 13.4-4.6l-6.2-5.1c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.1c.4-.3 6.6-4.8 6.6-14.7 0-1.2-.1-2.3-.3-3.5z"/>
                </svg>
                <span className="text-white text-[14px] font-semibold">Continue with Google</span>
              </button>

              {biometricAvailable && (
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading || loading}
                  className={cn(darkPortalGhostBtnClass, "mt-3")}
                  style={darkPortalGhostBtnStyle}
                >
                  {biometricLoading
                    ? <Loader2 className="h-[22px] w-[22px] animate-spin text-white" />
                    : <ScanFace className="h-[22px] w-[22px] text-white" strokeWidth={1.8} />}
                  <span className="text-white text-[14px] font-semibold">
                    {biometricLoading ? "Scanning…" : "Sign in with Face ID"}
                  </span>
                </button>
              )}
            </>
          )}
        </form>

        {/* Hidden Google OAuth — clicked programmatically by the button above */}
        <div id="mobile-google-oauth-wrap" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
          <GoogleSignInButton redirectTo={`${window.location.origin}/auth/redirect?portal=instructor`} />
        </div>
      </MobilePortalLoginShell>
      {/* ============== END MOBILE-ONLY ============== */}


      {/* Install to Home Screen Banner */}

      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white px-4 py-3 shadow-lg"
          >
            <div className="max-w-sm mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {isIOS ? (
                    <div className="space-y-2">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Add to Home Screen
                      </p>
                      <ol className="text-xs space-y-1 text-white/90">
                        <li className="flex items-center gap-2">
                          <span className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0">1</span>
                          <span className="flex items-center gap-1">
                            Tap <Share className="h-3 w-3" /> Share
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0">2</span>
                          <span className="flex items-center gap-1">
                            Tap <Plus className="h-3 w-3" /> Add to Home Screen
                          </span>
                        </li>
                      </ol>
                    </div>
                  ) : deferredPrompt ? (
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Install app for best experience
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-3 shrink-0 bg-white text-emerald-600 hover:bg-white/90"
                        onClick={handleInstall}
                      >
                        Install
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Add to Home Screen
                      </p>
                      <p className="text-xs text-white/90">
                        Use your browser menu → "Add to Home Screen" for fullscreen experience
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={dismissInstallPrompt}
                  className="p-1 hover:bg-white/10 rounded-full shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EveryDriver</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Welcome back to your business hub
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Manage your driving school with confidence. Schedule lessons, 
              track payments, and grow your business - all in one place.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Bank-level security" },
                { icon: Lock, text: "GDPR compliant" },
                { icon: Award, text: "Trusted by 500+ ADIs" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            © 2025 EveryDriver. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (replaced on mobile by hero header above) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EveryDriver</span>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-white">
                  {isForgotPassword ? "Reset Password" : "Sign in to your account"}
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  {isForgotPassword 
                    ? "Enter your email to receive a reset link"
                    : "Enter your credentials to access your dashboard"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4" name="instructor-portal-login" method="post" action="#">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive" className="py-2 bg-red-500/10 border-red-500/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {error}
                            {error.toLowerCase().includes("verify your email") && (
                              <button
                                type="button"
                                className="block mt-1 underline font-medium"
                                onClick={async () => {
                                  if (!email.trim()) return;
                                  const { error: resendErr } = await resendSignupConfirmation(
                                    email.trim(),
                                    `${window.location.origin}/instructor/login`
                                  );
                                  if (resendErr) toast.error(resendErr.message);
                                  else toast.success("Confirmation email sent. Check your inbox.");
                                }}
                              >
                                Resend confirmation email
                              </button>
                            )}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                      autoComplete="username"
                      maxLength={255}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {!isForgotPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                            Password
                          </Label>
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-sm text-emerald-400 hover:text-emerald-300"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500 pr-12"
                            autoComplete="current-password"
                            maxLength={128}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isForgotPassword && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMeState(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                        />
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer">
                                Remember me
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              Keeps you signed in on this device until you sign out.
                              Without it, you'll be signed out when the browser closes.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <SignInEnvironmentHint className="pl-6 text-slate-500" />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loading || biometricLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isForgotPassword ? "Sending..." : "Signing in..."}
                      </>
                    ) : (
                      <>
                        {isForgotPassword ? "Send Reset Link" : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {!isForgotPassword && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-slate-500">Or</span>
                      </div>
                    </div>
                    <GoogleSignInButton
                      redirectTo={`${window.location.origin}/auth/redirect?portal=instructor`}
                      className="w-full h-12 bg-white hover:bg-white/90 text-slate-900 border-slate-300"
                    />
                  </>
                )}

                {/* Biometric Login Option */}
                {!isForgotPassword && biometricAvailable && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-slate-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10"
                      onClick={handleBiometricLogin}
                      disabled={biometricLoading || loading}
                    >
                      {biometricLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Fingerprint className="mr-2 h-5 w-5" />
                      )}
                      Use Face ID / Touch ID
                    </Button>
                  </>
                )}

                {/* Back to login from forgot password */}
                {isForgotPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white hover:bg-white/5"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    Back to sign in
                  </Button>
                )}

                {/* Sign up link */}
                {!isForgotPassword && (
                  <p className="text-center text-sm text-slate-400">
                    Don't have an account?{" "}
                    <Link to="/instructor-app/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
                      Start free trial
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
