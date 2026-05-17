import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, Lock, ScanFace, Shield, Award, Users } from "lucide-react";
import drive365Logo from "@/assets/drive365-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PupilRegister from "@/components/pupil/PupilRegister";
import { setRememberMe as persistRememberMe } from "@/lib/sessionPersistence";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type LoginView = "login" | "forgot" | "reset-code" | "new-password";

export default function PupilLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      // Establish a real Supabase Auth session
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

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

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
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
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
    if (!resetCode.trim()) {
      toast.error("Please enter the reset code");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <img src={drive365Logo} alt="Drive365" className="h-12" />
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Your driving journey starts here
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Track your progress, view upcoming lessons, and stay connected 
              with your instructor - all in one place.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Users, text: "Connected with your instructor" },
                { icon: Shield, text: "Track your lesson progress" },
                { icon: Award, text: "Road to your driving licence" },
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
            © {new Date().getFullYear()} Drive365. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:hidden flex items-center justify-center mb-6"
          >
            <img src={drive365Logo} alt="Drive365" className="h-10" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/50">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl text-slate-900">Pupil Portal</CardTitle>
                <p className="text-slate-500 text-sm mt-1">
                  Sign in or register your account
                </p>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100">
                    <TabsTrigger value="login" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-600">Register</TabsTrigger>
                  </TabsList>

                  <div className="mb-4 space-y-3">
                    <GoogleSignInButton
                      redirectTo={`${window.location.origin}/auth/redirect?portal=pupil`}
                      className="w-full bg-white hover:bg-slate-50 text-slate-900 border-slate-300"
                    />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-slate-400">OR</span>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="login">
                    <AnimatePresence mode="wait">
                      {loginView === "login" && (
                        <motion.form
                          key="login-form"
                          initial={{ opacity: 0, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          onSubmit={handleLogin}
                          className="space-y-4"
                          name="pupil-login"
                          method="post"
                          action="#"
                        >
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  inputMode="email"
                                  autoCapitalize="none"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  placeholder="your@email.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                  autoComplete="username"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                <button
                                  type="button"
                                  onClick={() => setLoginView("forgot")}
                                  className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                                >
                                  Forgot password?
                                </button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  id="password"
                                  name="password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                  autoComplete="current-password"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              First time? Use the Register tab to set up your password.
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="remember"
                              checked={rememberMe}
                              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                              className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <label
                              htmlFor="remember"
                              className="text-sm font-medium leading-none text-slate-600"
                            >
                              Remember me on this device
                            </label>
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-12 text-base bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={loading || !email.trim() || !password}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>

                          {faceIdAvailable && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-12 text-base bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              onClick={handleFaceIdLogin}
                              disabled={loading}
                            >
                              <ScanFace className="mr-2 h-5 w-5" />
                              Sign in with Face ID
                            </Button>
                          )}
                        </motion.form>
                      )}

                      {loginView === "forgot" && (
                        <motion.div
                          key="forgot-form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
                            <p className="text-sm text-slate-500">We'll send a 6-digit code to your email</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                name="email"
                                type="email"
                                autoComplete="username"
                                inputMode="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                              />
                            </div>
                          </div>
                          <Button
                            className="w-full h-12 text-base bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={loading || !email.trim()}
                            onClick={handleForgotPassword}
                          >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Reset Code
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-900"
                            onClick={() => setLoginView("login")}
                          >
                            Back to sign in
                          </Button>
                        </motion.div>
                      )}

                      {loginView === "reset-code" && (
                        <motion.div
                          key="reset-form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="text-center mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">Enter Reset Code</h3>
                            <p className="text-sm text-slate-500">Check your email for the 6-digit code</p>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">Reset Code</Label>
                              <Input
                                type="text"
                                placeholder="000000"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="h-12 bg-slate-50 border-slate-200 text-slate-900 text-center text-xl tracking-[0.5em] placeholder:text-slate-400 placeholder:tracking-[0.5em] focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                maxLength={6}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">New Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  name="new-password"
                                  type="password"
                                  autoComplete="new-password"
                                  placeholder="••••••••"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700">Confirm Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  name="confirm-password"
                                  type="password"
                                  autoComplete="new-password"
                                  placeholder="••••••••"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            className="w-full h-12 text-base bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={loading || resetCode.length !== 6 || !newPassword}
                            onClick={handleConfirmReset}
                          >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Reset Password
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex-1 text-slate-500 hover:text-slate-900"
                              onClick={() => setLoginView("forgot")}
                            >
                              Resend code
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex-1 text-slate-500 hover:text-slate-900"
                              onClick={() => setLoginView("login")}
                            >
                              Back to sign in
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>

                  <TabsContent value="register">
                    <PupilRegister
                      instructorId={slugInstructorId}
                      instructorName={slugInstructorName}
                    />
                  </TabsContent>
                </Tabs>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Having trouble? Contact your instructor directly or email{" "}
                  <a href="mailto:support@everydriver.co.uk" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    support@everydriver.co.uk
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Portal Links Footer */}
          <div className="mt-8 text-center text-xs text-slate-400 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/drive365" className="hover:text-slate-600 transition-colors">Drive365</Link>
              <span>·</span>
              <Link to="/instructor-app" className="hover:text-slate-600 transition-colors">Instructor Home</Link>
              <span>·</span>
              <Link to="/instructor-app/login" className="hover:text-slate-600 transition-colors">Instructor Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
