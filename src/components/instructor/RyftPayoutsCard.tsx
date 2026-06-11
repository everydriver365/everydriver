import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ryftLogo from "@/assets/ryft-logo.svg";

interface InstructorRyftRow {
  ryft_account_id: string | null;
  ryft_account_status: string | null;
  ryft_payouts_enabled: boolean | null;
  ryft_onboarding_url: string | null;
}

interface Props {
  instructorId: string;
}

export function RyftPayoutsCard({ instructorId }: Props) {
  const [row, setRow] = useState<InstructorRyftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("instructors")
      .select("ryft_account_id, ryft_account_status, ryft_payouts_enabled, ryft_onboarding_url")
      .eq("id", instructorId)
      .maybeSingle();
    setRow(data as InstructorRyftRow | null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [instructorId]);

  const startOnboarding = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ryft-onboard-instructor");
      if (error) throw error;
      if (data?.onboardingUrl) {
        window.open(data.onboardingUrl, "_blank", "noopener,noreferrer");
        toast.success("Ryft onboarding opened in a new tab");
        await load();
      } else {
        toast.error(data?.error || "Could not start onboarding");
      }
    } catch (e: any) {
      toast.error(e?.message || "Onboarding failed");
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("ryft-account-status");
      if (error) throw error;
      await load();
      toast.success("Status refreshed");
    } catch (e: any) {
      toast.error(e?.message || "Refresh failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payout status…
      </CardContent></Card>
    );
  }

  const enabled = !!row?.ryft_payouts_enabled;
  const status = row?.ryft_account_status || (row?.ryft_account_id ? "pending" : "not_started");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={ryftLogo} alt="Ryft" className="h-7" />
            <div>
              <CardTitle className="text-base">Card payments &amp; payouts</CardTitle>
              <CardDescription>Powered by Ryft — supports Apple Pay, Google Pay and 3D Secure.</CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"} className="gap-1">
            {enabled && <CheckCircle2 className="h-3.5 w-3.5" />}
            {enabled ? "Payouts enabled" : status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!row?.ryft_account_id && (
          <p className="text-sm text-muted-foreground">
            To accept card payments from pupils you need to complete a short verification with Ryft.
            Service Fee applies on each transaction as set in your pricing rules.
          </p>
        )}
        {row?.ryft_account_id && !enabled && (
          <p className="text-sm text-muted-foreground">
            Your Ryft account is created but payouts are not enabled yet. Finish the onboarding to start accepting cards.
          </p>
        )}
        {enabled && (
          <p className="text-sm text-muted-foreground">
            You're set up to take card payments. Pupil payments are split automatically — your share lands in your bank account.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={startOnboarding} disabled={busy} size="sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {row?.ryft_account_id ? "Continue onboarding" : "Start onboarding"}
          </Button>
          <Button onClick={refresh} disabled={busy} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" /> Refresh status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
