import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import logoDark from "@/assets/logo-drive365-dark.png";
import logoLight from "@/assets/logo-drive365-light.png";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export default function InstructorPortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, resetPassword } = useInstructorAuth();
  const navigate = useNavigate();

  // Detect dark mode
  const isDark = document.documentElement.classList.contains('dark') || 
                 window.matchMedia('(prefers-color-scheme: dark)').matches;

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl" />
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
          <img 
            src={isDark ? logoLight : logoDark} 
            alt="Drive365" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">
            {isForgotPassword ? "Reset Password" : "Instructor Portal"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isForgotPassword 
              ? "Enter your email to receive a reset link"
              : "Sign in to manage your driving school"}
          </p>
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

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
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
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-emerald-500 focus:ring-emerald-500"
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-base shadow-lg shadow-emerald-500/20"
              disabled={loading}
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

            <div className="text-center text-sm text-muted-foreground space-y-3 pt-2">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setError(""); }}
                  className="inline-flex items-center text-primary hover:underline font-medium"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
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
                  <div className="pt-2 border-t border-border/50">
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-xs text-muted-foreground"
        >
          <p>© {new Date().getFullYear()} Drive365. All rights reserved.</p>
          <div className="mt-2 space-x-3">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
