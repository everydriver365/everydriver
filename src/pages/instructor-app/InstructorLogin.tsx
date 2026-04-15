import { useState, useEffect } from "react";
import dsmLogo from "@/assets/dsm-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, Fingerprint, Eye, EyeOff, Share, Plus, Download, X } from "lucide-react";
import { InstructorMarketingBottomNav } from "@/components/layout/InstructorMarketingBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

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
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();

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
        if ('credentials' in navigator && 'PasswordCredential' in window) {
          const hasSavedCredentials = localStorage.getItem('instructor-biometric-enabled');
          if (hasSavedCredentials) {
            setBiometricAvailable(true);
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

  // Handle biometric login (Face ID / Touch ID)
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError("");
    
    try {
      const credential = await navigator.credentials.get({
        password: true,
        mediation: 'optional'
      } as CredentialRequestOptions);
      
      if (credential && 'password' in credential) {
        const passwordCredential = credential as any;
        const savedEmail = passwordCredential.id;
        const savedPassword = passwordCredential.password;
        
        if (savedEmail && savedPassword) {
          const { error: signInError } = await signIn(savedEmail, savedPassword);
          
          if (signInError) {
            setError("Biometric login failed. Please use email and password.");
          } else {
            toast.success("Welcome back!");
            navigate("/instructor");
          }
        }
      } else {
        setError("No saved credentials found. Please log in manually first.");
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
    try {
      if ('credentials' in navigator && 'PasswordCredential' in window) {
        const PasswordCredentialClass = (window as any).PasswordCredential;
        const credential = new PasswordCredentialClass({
          id: emailToSave,
          password: passwordToSave,
          name: 'EveryDriver Instructor'
        });
        await navigator.credentials.store(credential);
        localStorage.setItem('instructor-biometric-enabled', 'true');
        setBiometricAvailable(true);
      }
    } catch (err) {
      console.log('Could not save credentials:', err);
    }
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
        if (signInError.message.includes("Invalid login")) {
          setError("Invalid email or password");
        } else {
          setError(signInError.message);
        }
      } else {
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
            {isForgotPassword ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            {isForgotPassword 
              ? "Enter your email to receive a reset link"
              : "Sign in to your EveryDriver account"}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
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
                Sign in with Face ID / Touch ID
              </Button>
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
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 bg-background/50 border-border/50 focus:border-primary"
                autoComplete="email"
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
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm font-normal cursor-pointer text-muted-foreground"
                >
                  Remember me (enables Face ID / Touch ID)
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
