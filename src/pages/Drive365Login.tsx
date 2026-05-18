import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ScanFace,
  Calendar,
  ArrowLeftRight,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setRememberMe as persistRememberMe } from "@/lib/sessionPersistence";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";
import drive365Logo from "@/assets/drive365-logo.png";

const FIELD =
  "h-[50px] rounded-[9px] bg-[#F9FAFB] border-[1.5px] border-[#E8EDF6] text-[#0F2044] placeholder:text-[#C4C9D4] focus-visible:ring-2 focus-visible:ring-[#1A52A0]/15 focus-visible:border-[#1A52A0] focus-visible:ring-offset-0 text-[14px]";

export default function Drive365Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [faceIdSuccess, setFaceIdSuccess] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem("pupil_remembered_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if ((window as any).PasswordCredential) setFaceIdAvailable(true);
  }, []);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("pupil-email-auth", {
        body: { action: "login", email: loginEmail, password: loginPassword },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Could not sign you in. Please try again.");
        return false;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (signInError) {
        toast.error(signInError.message);
        return false;
      }
      persistRememberMe(rememberMe);
      if (rememberMe || localStorage.getItem("pupil_remembered_email")) {
        localStorage.setItem("pupil_remembered_email", loginEmail);
      }
      if ((window as any).PasswordCredential) {
        try {
          const CredCtor = (window as any).PasswordCredential;
          const cred = new CredCtor({ id: loginEmail, password: loginPassword, name: data.pupilName });
          await navigator.credentials.store(cred);
        } catch {}
      }
      const firstName = data.pupilName?.split(" ")[0] || "";
      toast.success(`Welcome back, ${firstName}!`);
      navigate(`/p/${data.instructorSlug}`);
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");
    if (!password) return toast.error("Please enter your password");
    setLoading(true);
    await performLogin(email.trim(), password);
    setLoading(false);
  };

  const handleFaceIdLogin = async () => {
    if (!(window as any).PasswordCredential) return;
    setFaceIdLoading(true);
    try {
      const credential = await navigator.credentials.get({ password: true, mediation: "required" } as any);
      if (credential && (credential as any).type === "password") {
        const pwCred = credential as any;
        setFaceIdSuccess(true);
        setEmail(pwCred.id);
        await performLogin(pwCred.id, pwCred.password || "");
      }
    } catch {
      toast.error("Biometric login cancelled or not available");
    } finally {
      setFaceIdLoading(false);
      setTimeout(() => setFaceIdSuccess(false), 800);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const features = [
    { Icon: Calendar, bg: "rgba(26,82,160,0.3)", title: "Book & manage lessons", sub: "Hours, notes & upcoming lessons" },
    { Icon: ArrowLeftRight, bg: "rgba(26,82,160,0.3)", title: "Free test swap service", sub: "Earlier dates, at no cost" },
    { Icon: ShieldCheck, bg: "rgba(204,34,41,0.3)", title: "Free retest guarantee", sub: "Money back if you pass first time" },
  ];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row">
      {/* LEFT PANEL */}
      <aside className="hidden md:flex flex-col justify-between relative overflow-hidden flex-1 bg-[#0F2044] p-11">
        {/* Vertical red+blue stripe */}
        <div className="absolute top-0 left-0 bottom-0 w-[6px] flex flex-col">
          <div className="flex-1 bg-[#CC2229]" />
          <div className="flex-1 bg-[#1A52A0]" />
        </div>
        {/* Decorative circle */}
        <div
          className="pointer-events-none absolute -bottom-[80px] -right-[80px] w-[260px] h-[260px] rounded-full"
          style={{ border: "52px solid rgba(26,82,160,0.18)" }}
        />

        <img src={drive365Logo} alt="Drive365" className="h-12 object-contain relative z-10 self-start" />

        <div className="relative z-10">
          <div className="flex items-center gap-[7px] mb-[18px]">
            <div className="w-4 h-[2px] bg-[#CC2229] rounded-sm" />
            <span className="text-[11px] font-semibold text-white/40 tracking-[0.9px] uppercase">
              Pupil panel
            </span>
          </div>
          <h1 className="text-[36px] font-bold text-white leading-[42px] tracking-[-0.8px] mb-3">
            Your driving<br />journey,<br />
            <span className="text-[#CC2229] italic">all in one place.</span>
          </h1>
          <p className="text-[14px] font-light text-white/50 leading-6 mb-8 max-w-[300px]">
            Book lessons, track your progress, pay your instructor and pass faster.
          </p>

          <div className="space-y-[10px] max-w-[360px]">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3 bg-white/[0.06] rounded-[10px] border border-white/[0.08] p-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: f.bg }}
                >
                  <f.Icon className="w-[15px] h-[15px] text-white/85" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{f.title}</p>
                  <p className="text-[11px] font-light text-white/40 mt-0.5">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] font-light text-white/20 relative z-10">
          © {new Date().getFullYear()} Drive365 Ltd · DVSA approved
        </p>
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 flex justify-center items-start md:items-center bg-white px-5 py-10 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[390px]"
        >
          <img src={drive365Logo} alt="Drive365" className="h-8 object-contain" />
          <div className="h-7" />

          <h2 className="text-[22px] font-bold text-[#0F2044] tracking-[-0.4px] mb-[5px]">
            Welcome back
          </h2>
          <p className="text-[13px] font-light text-[#9CA3AF] leading-5 mb-[26px]">
            Sign in to your Drive365 account to continue.
          </p>

          <form onSubmit={handleLogin}>
            <div className="mb-[14px]">
              <Label htmlFor="email" className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                Email address
              </Label>
              <div className="relative">
                <Input
                  id="email" type="email"
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

            <div className="mb-[14px]">
              <Label htmlFor="password" className="text-[10px] font-bold text-[#6B7280] tracking-[0.6px] uppercase mb-[7px] block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(FIELD, "pr-11")}
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => setRememberMe((p) => !p)}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "w-[19px] h-[19px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-colors",
                    rememberMe ? "bg-[#1A52A0] border-[#1A52A0]" : "bg-white border-[#DDE3ED]"
                  )}
                >
                  {rememberMe && <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />}
                </span>
                <span className="text-[13px] font-normal text-[#6B7280]">Remember me</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/pupil/login")}
                className="text-[13px] font-medium text-[#1A52A0] hover:text-[#0F2044]"
              >
                Forgot password?
              </button>
            </div>

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

            {faceIdAvailable && (
              <button
                type="button"
                onClick={handleFaceIdLogin}
                disabled={faceIdLoading || loading}
                className={cn(
                  "w-full rounded-[9px] bg-[#F2F4F8] border-[1.5px] py-[12px] flex items-center justify-center gap-[9px] mb-6 transition-colors",
                  faceIdSuccess ? "border-[#1D9E75]" : faceIdLoading ? "border-[#1A52A0]" : "border-[#E8EDF6] hover:border-[#DDE3ED]"
                )}
              >
                {faceIdSuccess ? (
                  <CheckCircle2 className="h-[22px] w-[22px] text-[#1D9E75]" />
                ) : (
                  <ScanFace className="h-[22px] w-[22px]" style={{ color: faceIdLoading ? "#1A52A0" : "#374151" }} />
                )}
                <span
                  className="text-[14px] font-medium"
                  style={{ color: faceIdSuccess ? "#085041" : faceIdLoading ? "#1A52A0" : "#374151" }}
                >
                  {faceIdSuccess ? "Recognised — signing in" : faceIdLoading ? "Scanning…" : "Sign in with Face ID"}
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#F0F2F5]" />
              <span className="text-[11px] font-medium text-[#C4C9D4] uppercase tracking-wider">
                or continue with
              </span>
              <div className="flex-1 h-px bg-[#F0F2F5]" />
            </div>

            <div className="mb-[22px]">
              <GoogleSignInButton
                redirectTo={`${window.location.origin}/auth/redirect?portal=pupil`}
                className="w-full h-[44px] rounded-[9px] bg-[#F9FAFB] hover:bg-white border-[1.5px] border-[#E8EDF6] text-[#374151] text-[13px] font-medium"
                label="Continue with Google"
              />
            </div>

            <div className="text-center">
              <span className="text-[13px] font-light text-[#9CA3AF]">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/pupil/login")}
                  className="font-semibold text-[#CC2229] hover:text-[#A81E24]"
                >
                  Register for free
                </button>
              </span>
            </div>
          </form>

          <p className="mt-8 text-center text-[11px] font-light text-[#C4C9D4] md:hidden">
            © {new Date().getFullYear()} Drive365 Ltd · DVSA approved
          </p>
        </motion.div>
      </main>
    </div>
  );
}
