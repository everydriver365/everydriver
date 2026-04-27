import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import hotspots from "@/data/query-hotspots.json";

interface Hotspot { file: string; from_calls: number; rpc_calls: number; total: number; }
interface Report { generated_at: string; total_files_with_supabase_calls: number; total_call_sites: number; top_50: Hotspot[]; }

export default function QueryBudget() {
  const data = hotspots as Report;
  const top10 = data.top_50.slice(0, 10);
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Database Query Budget</h1>
        <p className="text-muted-foreground">
          Static scan of `supabase.from()` and `supabase.rpc()` call sites. Top components are N+1 candidates.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Run <code>deno run --allow-read --allow-write scripts/scan-supabase-calls.ts</code> to refresh.
          In dev, a runtime tracker also warns when a route mount exceeds 8 queries / 2s
          (inspect via <code>window.__queryBudget()</code>).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{data.total_files_with_supabase_calls}</div><div className="text-xs text-muted-foreground">Files with queries</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{data.total_call_sites}</div><div className="text-xs text-muted-foreground">Total call sites</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{top10[0]?.total ?? 0}</div><div className="text-xs text-muted-foreground">Worst offender</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top 10 hotspots</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {top10.map((h) => (
              <div key={h.file} className="flex items-center justify-between border rounded-lg p-3">
                <div className="font-mono text-xs truncate">{h.file}</div>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">from: {h.from_calls}</Badge>
                  {h.rpc_calls > 0 && <Badge variant="outline">rpc: {h.rpc_calls}</Badge>}
                  <Badge variant={h.total >= 10 ? "destructive" : "secondary"}>{h.total}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Generated: {new Date(data.generated_at).toLocaleString()}</p>
    </div>
  );
}
