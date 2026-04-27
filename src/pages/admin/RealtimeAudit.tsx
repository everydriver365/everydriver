import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import audit from "@/data/realtime-audit.json";

interface Hit { file: string; line: number; snippet: string; }
interface Report {
  generated_at: string;
  allowlist: string[];
  total_sites: number;
  allowed_count: number;
  violator_count: number;
  allowed: Hit[];
  violators: Hit[];
}

export default function RealtimeAudit() {
  const data = audit as Report;
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Realtime Subscription Audit</h1>
        <p className="text-muted-foreground">
          Verifies all `supabase.channel()` calls go through useRealtimeHub or are explicitly allowlisted.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{data.total_sites}</div><div className="text-xs text-muted-foreground">Total channel sites</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{data.allowed_count}</div><div className="text-xs text-muted-foreground">Allowlisted</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className={`text-2xl font-bold ${data.violator_count > 0 ? "text-destructive" : "text-green-600"}`}>{data.violator_count}</div><div className="text-xs text-muted-foreground">Violators</div></CardContent></Card>
      </div>

      {data.violator_count > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {data.violator_count} per-component channel(s) found. Consolidate into useRealtimeHub for 4k-user scale.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Violators</CardTitle></CardHeader>
        <CardContent>
          {data.violators.length === 0 ? (
            <p className="text-sm text-muted-foreground">None — every channel goes through the hub or allowlist.</p>
          ) : (
            <div className="space-y-2">
              {data.violators.map((v, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="font-mono text-xs">{v.file}:{v.line}</div>
                  <code className="text-xs text-muted-foreground">{v.snippet}</code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Allowlisted</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.allowed.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono">{a.file}:{a.line}</span>
                <Badge variant="secondary">OK</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Generated: {new Date(data.generated_at).toLocaleString()}</p>
    </div>
  );
}
