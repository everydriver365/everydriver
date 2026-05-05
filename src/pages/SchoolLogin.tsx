import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchoolAuth } from "@/context/SchoolAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";

type View = "login" | "forgot";

export default function SchoolLogin() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const { signIn } = useSchoolAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setRememberMe(rememberMe);
      navigate("/school/dashboard");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email first");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password?portal=school`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent! Check your inbox.");
      setView("login");
    }
  };

  const isForgot = view === "forgot";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-card/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
            <Building2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isForgot ? "Reset password" : "School Manager"}
          </h1>
          <p className="text-sm text-white/60">
            {isForgot
              ? "Enter your email and we'll send a reset link"
              : "Sign in to manage your school"}
          </p>
        </div>

        <form
          onSubmit={isForgot ? handleForgot : handleSubmit}
          className="space-y-4"
          name={isForgot ? "school-forgot" : "school-login"}
          method="post"
          action="#"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {!isForgot && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          )}

          {!isForgot && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="school-remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMeState(v === true)}
                />
                <Label htmlFor="school-remember" className="text-sm text-white/70 cursor-pointer">
                  Keep me signed in
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-sm text-emerald-400 hover:text-emerald-300"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isForgot ? "Send reset link" : "Sign In"}
          </Button>

          {isForgot && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/70"
              onClick={() => setView("login")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
