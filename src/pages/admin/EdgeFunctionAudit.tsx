import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import manifest from "@/data/edge-functions.json";

type Recommendation =
  | "keep"
  | "investigate"
  | "retire-safe"
  | "retire-with-cron-cleanup";

interface FunctionUsage {
  name: string;
  has_config_block: boolean;
  cron_jobs: { jobid: number; jobname: string | null; schedule: string }[];
  cross_function_refs: string[];
  recommendation: Recommendation;
  reason: string;
  /** Filled client-side from a "client code references" search */
  client_refs?: number;
  final_recommendation?: Recommendation;
  final_reason?: string;
}

interface AuditReport {
  generated_at: string;
  total_functions: number;
  total_cron_jobs: number;
  orphaned_cron_jobs: {
    jobid: number;
    jobname: string | null;
    referenced_function: string;
    schedule: string;
    suggested_sql: string;
  }[];
  per_function: FunctionUsage[];
  retirement_plan: {
    safe_to_delete: string[];
    needs_review: string[];
    cron_cleanup_sql: string[];
  };
}

const RECO_STYLES: Record<Recommendation, string> = {
  keep: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  investigate:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "retire-safe":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "retire-with-cron-cleanup":
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export default function EdgeFunctionAudit() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("");

  const runAudit = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke<AuditReport>(
        "audit-edge-functions",
        { body: { functions: manifest.functions } },
      );
      if (error) throw error;
      if (!data) throw new Error("Empty audit response");
      setReport(data);
      toast.success("Audit complete");
    } catch (err) {
      toast.error(`Audit failed: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isAdmin) runAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const enriched = useMemo(() => {
    if (!report) return [];
    // Final recommendation logic (cron + reason fields are server-side;
    // client-side code-reference scanning is a future enhancement and currently
    // surfaced as the "needs_review" bucket).
    return report.per_function.map<FunctionUsage>((f) => {
      let final_recommendation = f.recommendation;
      let final_reason = f.reason;
      if (f.recommendation === "investigate" && !f.has_config_block) {
        final_reason +=
          " Tip: search src/ in your IDE for `" +
          f.name +
          "` to confirm before deleting.";
      }
      return { ...f, final_recommendation, final_reason };
    });
  }, [report]);

  const filtered = enriched.filter((f) =>
    f.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const counts = useMemo(() => {
    const c: Record<Recommendation, number> = {
      keep: 0,
      investigate: 0,
      "retire-safe": 0,
      "retire-with-cron-cleanup": 0,
    };
    for (const f of enriched) c[f.final_recommendation ?? f.recommendation]++;
    return c;
  }, [enriched]);

  if (authLoading)
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edge Function Audit</h1>
          <p className="text-sm text-muted-foreground">
            Cross-references {manifest.functions.length} deployed functions
            against active cron jobs to find dead code and orphaned schedules.
          </p>
        </div>
        <Button onClick={runAudit} disabled={running}>
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Re-run audit
            </>
          )}
        </Button>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total functions" value={report.total_functions} />
            <StatCard label="Cron jobs" value={report.total_cron_jobs} />
            <StatCard
              label="Orphaned cron"
              value={report.orphaned_cron_jobs.length}
              danger={report.orphaned_cron_jobs.length > 0}
            />
            <StatCard
              label="Needs review"
              value={counts.investigate}
              danger={counts.investigate > 0}
            />
          </div>

          {report.orphaned_cron_jobs.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Orphaned cron jobs ({report.orphaned_cron_jobs.length})
                </CardTitle>
                <CardDescription>
                  These cron jobs are calling edge functions that no longer
                  exist. They generate failed requests every tick. Run the SQL
                  below to clean them up.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.orphaned_cron_jobs.map((o) => (
                  <div
                    key={o.jobid}
                    className="rounded-lg border p-3 bg-destructive/5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="font-mono">job {o.jobid}</span>{" "}
                        <span className="text-muted-foreground">
                          ({o.jobname ?? "unnamed"})
                        </span>{" "}
                        →{" "}
                        <span className="font-mono text-destructive">
                          {o.referenced_function}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {o.schedule}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted/60 rounded px-2 py-1 overflow-x-auto">
                        {o.suggested_sql}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copy(o.suggested_sql)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    copy(
                      report.orphaned_cron_jobs
                        .map((o) => o.suggested_sql)
                        .join("\n"),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Copy all unschedule SQL
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Per-function status</CardTitle>
                <CardDescription>
                  Generated {new Date(report.generated_at).toLocaleString()}.
                  &quot;Investigate&quot; means no cron call — confirm with a
                  client-code search before retiring.
                </CardDescription>
              </div>
              <Input
                placeholder="Filter by name…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="sm:w-64"
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b text-muted-foreground">
                      <th className="py-2 pr-3">Function</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Cron</th>
                      <th className="py-2 pr-3">Config</th>
                      <th className="py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f) => (
                      <tr key={f.name} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs">
                          {f.name}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge
                            className={
                              RECO_STYLES[
                                f.final_recommendation ?? f.recommendation
                              ]
                            }
                          >
                            {f.final_recommendation ?? f.recommendation}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          {f.cron_jobs.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              {f.cron_jobs
                                .map((c) => `#${c.jobid}`)
                                .join(", ")}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              none
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {f.has_config_block ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {f.final_reason ?? f.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retirement plan</CardTitle>
              <CardDescription>
                {counts.investigate} function(s) flagged for review. Search
                each in your IDE — if no client/server references exist, delete
                the folder under <code>supabase/functions/</code> and remove
                its <code>config.toml</code> block.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {report.retirement_plan.needs_review.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {name}
                  </Badge>
                ))}
                {report.retirement_plan.needs_review.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nothing to review — all functions are scheduled or known.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div
          className={`text-2xl font-bold ${danger ? "text-destructive" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
