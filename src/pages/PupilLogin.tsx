import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowRight, Lock, ScanFace, Car, Shield, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PupilRegister from "@/components/pupil/PupilRegister";

export default function PupilLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();

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

      sessionStorage.setItem("pupil_email_verified", loginEmail);
      if (data.instructorId) {
        sessionStorage.setItem(`pupil_${data.instructorId}`, data.pupilId);
      }
      
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
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EveryDriver</span>
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
            © 2025 EveryDriver. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-8"
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
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl text-white">Pupil Portal</CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  Sign in or register your account
                </p>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/10">
                    <TabsTrigger value="login" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-300">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-slate-300">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-slate-300">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                              autoComplete="username"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-slate-300">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
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
                          className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <label
                          htmlFor="remember"
                          className="text-sm font-medium leading-none text-slate-300"
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
                          className="w-full h-12 text-base bg-white/5 border-white/20 text-white hover:bg-white/10"
                          onClick={handleFaceIdLogin}
                          disabled={loading}
                        >
                          <ScanFace className="mr-2 h-5 w-5" />
                          Sign in with Face ID
                        </Button>
                      )}
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <PupilRegister />
                  </TabsContent>
                </Tabs>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Having trouble? Contact your instructor directly or email{" "}
                  <a href="mailto:support@everydriver.co.uk" className="text-emerald-400 hover:text-emerald-300">
                    support@everydriver.co.uk
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Portal Links Footer */}
          <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/drive365" className="hover:text-slate-300 transition-colors">Drive365 Learners</Link>
              <span>·</span>
              <Link to="/instructor-app" className="hover:text-slate-300 transition-colors">Instructor Home</Link>
              <span>·</span>
              <Link to="/instructor-app/login" className="hover:text-slate-300 transition-colors">Instructor Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}