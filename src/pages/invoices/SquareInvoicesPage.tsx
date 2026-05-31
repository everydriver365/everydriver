import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { toast } from "@/hooks/use-toast";
import { generateInvoicePdf } from "@/lib/invoices/generateInvoicePdf";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";

type Scope = "admin" | "instructor";

interface InvoiceRow {
  id: string;
  issuer_type: "instructor" | "school";
  issuer_instructor_id: string | null;
  recipient_pupil_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  square_invoice_id: string | null;
  public_url: string | null;
  status: string;
  amount_cents: number;
  service_fee_cents: number;
  currency: string;
  due_date: string | null;
  description: string | null;
  sent_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  last_event_at: string | null;
  created_at: string;
  instructor?: { id: string; name: string | null } | null;
  pupil?: { id: string; name: string | null } | null;
}

const STATUS_OPTIONS = [
  "all",
  "draft",
  "sent",
  "unpaid",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
  "failed",
];

function fmtMoney(cents: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format((cents || 0) / 100);
}

export default function SquareInvoicesPage({ scope }: { scope: Scope }) {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [issuerFilter, setIssuerFilter] = useState<"all" | "instructor" | "school">("all");

  const backHref = scope === "admin" ? "/admin" : "/instructor";
  const backLabel = scope === "admin" ? "Admin" : "Portal";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("square_invoices")
        .select(
          `*,
           instructor:instructors!square_invoices_issuer_instructor_id_fkey(id,name),
           pupil:pupils!square_invoices_recipient_pupil_id_fkey(id,name)`
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (err) throw err;
      setRows((data as unknown as InvoiceRow[]) || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load invoices");
      toast({ title: "Failed to load invoices", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (scope === "admin" && issuerFilter !== "all" && r.issuer_type !== issuerFilter) return false;
      if (!q) return true;
      return (
        r.recipient_name?.toLowerCase().includes(q) ||
        r.recipient_email?.toLowerCase().includes(q) ||
        r.pupil?.name?.toLowerCase().includes(q) ||
        r.instructor?.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.square_invoice_id?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, issuerFilter, scope]);

  const totals = useMemo(() => {
    let count = filtered.length;
    let outstanding = 0;
    let paid = 0;
    let fees = 0;
    for (const r of filtered) {
      if (["paid"].includes(r.status)) paid += r.amount_cents;
      else if (!["cancelled", "canceled", "refunded", "failed", "draft"].includes(r.status))
        outstanding += r.amount_cents;
      fees += r.service_fee_cents || 0;
    }
    return { count, outstanding, paid, fees };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={backHref}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Square Invoices</h1>
            <span className="text-xs text-muted-foreground">
              {scope === "admin" ? "All issuers" : "Your invoices"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreateInvoiceDialog scope={scope} onCreated={load} />
            <Button onClick={load} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Invoices" value={totals.count.toString()} />
          <SummaryCard label="Outstanding" value={fmtMoney(totals.outstanding)} tone="amber" />
          <SummaryCard label="Paid" value={fmtMoney(totals.paid)} tone="green" />
          <SummaryCard label="Service fees" value={fmtMoney(totals.fees)} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Invoices</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pupil, instructor, ref…"
                    className="pl-8 h-9 w-64"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "all" ? "All statuses" : s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scope === "admin" && (
                  <Select value={issuerFilter} onValueChange={(v) => setIssuerFilter(v as any)}>
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All issuers</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="school">School / Platform</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-sm text-destructive py-6 text-center">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground py-10 text-center">
                No invoices to show.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Recipient</th>
                      {scope === "admin" && (
                        <th className="py-2 pr-3 font-medium">Issuer</th>
                      )}
                      <th className="py-2 pr-3 font-medium">Description</th>
                      <th className="py-2 pr-3 font-medium text-right">Amount</th>
                      {scope === "admin" && (
                        <th className="py-2 pr-3 font-medium text-right">Fee</th>
                      )}
                      <th className="py-2 pr-3 font-medium">Due</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "d MMM yyyy")}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">
                            {r.pupil?.name || r.recipient_name || "—"}
                          </div>
                          {r.recipient_email && (
                            <div className="text-xs text-muted-foreground">
                              {r.recipient_email}
                            </div>
                          )}
                        </td>
                        {scope === "admin" && (
                          <td className="py-2 pr-3">
                            {r.issuer_type === "school" ? (
                              <span className="text-xs">School / Platform</span>
                            ) : (
                              <span className="text-xs">
                                {r.instructor?.name || "Instructor"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-2 pr-3 max-w-[260px] truncate text-muted-foreground">
                          {r.description || "—"}
                        </td>
                        <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                          {fmtMoney(r.amount_cents, r.currency)}
                        </td>
                        {scope === "admin" && (
                          <td className="py-2 pr-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                            {r.service_fee_cents
                              ? fmtMoney(r.service_fee_cents, r.currency)
                              : "—"}
                          </td>
                        )}
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                          {r.due_date ? format(new Date(r.due_date), "d MMM") : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <InvoiceStatusBadge status={r.status} />
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Download PDF"
                              onClick={() => {
                                try {
                                  generateInvoicePdf(r);
                                } catch (e: any) {
                                  toast({
                                    title: "Couldn't generate PDF",
                                    description: e?.message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            {r.public_url && (
                              <Button asChild variant="ghost" size="sm" title="Open Square invoice">
                                <a href={r.public_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "green";
}) {
  const color =
    tone === "amber"
      ? "text-amber-600"
      : tone === "green"
      ? "text-green-600"
      : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
