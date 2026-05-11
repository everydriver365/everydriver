import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AuditRow = {
  id: string;
  instructor_id: string | null;
  domain: string;
  event: string;
  actor_role: string;
  actor_user_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const eventColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  added: "outline",
  queued: "outline",
  verified: "default",
  ssl_added: "default",
  skipped: "secondary",
  reopened: "outline",
  unverified: "destructive",
  removed: "destructive",
};

export function CustomDomainAuditLog({ domain }: { domain?: string }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("custom_domain_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (domain) q = q.eq("domain", domain);
      const { data, error } = await q;
      if (!error) setRows((data as any) || []);
      setLoading(false);
    })();
  }, [domain, limit]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Audit log {domain ? `· ${domain}` : "· all domains"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-muted-foreground">No events recorded yet.</p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant={eventColor[r.event] || "outline"}>{r.event}</Badge>
                <span className="font-medium">{r.domain}</span>
                <span className="text-xs text-muted-foreground">by {r.actor_role}</span>
              </div>
              {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <div className="text-xs text-muted-foreground font-mono">
                  {JSON.stringify(r.metadata)}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(r.created_at).toLocaleString()}
            </div>
          </div>
        ))}
        {!loading && rows.length >= limit && (
          <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + 50)}>
            Load more
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
