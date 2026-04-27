import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface FunctionStat {
  function_name: string;
  total: number;
  errors_4xx: number;
  errors_5xx: number;
  error_rate: number;
  last_error_at: string | null;
  last_error_status: number | null;
}

interface ApiResponse {
  source: "analytics" | "unavailable";
  note?: string;
  unhealthy_count: number;
  unhealthy: FunctionStat[];
  all: FunctionStat[];
}

export default function EdgeFunctionErrors() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: resp, error: err } = await supabase.functions.invoke("edge-function-error-stats");
    if (err) setError(err.message);
    else setData(resp as ApiResponse);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edge Function Errors (24h)</h1>
          <p className="text-muted-foreground">Functions exceeding 5% error rate with ≥10 calls.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/edge-function-audit">
              <ExternalLink className="h-4 w-4 mr-1" /> Audit & retire
            </Link>
          </Button>
          <Button onClick={load} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data?.source === "unavailable" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Live analytics unavailable. {data.note ?? ""} Create a `analytics_function_error_stats(p_hours int)`
            RPC that returns aggregated counts from your logging pipeline to populate this view.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Unhealthy functions ({data?.unhealthy_count ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.unhealthy?.length ? (
            <p className="text-sm text-muted-foreground">No functions exceeding the threshold.</p>
          ) : (
            <div className="space-y-2">
              {data.unhealthy.map((s) => (
                <div key={s.function_name} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-mono text-sm font-semibold">{s.function_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.total} calls · {s.errors_4xx} 4xx · {s.errors_5xx} 5xx
                      {s.last_error_at && ` · last: ${new Date(s.last_error_at).toLocaleString()}`}
                    </div>
                  </div>
                  <Badge variant={s.errors_5xx > 0 ? "destructive" : "secondary"}>
                    {(s.error_rate * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
