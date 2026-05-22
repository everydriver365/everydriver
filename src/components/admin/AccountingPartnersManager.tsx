import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Platform = "xero" | "quickbooks" | "freeagent" | "sage";

interface AffiliateRow {
  platform: Platform;
  affiliate_url: string | null;
  is_active: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string }> = {
  xero:       { label: "Xero",       color: "#13B5EA", bg: "#E6F7FD" },
  quickbooks: { label: "QuickBooks", color: "#2CA01C", bg: "#E6F4E5" },
  freeagent:  { label: "FreeAgent",  color: "#4C7CF3", bg: "#E8EEFE" },
  sage:       { label: "Sage",       color: "#00DC00", bg: "#E5FAE5" },
};

const ORDER: Platform[] = ["xero", "quickbooks", "freeagent", "sage"];

export function AccountingPartnersManager() {
  const { user } = useAdminAuth();
  const [rows, setRows] = useState<Record<Platform, AffiliateRow>>(() =>
    Object.fromEntries(
      ORDER.map((p) => [p, { platform: p, affiliate_url: "", is_active: false, updated_at: null, updated_by: null }])
    ) as Record<Platform, AffiliateRow>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounting_affiliate_links")
      .select("platform,affiliate_url,is_active,updated_at,updated_by");
    if (error) {
      toast.error("Failed to load affiliate links");
      console.error(error);
    } else if (data) {
      setRows((prev) => {
        const next = { ...prev };
        for (const r of data as AffiliateRow[]) {
          if (ORDER.includes(r.platform)) next[r.platform] = { ...r, affiliate_url: r.affiliate_url ?? "" };
        }
        return next;
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (platform: Platform, patch: Partial<AffiliateRow>) => {
    setRows((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }));
  };

  const handleSave = async () => {
    // Validate URLs
    for (const p of ORDER) {
      const url = (rows[p].affiliate_url ?? "").trim();
      if (url && !url.startsWith("https://")) {
        toast.error(`${PLATFORM_META[p].label} URL must start with https://`);
        return;
      }
      if (rows[p].is_active && !url) {
        toast.error(`${PLATFORM_META[p].label} is active but has no URL`);
        return;
      }
    }
    setSaving(true);
    const payload = ORDER.map((p) => ({
      platform: p,
      affiliate_url: (rows[p].affiliate_url ?? "").trim() || null,
      is_active: rows[p].is_active,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("accounting_affiliate_links")
      .upsert(payload, { onConflict: "platform" });
    setSaving(false);
    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      toast.success("Affiliate links saved");
      load();
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Accounting Partners
          </CardTitle>
          <CardDescription>
            Configure affiliate signup URLs for accounting platforms. Instructors without
            an existing connection will see a "Sign up" prompt when the link is active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {ORDER.map((p) => {
                const row = rows[p];
                const meta = PLATFORM_META[p];
                return (
                  <div key={p} className="rounded-2xl border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center font-semibold text-sm"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{meta.label}</p>
                          {row.updated_at && (
                            <p className="text-xs text-muted-foreground">
                              Updated {format(new Date(row.updated_at), "dd MMM yyyy HH:mm")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={row.is_active ? "default" : "secondary"}>
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={row.is_active}
                          onCheckedChange={(v) => update(p, { is_active: v })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`https://...your ${meta.label} affiliate link`}
                        value={row.affiliate_url ?? ""}
                        onChange={(e) => update(p, { affiliate_url: e.target.value })}
                      />
                      {row.affiliate_url && row.affiliate_url.startsWith("https://") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Open link"
                        >
                          <a href={row.affiliate_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountingPartnersManager;
