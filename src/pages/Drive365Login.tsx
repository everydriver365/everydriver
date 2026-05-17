import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import drive365Logo from "@/assets/drive365-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setRememberMe as persistRememberMe } from "@/lib/sessionPersistence";

export default function Drive365Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const remembered = localStorage.getItem("pupil_remembered_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");
    if (!password) return toast.error("Please enter your password");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
        body: { action: "login", email: email.trim(), password },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Could not sign you in. Please try again.");
        setLoading(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        toast.error(signInError.message);
        setLoading(false);
        return;
      }
      persistRememberMe(rememberMe);
      if (rememberMe) localStorage.setItem("pupil_remembered_email", email.trim());

      const firstName = data.pupilName?.split(" ")[0] || "";
      toast.success(`Welcome back, ${firstName}!`);
      navigate(`/p/${data.instructorSlug}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0F172A]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2D3FE7_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#00C8B8_0%,_transparent_50%)] opacity-80" />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <img src={drive365Logo} alt="Drive365" className="h-20 w-auto drop-shadow-2xl" />
          <Loader2 className="h-6 w-6 text-white/70 animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0F172A]">
      {/* Brand gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#2D3FE7_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#00C8B8_0%,_transparent_50%)] opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(15,23,42,0.2)_0%,_rgba(15,23,42,0.85)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top brand bar */}
        <header className="flex items-center justify-between px-5 py-5 md:px-10">
          <a href="https://drive365.co.uk" className="flex items-center gap-2">
            <img src={drive365Logo} alt="Drive365" className="h-9 w-auto" />
          </a>
          <a
            href="https://drive365.co.uk"
            className="text-xs font-medium text-white/70 hover:text-white transition"
          >
            drive365.co.uk →
          </a>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 pb-10">
          <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
            {/* Brand panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:flex flex-col gap-6 text-white"
            >
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#00C8B8]" /> Drive365 · Pupil Portal
              </span>
              <h1 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
                Your driving journey,{" "}
                <span className="bg-gradient-to-r from-[#4F5BFF] to-[#00C8B8] bg-clip-text text-transparent">
                  beautifully organised.
                </span>
              </h1>
              <p className="text-white/70 text-base max-w-md">
                Book lessons, track progress, pay your instructor and pass faster — all in one place.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <ShieldCheck className="h-4 w-4 text-[#00C8B8]" />
                Secure sign-in · UK based · DVSA aligned
              </div>
            </motion.div>

            {/* Login card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mx-auto w-full max-w-md"
            >
              <div className="rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl shadow-[#2D3FE7]/20 p-7 md:p-8 border border-white/40">
                <div className="flex flex-col items-center text-center mb-6 lg:hidden">
                  <img src={drive365Logo} alt="Drive365" className="h-12 w-auto mb-3" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Sign in to Drive365
                </h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Enter your email and password to continue.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2D3FE7]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#2D3FE7]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(v) => setRememberMe(!!v)}
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/pupil/login")}
                      className="text-[#2D3FE7] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#2D3FE7] to-[#00C8B8] hover:opacity-95 text-white shadow-lg shadow-[#2D3FE7]/30"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign in <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-6">
                  Don't have an account?{" "}
                  <button
                    onClick={() => navigate("/pupil/login")}
                    className="text-[#2D3FE7] font-medium hover:underline"
                  >
                    Register
                  </button>
                </p>
              </div>

              <p className="text-center text-xs text-white/50 mt-5">
                © {new Date().getFullYear()} Drive365 · Powered by EveryDriver
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
