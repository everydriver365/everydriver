import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const PORTAL_LOGIN_PATHS: Record<string, { label: string; path: string }> = {
  "instructor-app": { label: "Instructor App", path: "/instructor-app/login" },
  instructor: { label: "Instructor Portal", path: "/instructor/login" },
  admin: { label: "Admin", path: "/admin/login" },
  school: { label: "School Manager", path: "/school/login" },
  pupil: { label: "Pupil Portal", path: "/pupil/login" },
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const portalKey = params.get("portal") ?? "instructor-app";
  const portal = PORTAL_LOGIN_PATHS[portalKey] ?? PORTAL_LOGIN_PATHS["instructor-app"];

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase recovery link populates a session via the URL hash. Listen for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
      setReady(true);
    });

    // Also check current session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setSuccess(true);
    // Sign out so the user logs in fresh with their new password.
    await supabase.auth.signOut();
    setTimeout(() => navigate(portal.path), 1800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-card/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set a new password</h1>
          <p className="text-sm text-white/60">
            For your {portal.label} account
          </p>
        </div>

        {!ready ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-white/60" />
          </div>
        ) : success ? (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Password updated. Redirecting to sign in...
            </AlertDescription>
          </Alert>
        ) : !hasSession ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This reset link is invalid or has expired. Please request a new one.
              </AlertDescription>
            </Alert>
            <Button asChild variant="secondary" className="w-full">
              <Link to={portal.path}>Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" name="reset-password" method="post" action="#">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-white/80">New password</Label>
              <Input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-white/80">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update password
            </Button>
            <Button asChild variant="ghost" className="w-full text-white/70">
              <Link to={portal.path}>Cancel</Link>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
