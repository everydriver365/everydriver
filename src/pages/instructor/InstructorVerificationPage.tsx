import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { VerifiedProBadge } from "@/components/instructor/VerifiedProBadge";
import {
  CredentialType,
  CREDENTIAL_LABELS,
  CREDENTIAL_ORDER,
  InstructorVerification,
  useMyVerifications,
} from "@/hooks/useMyVerifications";

const STATUS_META: Record<string, { label: string; icon: any; cls: string }> = {
  verified: { label: "Verified", icon: BadgeCheck, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Under review", icon: Clock3, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected: { label: "Needs changes", icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200" },
  expired: { label: "Expired", icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

function StatusPill({ status }: { status?: string }) {
  const meta = STATUS_META[status ?? ""] ?? null;
  if (!meta) {
    return (
      <Badge variant="outline" className="text-xs font-medium">
        Not submitted
      </Badge>
    );
  }
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function CredentialRow({
  type,
  record,
  onSubmit,
  uploading,
}: {
  type: CredentialType;
  record?: InstructorVerification;
  onSubmit: (payload: {
    credential_type: CredentialType;
    value?: string | null;
    document_url?: string | null;
    expires_at?: string | null;
  }) => Promise<void>;
  uploading: boolean;
}) {
  const [value, setValue] = useState(record?.value ?? "");
  const [expiresAt, setExpiresAt] = useState(record?.expires_at ?? "");
  const [docUrl, setDocUrl] = useState(record?.document_url ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const path = `${u.user.id}/${type}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("instructor-credentials")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      setDocUrl(path);
      toast.success("Document uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit({
        credential_type: type,
        value: value || null,
        document_url: docUrl || null,
        expires_at: expiresAt || null,
      });
      toast.success("Sent for verification");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  const locked = record?.status === "verified" || record?.status === "pending";

  return (
    <div className="rounded-xl border border-border p-4 bg-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{CREDENTIAL_LABELS[type]}</h3>
          {record?.admin_notes && (
            <p className="text-xs text-muted-foreground mt-1">{record.admin_notes}</p>
          )}
        </div>
        <StatusPill status={record?.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Reference / number</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. ADI 123456"
            disabled={locked}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Expires</Label>
          <Input
            type="date"
            value={expiresAt ?? ""}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={locked}
            className="h-9"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={locked || busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1.5" />
          {docUrl ? "Replace document" : "Upload document"}
        </Button>
        {docUrl && <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{docUrl.split("/").pop()}</span>}
      </div>

      {!locked && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={submit} disabled={busy || uploading}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            {record ? "Resubmit" : "Send for verification"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function InstructorVerificationPage() {
  const { instructor } = useInstructorAuth();
  const { data: records = [], isLoading, upsert } = useMyVerifications(instructor?.id);
  const [badgeEnabled, setBadgeEnabled] = useState<boolean | null>(null);

  const byType = new Map<string, InstructorVerification>();
  for (const r of records) byType.set(r.credential_type, r);

  // Load badge_enabled flag
  if (badgeEnabled === null && instructor?.id) {
    supabase
      .from("instructors")
      .select("verified_pro_badge_enabled")
      .eq("id", instructor.id)
      .single()
      .then(({ data }) => setBadgeEnabled(data?.verified_pro_badge_enabled ?? true));
  }

  const toggleBadge = async (next: boolean) => {
    setBadgeEnabled(next);
    if (!instructor?.id) return;
    const { error } = await supabase
      .from("instructors")
      .update({ verified_pro_badge_enabled: next })
      .eq("id", instructor.id);
    if (error) toast.error("Couldn't update badge visibility");
    else toast.success(next ? "Badge shown on your site" : "Badge hidden");
  };

  return (
    <InstructorPortalLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/instructor/settings" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Settings
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 grid place-items-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Verified Pro</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Prove your credentials and earn a verified badge on your mini-website. Pupils trust verified instructors and convert at higher rates.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted/30 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Show "Verified Pro" badge publicly</p>
                <p className="text-xs text-muted-foreground">Displays on your mini-website hero when you have at least one verified credential.</p>
              </div>
              <Switch checked={badgeEnabled ?? true} onCheckedChange={toggleBadge} />
            </div>

            {instructor?.id && (
              <div className="rounded-xl bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Preview</p>
                <VerifiedProBadge instructorId={instructor.id} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              CREDENTIAL_ORDER.map((type) => (
                <CredentialRow
                  key={type}
                  type={type}
                  record={byType.get(type)}
                  uploading={upsert.isPending}
                  onSubmit={async (p) => {
                    await upsert.mutateAsync(p);
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          Our team typically reviews submissions within 1–2 working days. We'll email you when each credential is approved.
        </p>
      </div>
    </InstructorPortalLayout>
  );
}
