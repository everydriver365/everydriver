import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, User, ArrowRight, Lock, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDomainBranding } from "@/hooks/useDomainBranding";
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
  const branding = useDomainBranding();

  // Check if Web Credentials API is available (Face ID / biometric)
  useEffect(() => {
    if ((window as any).PasswordCredential) {
      setFaceIdAvailable(true);
    }
  }, []);

  // Try auto-login with saved credentials on mount
  useEffect(() => {
    const tryAutoLogin = async () => {
      if (!(window as any).PasswordCredential) return;
      
      // Check if we have remembered credentials
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
        // Silently fail - user can login manually
      }
    };

    tryAutoLogin();
  }, []);

  // Listen for registration complete event
  useEffect(() => {
    const handler = () => setActiveTab("login");
    window.addEventListener("pupil-registered", handler);
    return () => window.removeEventListener("pupil-registered", handler);
  }, []);

  // Check for remembered email
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

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setAutoLoggingIn(false);
        return false;
      }

      // Store session for both the generic portal and branded portal
      sessionStorage.setItem("pupil_email_verified", loginEmail);
      if (data.instructorId) {
        sessionStorage.setItem(`pupil_${data.instructorId}`, data.pupilId);
      }
      
      if (rememberMe || localStorage.getItem("pupil_remembered_email")) {
        localStorage.setItem("pupil_remembered_email", loginEmail);
      }

      // Save credentials for Face ID
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
          // Credentials API not fully supported, continue
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
      <div className="min-h-screen w-full flex flex-col bg-primary items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
        <p className="text-primary-foreground/70 text-sm mt-3">Signing you in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-primary">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mb-4 mx-auto inline-block">
                <img src={branding.logoPath} alt={branding.brandName} className="h-12 mx-auto" />
              </div>
              <CardTitle className="text-2xl">Pupil Portal</CardTitle>
              <CardDescription>
                Sign in or register your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 text-lg h-12"
                          autoComplete="username"
                          autoFocus
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 text-lg h-12"
                          autoComplete="current-password"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        First time? Use the Register tab to set up your password.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me on this device
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base"
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
                        className="w-full h-12 text-base"
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

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Having trouble? Contact your instructor directly or email{" "}
                <a href="mailto:support@everydriver.co.uk" className="text-primary hover:underline">
                  support@everydriver.co.uk
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
