import { useState } from "react";
import { Loader2, Mail, KeyRound, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast as uiToast } from "@/hooks/use-toast";

export function AccountSecurityPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleEmailUpdate = async () => {
    if (!email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    setSavingEmail(false);
    uiToast({
      title: error ? "Error" : "Check your inbox",
      description: error ? error.message : "We've sent a confirmation link to the new address.",
      variant: error ? "destructive" : undefined,
    });
    if (!error) setEmail("");
  };

  const handlePasswordUpdate = async () => {
    if (password.length < 8) {
      uiToast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPwd(false);
    uiToast({
      title: error ? "Error" : "Password updated",
      description: error?.message,
      variant: error ? "destructive" : undefined,
    });
    if (!error) setPassword("");
  };

  const handleSignOutEverywhere = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);
    if (error) {
      uiToast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Change login email</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll need to confirm the new email address from a link we send to it.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="new@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Button onClick={handleEmailUpdate} disabled={savingEmail || !email}>
            {savingEmail && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Send confirmation
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Change password</Label>
        </div>
        <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button onClick={handlePasswordUpdate} disabled={savingPwd || !password}>
            {savingPwd && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update password
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-6">
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">Sign out of all devices</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ends every active session, including this one. You'll need to sign in again.
        </p>
        <Button variant="outline" onClick={handleSignOutEverywhere} disabled={signingOut}>
          {signingOut && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sign out everywhere
        </Button>
      </div>
    </div>
  );
}
