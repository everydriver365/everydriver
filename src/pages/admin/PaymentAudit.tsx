import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface AuditResult {
  generated_at: string;
  window_days: number;
  summary: {
    total_payments_30d: number;
    orphan_payments: number;
    non_canonical_methods: number;
    duplicate_refs: number;
    digital_missing_platform_fee: number;
    orphan_refunds: number;
  };
  orphan_payments: any[];
  non_canonical_methods: any[];
  duplicate_refs: { external_payment_ref: string; count: number; ids: string[] }[];
  digital_missing_platform_fee: any[];
  orphan_refunds: any[];
  method_distribution: Record<string, number>;
}

export default function PaymentAudit() {
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke("payment-audit");
      if (err) throw err;
      setData(result as AuditResult);
    } catch (e: any) {
      setError(e?.message || "Failed to run audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, []);

  const SummaryCard = ({ label, value, ok }: { label: string; value: number; ok: boolean }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
          {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${ok ? "text-foreground" : "text-amber-600"}`}>{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Admin</Link>
            </Button>
            <h1 className="text-2xl font-bold">Payment Audit</h1>
            {data && <span className="text-xs text-muted-foreground">last 30 days · generated {format(new Date(data.generated_at), "HH:mm:ss")}</span>}
          </div>
          <Button onClick={run} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Re-run
          </Button>
        </div>

        {error && (
          <Card className="border-destructive"><CardContent className="pt-6 text-sm text-destructive">{error}</CardContent></Card>
        )}

        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard label="Total payments" value={data.summary.total_payments_30d} ok />
              <SummaryCard label="Orphan (no instructor)" value={data.summary.orphan_payments} ok={data.summary.orphan_payments === 0} />
              <SummaryCard label="Non-canonical methods" value={data.summary.non_canonical_methods} ok={data.summary.non_canonical_methods === 0} />
              <SummaryCard label="Duplicate refs" value={data.summary.duplicate_refs} ok={data.summary.duplicate_refs === 0} />
              <SummaryCard label="Missing platform fee" value={data.summary.digital_missing_platform_fee} ok={data.summary.digital_missing_platform_fee === 0} />
              <SummaryCard label="Orphan refunds" value={data.summary.orphan_refunds} ok={data.summary.orphan_refunds === 0} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Method distribution (last 30 days)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.method_distribution).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                    <Badge key={method} variant="secondary" className="text-xs">
                      {method}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {data.orphan_payments.length > 0 && (
              <IssueTable
                title="Payments without an instructor_id"
                hint="Platform fee trigger silently skips these. Backfill the instructor_id from the linked pupil."
                rows={data.orphan_payments}
                cols={[
                  { k: "recorded_at", label: "Date", fmt: (v) => format(new Date(v), "dd MMM HH:mm") },
                  { k: "payment_method", label: "Method" },
                  { k: "amount", label: "Amount", fmt: (v) => `£${Number(v).toFixed(2)}` },
                  { k: "pupil_id", label: "Pupil ID", fmt: (v) => (v || "—").slice(0, 8) },
                  { k: "notes", label: "Notes" },
                ]}
              />
            )}

            {data.non_canonical_methods.length > 0 && (
              <IssueTable
                title="Non-canonical payment_method values"
                hint="These bypass the validation trigger somehow — investigate the writing edge function."
                rows={data.non_canonical_methods}
                cols={[
                  { k: "recorded_at", label: "Date", fmt: (v) => format(new Date(v), "dd MMM HH:mm") },
                  { k: "payment_method", label: "Method" },
                  { k: "amount", label: "Amount", fmt: (v) => `£${Number(v).toFixed(2)}` },
                ]}
              />
            )}

            {data.duplicate_refs.length > 0 && (
              <IssueTable
                title="Duplicate external_payment_ref"
                hint="Should be impossible (partial unique index). If present, the index is missing — re-run migration."
                rows={data.duplicate_refs}
                cols={[
                  { k: "external_payment_ref", label: "Ref" },
                  { k: "count", label: "Count" },
                  { k: "ids", label: "Payment IDs", fmt: (v: string[]) => v.join(", ") },
                ]}
              />
            )}

            {data.digital_missing_platform_fee.length > 0 && (
              <IssueTable
                title="Digital payments missing platform fee"
                hint="The record_platform_fee_for_payment trigger should have created a £1 fee. Check trigger is enabled."
                rows={data.digital_missing_platform_fee}
                cols={[
                  { k: "recorded_at", label: "Date", fmt: (v) => format(new Date(v), "dd MMM HH:mm") },
                  { k: "payment_method", label: "Method" },
                  { k: "amount", label: "Amount", fmt: (v) => `£${Number(v).toFixed(2)}` },
                  { k: "id", label: "Payment ID", fmt: (v) => v.slice(0, 8) },
                ]}
              />
            )}

            {data.orphan_refunds.length > 0 && (
              <IssueTable
                title="Square Refunds with no parent Square payment"
                hint="A refund was recorded for a pupil who has no Square charge — possibly a ref mismatch."
                rows={data.orphan_refunds}
                cols={[
                  { k: "recorded_at", label: "Date", fmt: (v) => format(new Date(v), "dd MMM HH:mm") },
                  { k: "amount", label: "Amount", fmt: (v) => `£${Number(v).toFixed(2)}` },
                  { k: "external_payment_ref", label: "Ref" },
                ]}
              />
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Related views</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/admin/platform-fees"><ExternalLink className="h-3 w-3 mr-1" /> Platform fees</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to="/admin/edge-function-errors"><ExternalLink className="h-3 w-3 mr-1" /> Edge function errors</Link></Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

interface ColDef { k: string; label: string; fmt?: (v: any) => string }
function IssueTable({ title, hint, rows, cols }: { title: string; hint: string; rows: any[]; cols: ColDef[] }) {
  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> {title}
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b">
              <tr>{cols.map((c) => <th key={c.k} className="text-left py-2 pr-3 font-medium">{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {cols.map((c) => (
                    <td key={c.k} className="py-1.5 pr-3">{c.fmt ? c.fmt(r[c.k]) : (r[c.k] ?? "—")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && <p className="text-xs text-muted-foreground mt-2">Showing first 50 of {rows.length}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
