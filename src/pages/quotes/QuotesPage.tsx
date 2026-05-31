import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { CreateQuoteDialog } from "@/components/quotes/CreateQuoteDialog";

type Scope = "admin" | "instructor";

interface QuoteRow {
  id: string;
  quote_ref: string;
  instructor_id: string;
  pupil_name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  course_type: string | null;
  total_hours: number | null;
  price: number;
  price_pence: number;
  deposit_amount: number | null;
  deposit_pence: number;
  status: string;
  token: string;
  expires_at: string | null;
  valid_until: string | null;
  accepted_at: string | null;
  created_at: string;
  instructor?: { id: string; name: string | null } | null;
}

const STATUS_OPTIONS = ["all", "draft", "sent", "viewed", "accepted", "declined", "expired", "cancelled"];

function fmtMoney(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((pence || 0) / 100);
}

function statusTone(s: string) {
  if (s === "accepted") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  if (s === "sent" || s === "viewed") return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  if (s === "draft") return "bg-amber-500/10 text-amber-700 border-amber-500/30";
  return "bg-muted text-muted-foreground border-muted";
}

export default function QuotesPage({ scope }: { scope: Scope }) {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const { instructor } = useInstructorAuth();
  const instructorId = (instructor as any)?.id ?? null;

  const backHref = scope === "admin" ? "/admin" : "/instructor";
  const backLabel = scope === "admin" ? "Admin" : "Portal";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const sel =
        scope === "admin"
          ? `*, instructor:instructors!quotes_instructor_id_fkey(id,name)`
          : `*`;
      const { data, error: err } = await supabase
        .from("quotes")
        .select(sel)
        .order("created_at", { ascending: false })
        .limit(500);
      if (err) throw err;
      setRows((data as unknown as QuoteRow[]) || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load quotes");
      toast.error(e?.message || "Failed to load quotes");
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
      if (!q) return true;
      return (
        r.pupil_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.postcode?.toLowerCase().includes(q) ||
        r.course_type?.toLowerCase().includes(q) ||
        r.instructor?.name?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  const totals = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let pendingValue = 0;
    let acceptedValue = 0;
    for (const r of filtered) {
      if (r.status === "accepted") {
        accepted += 1;
        acceptedValue += Number(r.price_pence) || 0;
      } else if (["draft", "sent", "viewed"].includes(r.status)) {
        pending += 1;
        pendingValue += Number(r.price_pence) || 0;
      }
    }
    return { count: filtered.length, pending, accepted, pendingValue, acceptedValue };
  }, [filtered]);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/quote/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Quote link copied");
  };

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
            <h1 className="text-2xl font-bold">Quotes</h1>
            <span className="text-xs text-muted-foreground">
              {scope === "admin" ? "All instructors" : "Your quotes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreateQuoteDialog scope={scope} instructorId={instructorId} onCreated={load} />
            <Button onClick={load} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Quotes" value={totals.count.toString()} />
          <SummaryCard label="Pending" value={totals.pending.toString()} tone="amber" />
          <SummaryCard label="Accepted value" value={fmtMoney(totals.acceptedValue)} tone="green" />
          <SummaryCard label="Pending value" value={fmtMoney(totals.pendingValue)} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">Quotes</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, instructor…"
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
                        {s === "all" ? "All statuses" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                No quotes yet. Use "New quote" to send one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Pupil</th>
                      {scope === "admin" && (
                        <th className="py-2 pr-3 font-medium">Instructor</th>
                      )}
                      <th className="py-2 pr-3 font-medium">Course</th>
                      <th className="py-2 pr-3 font-medium text-right">Hours</th>
                      <th className="py-2 pr-3 font-medium text-right">Price</th>
                      <th className="py-2 pr-3 font-medium">Expires</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const detailHref = scope === "admin" ? `/admin/quotes/${r.id}` : `/instructor/quotes/${r.id}`;
                      return (
                      <tr
                        key={r.id}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => { window.location.href = detailHref; }}
                      >
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                          <div>{format(new Date(r.created_at), "d MMM yyyy")}</div>
                          <div className="opacity-70">{r.quote_ref}</div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{r.pupil_name}</div>
                          {(r.email || r.phone) && (
                            <div className="text-xs text-muted-foreground">
                              {r.email || r.phone}
                            </div>
                          )}
                        </td>
                        {scope === "admin" && (
                          <td className="py-2 pr-3 text-xs">
                            {r.instructor?.name || r.instructor_id.slice(0, 8)}
                          </td>
                        )}
                        <td className="py-2 pr-3 text-muted-foreground">
                          {r.course_type || "—"}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">
                          {r.total_hours ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                          {fmtMoney(r.price_pence || Math.round((Number(r.price) || 0) * 100))}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground">
                          {(r.valid_until || r.expires_at) ? format(new Date((r.valid_until || r.expires_at)!), "d MMM") : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className={statusTone(r.status)}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Copy quote link"
                              onClick={() => copyLink(r.token)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button asChild variant="ghost" size="sm" title="Open quote page">
                              <a
                                href={`/quote/${r.token}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
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
