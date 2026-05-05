import { useState, useEffect } from "react";
import dsmLogo from "@/assets/dsm-logo.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, Fingerprint, Eye, EyeOff, Share, Plus, Download, X, CheckCircle2, MailCheck } from "lucide-react";
import { InstructorMarketingBottomNav } from "@/components/layout/InstructorMarketingBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  isBiometricAvailable,
  getBiometricCredentials,
  saveBiometricCredentials,
  getBiometryLabel,
  isNativePlatform,
} from "@/lib/biometricAuth";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";
import { isEmailNotConfirmedError, resendSignupConfirmation } from "@/lib/emailConfirmation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

// Build marker for cache verification
const BUILD_MARKER = "2026-02-05 08:00";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend Window interface for PasswordCredential
declare global {
  interface Window {
    PasswordCredential: {
      new(data: { id: string; password: string; name?: string }): Credential;
    };
  }
}

export default function InstructorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSentTo, setResetSentTo] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState("Face ID / Touch ID");
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showVerifyBanner = searchParams.get("verify") === "1";

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill && !email) setEmail(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick down the resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Check install state, platform, and biometric availability
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
      try {
        const available = await isBiometricAvailable("instructor");
        setBiometricAvailable(available);
        if (available) {
          setBiometryLabel(await getBiometryLabel());
          // On native, auto-prompt Face ID immediately for a real "open app → unlock" feel
          if (isNativePlatform()) {
            const creds = await getBiometricCredentials("instructor", "Sign in to EveryDriver");
            if (creds) {
              setBiometricLoading(true);
              const { error: signInError } = await signIn(creds.email, creds.password);
              if (!signInError) {
                toast.success("Welcome back!");
                navigate("/instructor");
                return;
              }
              setBiometricLoading(false);
            }
          }
        }
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

  const dismissInstallPrompt = () => {
    localStorage.setItem('instructor-install-dismissed', 'true');
    setShowInstallPrompt(false);
  };

  // Handle biometric login (Face ID / Touch ID / fingerprint)
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
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
        toast.success("Welcome back!");
        navigate("/instructor");
      }
    } catch (err) {
      console.error("Biometric login error:", err);
      setError("Biometric login not available. Please use email and password.");
    } finally {
      setBiometricLoading(false);
    }
  };

  // Save credentials for future biometric login
  const saveCredentialsForBiometric = async (emailToSave: string, passwordToSave: string) => {
    await saveBiometricCredentials("instructor", emailToSave, passwordToSave);
    setBiometricAvailable(true);
    try { setBiometryLabel(await getBiometryLabel()); } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isForgotPassword) {
      const trimmed = email.trim();
      const emailValidation = z.string().trim().email().safeParse(trimmed);
      if (!emailValidation.success) {
        setError("Please enter a valid email address");
        return;
      }
      if (resendCooldown > 0) return;

      setLoading(true);
      try {
        const { error: resetError } = await resetPassword(trimmed);
        if (resetError) {
          setError(resetError.message);
        } else {
          setResetSent(true);
          setResetSentTo(trimmed);
          setResendCooldown(30);
          toast.success("Password reset email sent. Check your inbox.");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
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
          // Auto-resend in the background so the user always has a fresh link
          void resendSignupConfirmation(email.trim(), `${window.location.origin}/instructor-app/login`);
        } else if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else {
          setError(signInError.message);
        }
      } else {
        setRememberMe(rememberMe);
        // Save credentials if remember me is checked
        if (rememberMe) {
          await saveCredentialsForBiometric(email.trim(), password);
        }
        toast.success("Welcome back!");
        navigate("/instructor");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-primary px-4 py-8">
      {/* Add to Home Screen banner removed per request */}
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="mb-6 mx-auto inline-block">
            <img 
              src={dsmLogo} 
              alt="DSM - Driving School Manager" 
              className="h-12 mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isForgotPassword ? (resetSent ? "Check your email" : "Reset Password") : "Welcome Back"}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {isForgotPassword
              ? resetSent
                ? `We've sent a reset link to ${resetSentTo}`
                : "Enter your email and we'll send you a reset link"
              : "Sign in to your Driving School Manager account"}
          </p>
          <p className="text-white/40 text-[10px] mt-2">Build: {BUILD_MARKER}</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4" name="instructor-login" method="post" action="#">
            {showVerifyBanner && !error && (
              <Alert className="py-2 border-amber-300 bg-amber-50 text-amber-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Almost there — check your inbox and click the confirmation link to activate your account before signing in.
                </AlertDescription>
              </Alert>
            )}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive" className="py-2">
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
                              `${window.location.origin}/instructor-app/login`
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

            {/* Biometric Login Button */}
            {biometricAvailable && !isForgotPassword && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-2 bg-background/50 border-border/50"
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
              >
                {biometricLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Fingerprint className="h-5 w-5" />
                )}
                Sign in with {biometryLabel}
              </Button>
            )}

            {!isForgotPassword && (
              <GoogleSignInButton
                redirectTo={`${window.location.origin}/auth/redirect?portal=instructor`}
                className="w-full h-12 bg-white hover:bg-white/90 text-slate-900 border-slate-300"
              />
            )}

            {biometricAvailable && !isForgotPassword && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/80 px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
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
                className="h-12 bg-background/50 border-border/50 focus:border-primary"
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                      className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                      autoComplete="current-password"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isForgotPassword && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMeState(checked as boolean)}
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm font-normal cursor-pointer text-muted-foreground"
                >
                  Remember me (enables {biometryLabel})
                </Label>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-500 text-white hover:bg-emerald-600 font-medium text-base shadow-lg shadow-emerald-500/20"
              disabled={loading || biometricLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isForgotPassword ? "Sending..." : "Signing in..."}
                </>
              ) : (
                isForgotPassword ? "Send Reset Link" : "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setError(""); }}
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to sign in
                </button>
              ) : (
                <>
                  <div>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(""); }}
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div>
                    Don't have an account?{" "}
                    <Link to="/instructor-app/signup" className="text-primary hover:underline font-medium">
                      Sign up free
                    </Link>
                  </div>
                </>
              )}
            </div>
          </form>
        </motion.div>

        {/* Portal Links Footer */}
        <div className="mt-8 text-center text-xs text-white/40 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/drive365" className="hover:text-white/70 transition-colors">Drive365 Learners</Link>
            <span>·</span>
            <Link to="/pupil/login" className="hover:text-white/70 transition-colors">Pupil Portal</Link>
            <span>·</span>
            <Link to="/instructor-app" className="hover:text-white/70 transition-colors">Instructor Home</Link>
            <span>·</span>
            <Link to="/admin/login" className="hover:text-white/70 transition-colors">Admin</Link>
          </div>
        </div>
      </motion.div>
      <InstructorMarketingBottomNav />
    </div>
  );
}
