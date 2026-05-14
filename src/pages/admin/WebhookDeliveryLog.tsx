import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface LogRow {
  id: string;
  provider: string;
  event_id: string | null;
  event_type: string | null;
  received_at: string;
  processed: boolean;
  response_status: number | null;
  error: string | null;
  signature_valid: boolean | null;
}

interface ProviderStat {
  provider: string;
  total_24h: number;
  errors_24h: number;
  last_received: string | null;
}

export default function WebhookDeliveryLog() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<ProviderStat[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: recent } = await supabase
      .from("webhook_delivery_log" as any)
      .select("id, provider, event_id, event_type, received_at, processed, response_status, error, signature_valid")
      .order("received_at", { ascending: false })
      .limit(200);
    const { data: window24 } = await supabase
      .from("webhook_delivery_log" as any)
      .select("provider, processed, received_at")
      .gte("received_at", since);

    const map = new Map<string, ProviderStat>();
    (window24 || []).forEach((r: any) => {
      const s = map.get(r.provider) || { provider: r.provider, total_24h: 0, errors_24h: 0, last_received: null };
      s.total_24h++;
      if (!r.processed) s.errors_24h++;
      if (!s.last_received || r.received_at > s.last_received) s.last_received = r.received_at;
      map.set(r.provider, s);
    });
    setStats(Array.from(map.values()).sort((a, b) => b.total_24h - a.total_24h));
    setRows((recent as any) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Delivery Log</h1>
          <p className="text-sm text-muted-foreground">Last 24h success rate per payment provider, plus the 200 most recent deliveries.</p>
        </div>
        <Button onClick={load} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.length === 0 && !loading && (
          <Card><CardContent className="py-6 text-sm text-muted-foreground">No webhooks received in the last 24h.</CardContent></Card>
        )}
        {stats.map((s) => {
          const successRate = s.total_24h ? ((s.total_24h - s.errors_24h) / s.total_24h) * 100 : 100;
          return (
            <Card key={s.provider}>
              <CardHeader className="pb-2"><CardTitle className="text-base capitalize">{s.provider}</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">24h calls</span><span className="font-medium">{s.total_24h}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Failures</span><span className={s.errors_24h ? "text-destructive font-medium" : "font-medium"}>{s.errors_24h}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Success rate</span>
                  <Badge variant={successRate >= 99 ? "default" : successRate >= 90 ? "secondary" : "destructive"}>{successRate.toFixed(1)}%</Badge>
                </div>
                <div className="text-xs text-muted-foreground pt-1">Last: {s.last_received ? new Date(s.last_received).toLocaleString() : "—"}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent deliveries</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Sig</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{new Date(r.received_at).toLocaleString()}</td>
                    <td className="px-3 py-2 capitalize">{r.provider}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.event_type || "—"}</td>
                    <td className="px-3 py-2">{r.signature_valid === null ? "—" : r.signature_valid ? "✓" : "✗"}</td>
                    <td className="px-3 py-2">
                      {r.processed
                        ? <Badge variant="default">OK {r.response_status ?? ""}</Badge>
                        : <Badge variant="destructive">Failed {r.response_status ?? ""}</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-destructive max-w-[280px] truncate" title={r.error || ""}>{r.error || ""}</td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No deliveries logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
