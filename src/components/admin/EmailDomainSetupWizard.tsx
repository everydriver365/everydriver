import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ChevronDown, ExternalLink, ShieldCheck, Globe2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

interface DnsRecord {
  id: string;
  type: "TXT" | "NS";
  host: string;
  value: string;
  note?: string;
}

const SUBDOMAIN = "notify";
const NS_TARGETS = ["ns7.lovable.cloud", "ns8.lovable.cloud"];

const REGISTRARS: { name: string; steps: string[] }[] = [
  {
    name: "GoDaddy",
    steps: [
      "Sign in → My Products → DNS next to your domain.",
      "Click Add New Record. Set Type to TXT or NS.",
      "Paste the Host into Name and the Value into Value. Leave TTL default.",
      "Save. Repeat for all 3 records.",
    ],
  },
  {
    name: "123-reg",
    steps: [
      "Control Panel → Manage Domain → Advanced DNS.",
      "Click Add Record. Choose TXT or NS.",
      "Enter the Host (Hostname) and Value (Content).",
      "Save changes.",
    ],
  },
  {
    name: "Cloudflare",
    steps: [
      "Select your domain → DNS → Records → Add record.",
      "Set type to TXT or NS, paste Name and Content (or Target).",
      "Set Proxy status to DNS only (grey cloud) for NS records.",
      "Save.",
    ],
  },
  {
    name: "Namecheap",
    steps: [
      "Domain List → Manage → Advanced DNS.",
      "Add New Record → choose TXT or NS.",
      "Host = the part before the dot in your records (e.g. notify).",
      "Target/Value = the full value. Save.",
    ],
  },
];

interface Props {
  domainFqdn?: string; // e.g. "notify.drive365.co.uk"
}

export function EmailDomainSetupWizard({ domainFqdn = "notify.drive365.co.uk" }: Props) {
  const rootDomain = useMemo(
    () => domainFqdn.replace(new RegExp(`^${SUBDOMAIN}\\.`), ""),
    [domainFqdn]
  );

  const tokenKey = `email-dns-setup:${domainFqdn}:txt-token`;
  const [txtToken, setTxtToken] = useState<string>(() => localStorage.getItem(tokenKey) ?? "");

  useEffect(() => {
    localStorage.setItem(tokenKey, txtToken);
  }, [txtToken, tokenKey]);

  const records: DnsRecord[] = useMemo(
    () => [
      {
        id: "txt",
        type: "TXT",
        host: `_lovable_email_verify.${SUBDOMAIN}`,
        value: txtToken ? `lovable_verify=${txtToken.replace(/^lovable_verify=/, "")}` : "(paste your token below to reveal)",
        note: "Verifies you own the domain.",
      },
      {
        id: "ns1",
        type: "NS",
        host: SUBDOMAIN,
        value: NS_TARGETS[0],
        note: "Delegates the notify subdomain to Lovable.",
      },
      {
        id: "ns2",
        type: "NS",
        host: SUBDOMAIN,
        value: NS_TARGETS[1],
      },
    ],
    [txtToken]
  );

  const checkKey = (id: string) => `email-dns-setup:${domainFqdn}:added:${id}`;
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    ["txt", "ns1", "ns2"].forEach((id) => {
      next[id] = localStorage.getItem(`email-dns-setup:${domainFqdn}:added:${id}`) === "1";
    });
    return next;
  });

  const toggleChecked = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(checkKey(id), next[id] ? "1" : "0");
      return next;
    });
  };

  const allChecked = checked.txt && checked.ns1 && checked.ns2;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch {
      toast.error("Copy failed — please select and copy manually");
    }
  };

  const [openRegistrar, setOpenRegistrar] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <AdminBackButton />

      {/* Intro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            Email Domain Setup — {domainFqdn}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Add the 3 DNS records below at your domain registrar (where{" "}
            <span className="font-mono text-foreground">{rootDomain}</span> is managed). You do{" "}
            <strong>not</strong> need to create the <span className="font-mono">{SUBDOMAIN}</span> subdomain yourself —
            the two NS records below are what create it.
          </p>
          <p>
            Your root domain and any existing email on <span className="font-mono">{rootDomain}</span> are not affected.
          </p>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Records added", done: allChecked },
          { label: "DNS verifying", done: false, pending: allChecked },
          { label: "Emails live", done: false },
        ].map((step, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${
              step.done
                ? "border-green-300 bg-green-50"
                : step.pending
                ? "border-amber-300 bg-amber-50"
                : "border-border bg-muted/30"
            }`}
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step.done
                  ? "bg-green-600 text-white"
                  : step.pending
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="text-sm font-medium">{step.label}</div>
          </div>
        ))}
      </div>

      {/* TXT token input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 · Paste your TXT verification token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Open <strong>Cloud → Emails → Manage Domains</strong>, copy the value of the TXT record (starts with{" "}
            <span className="font-mono">lovable_verify=</span>) and paste it here. The wizard will fill in the rest.
          </p>
          <div className="space-y-2">
            <Label htmlFor="txt-token">TXT value</Label>
            <Input
              id="txt-token"
              value={txtToken}
              onChange={(e) => setTxtToken(e.target.value.trim())}
              placeholder="lovable_verify=…"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 · Add these 3 records at your registrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.map((rec) => {
            const isChecked = !!checked[rec.id];
            const disabled = rec.id === "txt" && !txtToken;
            return (
              <div
                key={rec.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isChecked ? "border-green-300 bg-green-50/60" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => !disabled && toggleChecked(rec.id)}
                    disabled={disabled}
                    aria-label="Mark added"
                    className={`mt-1 h-6 w-6 shrink-0 rounded-md border flex items-center justify-center ${
                      isChecked
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-input bg-background hover:border-primary"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isChecked && <Check className="h-4 w-4" />}
                  </button>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_auto] gap-3 items-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</div>
                      <div className="font-mono text-sm font-semibold">{rec.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Host / Name</div>
                      <div className="font-mono text-sm break-all">{rec.host}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</div>
                      <div className="font-mono text-sm break-all">{rec.value}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(rec.host, "host")}
                      >
                        <Copy className="h-3.5 w-3.5" /> Host
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        onClick={() => handleCopy(rec.value, "value")}
                      >
                        <Copy className="h-3.5 w-3.5" /> Value
                      </Button>
                    </div>
                  </div>
                </div>
                {rec.note && (
                  <div className="mt-2 pl-9 text-xs text-muted-foreground">{rec.note}</div>
                )}
              </div>
            );
          })}

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              Some registrars auto-append the root domain to the Host field. If yours does, use{" "}
              <span className="font-mono">{SUBDOMAIN}</span> instead of{" "}
              <span className="font-mono">{SUBDOMAIN}.{rootDomain}</span>. Use the Copy buttons to avoid typos.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrar hints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need help finding the DNS panel?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {REGISTRARS.map((r) => {
            const open = openRegistrar === r.name;
            return (
              <div key={r.name} className="rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenRegistrar(open ? null : r.name)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40"
                >
                  <span>{r.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <ol className="px-10 py-3 list-decimal space-y-1 text-sm text-muted-foreground bg-muted/30">
                    {r.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Verify */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Step 3 · Verify
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Once all 3 records are added, click below to open Lovable Cloud and run verification. DNS propagation usually
            completes within minutes (up to 72 hours).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!allChecked}
              onClick={() => window.open("https://dnschecker.org/#NS/" + encodeURIComponent(`${SUBDOMAIN}.${rootDomain}`), "_blank")}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4" /> Check NS propagation
            </Button>
            <Button
              type="button"
              disabled={!allChecked}
              onClick={() => window.open("https://dnschecker.org/#TXT/" + encodeURIComponent(`_lovable_email_verify.${SUBDOMAIN}.${rootDomain}`), "_blank")}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4" /> Check TXT propagation
            </Button>
          </div>
          {!allChecked && (
            <p className="text-xs text-muted-foreground">
              Tick each record above once you've added it to enable the verify buttons.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
