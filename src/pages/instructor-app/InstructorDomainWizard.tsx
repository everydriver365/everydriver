import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface DomainState {
  custom_domain: string | null;
  custom_domain_verification_token: string | null;
  custom_domain_verified: boolean | null;
  custom_domain_dns_status: string | null;
  custom_domain_ssl_status: string | null;
  custom_domain_status_message: string | null;
  custom_domain_last_checked_at: string | null;
}

const STEPS = ["Enter domain", "Add DNS records", "Verify", "Done"] as const;

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div className="grid grid-cols-[60px_80px_1fr_auto] gap-2 items-center text-xs py-1.5 border-b last:border-b-0">
      <span className="font-mono font-semibold">{type}</span>
      <span className="font-mono text-muted-foreground">{name}</span>
      <span className="font-mono break-all">{value}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}
        className="p-1 text-muted-foreground hover:text-foreground"
        aria-label="Copy"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function InstructorDomainWizard() {
  const { instructor } = useInstructorAuth();
  const instructorId = (instructor as any)?.id;
  const [state, setState] = useState<DomainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainInput, setDomainInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);

  const refresh = async () => {
    if (!instructorId) return;
    const { data } = await (supabase as any)
      .from("instructors")
      .select("custom_domain, custom_domain_verification_token, custom_domain_verified, custom_domain_dns_status, custom_domain_ssl_status, custom_domain_status_message, custom_domain_last_checked_at")
      .eq("id", instructorId)
      .maybeSingle();
    setState(data ?? null);
    if (data?.custom_domain) setDomainInput(data.custom_domain);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [instructorId]);

  // Auto-poll every 30s while in verifying state
  useEffect(() => {
    if (!autoPoll) return;
    const t = setInterval(() => verify(true), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPoll, instructorId]);

  const addDomain = async () => {
    if (!domainInput.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("add-custom-domain", {
      body: { domain: domainInput.trim() },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to add domain");
      return;
    }
    toast.success("Domain added — now add the DNS records");
    await refresh();
  };

  const verify = async (silent = false) => {
    if (!silent) setVerifying(true);
    const { data, error } = await supabase.functions.invoke("verify-custom-domain", {});
    if (!silent) setVerifying(false);
    if (error) {
      if (!silent) toast.error(error.message);
      return;
    }
    const verified = (data as any)?.verified;
    if (verified) {
      toast.success("Domain verified!");
      setAutoPoll(false);
    } else if (!silent) {
      toast.message("Not verified yet", {
        description: (data as any)?.message || "DNS may still be propagating.",
      });
    }
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasDomain = !!state?.custom_domain;
  const verified = !!state?.custom_domain_verified;
  const token = state?.custom_domain_verification_token || "";
  const apex = (state?.custom_domain || "").replace(/^www\./, "");
  const currentStep = !hasDomain ? 0 : verified ? 3 : (state?.custom_domain_last_checked_at ? 2 : 1);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom domain</h1>
        <p className="text-sm text-muted-foreground">
          Connect your own domain (e.g. yourdrivingschool.co.uk) to your mini-website.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                i < currentStep
                  ? "bg-emerald-500 text-white"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={i === currentStep ? "font-medium" : "text-muted-foreground"}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      {/* Step 1 — domain input */}
      <Card className="p-4 space-y-3">
        <Label>Your domain</Label>
        <div className="flex gap-2">
          <Input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="yourdrivingschool.co.uk"
            disabled={hasDomain && !verified}
          />
          {!hasDomain ? (
            <Button onClick={addDomain} disabled={submitting || !domainInput.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          ) : verified ? (
            <Button variant="outline" onClick={() => { setDomainInput(""); addDomain(); }}>
              Replace
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the apex (no http:// or www).
        </p>
      </Card>

      {/* Step 2 — DNS records */}
      {hasDomain && token && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Add these DNS records at your registrar</h3>
          <p className="text-xs text-muted-foreground">
            Log in to where you bought your domain (123-reg, GoDaddy, Cloudflare…), open DNS
            settings, and add these records exactly:
          </p>
          <div className="rounded-lg border p-3 bg-muted/30">
            <DnsRow type="A" name="@" value="185.158.133.1" />
            <DnsRow type="A" name="www" value="185.158.133.1" />
            <DnsRow type="TXT" name="_lovable" value={`lovable_verify=${token}`} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            DNS changes can take up to 30 minutes (occasionally a few hours). Once you've added
            them, click <b>Verify</b>.
          </p>
        </Card>
      )}

      {/* Step 3 — verify */}
      {hasDomain && !verified && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Verify DNS</h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoPoll}
                  onChange={(e) => setAutoPoll(e.target.checked)}
                />
                Auto re-check every 30s
              </label>
              <Button onClick={() => verify(false)} disabled={verifying} size="sm">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Verify
              </Button>
            </div>
          </div>
          {state?.custom_domain_status_message && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{state.custom_domain_status_message}</span>
            </div>
          )}
          {state?.custom_domain_last_checked_at && (
            <p className="text-[11px] text-muted-foreground">
              Last checked: {new Date(state.custom_domain_last_checked_at).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {/* Step 4 — done */}
      {verified && (
        <Card className="p-4 space-y-3 border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Domain verified</h3>
          </div>
          <p className="text-sm">
            DNS is verified. SSL certificates are provisioned automatically — your site will be
            live on <b>https://{apex}</b> within a few minutes. If it isn't loading after 30
            minutes, contact support.
          </p>
          <a
            href={`https://${apex}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Open site <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="text-xs text-muted-foreground pt-2">
            SSL status: <b className="capitalize">{state?.custom_domain_ssl_status || "pending"}</b>
          </div>
        </Card>
      )}
    </div>
  );
}
