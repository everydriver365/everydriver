import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Search, Sparkles, Loader2, Filter, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Centre { id: string; name: string }

interface SwapRow {
  id: string;
  first_name: string;
  current_centre_id: string | null;
  current_centre_name: string | null;
  current_test_date: string;
  current_test_time: string | null;
  earliest_new_date: string;
  latest_new_date: string;
  notes: string | null;
  created_at: string;
}

const ANY_CENTRE = "__any__";

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function TestSwapBrowse() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [centreId, setCentreId] = useState<string>(ANY_CENTRE);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [rows, setRows] = useState<SwapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSignupId, setSavedSignupId] = useState<string | null>(null);

  useEffect(() => {
    try { setSavedSignupId(localStorage.getItem("test_swap_signup_id")); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name")
        .order("name");
      setCentres((data as Centre[] | null) ?? []);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("browse_public_test_swaps", {
      p_centre_id: centreId === ANY_CENTRE ? null : centreId,
      p_from_date: fromDate || null,
      p_to_date: toDate || null,
      p_limit: 200,
    });
    if (!error) setRows((data as SwapRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const clearFilters = () => {
    setCentreId(ANY_CENTRE);
    setFromDate("");
    setToDate("");
  };

  const hasFilters = centreId !== ANY_CENTRE || !!fromDate || !!toDate;

  const grouped = useMemo(() => {
    const m = new Map<string, SwapRow[]>();
    for (const r of rows) {
      const key = r.current_centre_name ?? "Other";
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <MainLayout>
      <SEOHead
        title="Browse Available Driving Test Swaps | Drive365"
        description="Search the live pool of UK driving test slots up for swap. Filter by DVSA test centre and date range to find an earlier test."
      />

      <section className="py-10 md:py-14">
        <div className="container max-w-5xl">
          <Link
            to="/test-swap"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Test Swap
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1">Browse available swaps</h1>
              <p className="text-muted-foreground">
                Search the live pool of test slots learners are willing to swap. Filter by test centre and date if you can travel.
              </p>
            </div>
            {savedSignupId ? (
              <Button asChild variant="outline">
                <Link to={`/test-swap/matches/${savedSignupId}`}>My matches</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/test-swap/register">Register to swap</Link>
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-2xl border bg-card p-4 md:p-5 mt-6 mb-6">
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" /> Test centre
                </Label>
                <Select value={centreId} onValueChange={setCentreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any centre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_CENTRE}>Any centre</SelectItem>
                    {centres.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="from" className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">From</Label>
                <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to" className="text-xs uppercase tracking-wide text-muted-foreground mb-1 block">To</Label>
                <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={load} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
              {hasFilters && (
                <Button variant="ghost" onClick={() => { clearFilters(); setTimeout(load, 0); }} className="gap-2">
                  <X className="h-4 w-4" /> Clear filters
                </Button>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {loading ? "Searching…" : `${rows.length} swap${rows.length === 1 ? "" : "s"} available`}
              </span>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading swaps…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-semibold mb-2">No swaps match your search</h2>
              <p className="text-muted-foreground mb-5">
                Try widening your dates or removing the test centre filter. New swaps are added every day.
              </p>
              <Button asChild>
                <Link to="/test-swap/register">Register your own swap</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(([centre, list]) => (
                <div key={centre}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">{centre}</h2>
                    <Badge variant="secondary" className="text-xs">{list.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {list.map((r) => (
                      <div key={r.id} className="rounded-2xl border bg-card p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{fmtDate(r.current_test_date)}</span>
                          {r.current_test_time && (
                            <span className="text-sm text-muted-foreground">· {r.current_test_time.slice(0, 5)}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {r.first_name} wants a date between{" "}
                          <span className="text-foreground">{fmtDate(r.earliest_new_date)}</span> and{" "}
                          <span className="text-foreground">{fmtDate(r.latest_new_date)}</span>
                        </div>
                        {r.notes && (
                          <div className="text-xs italic mt-2 text-muted-foreground">"{r.notes}"</div>
                        )}
                        <div className="mt-3">
                          {savedSignupId ? (
                            <Button asChild size="sm" variant="outline" className="w-full">
                              <Link to={`/test-swap/matches/${savedSignupId}`}>View in my matches</Link>
                            </Button>
                          ) : (
                            <Button asChild size="sm" className="w-full">
                              <Link to="/test-swap/register">Register to request this swap</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
