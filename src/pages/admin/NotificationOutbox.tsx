import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Inbox, Loader2, RotateCw, ChevronDown, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow, parseISO, subDays, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

type Range = "today" | "7d" | "30d" | "all";
type Status = "all" | "pending" | "sent";

interface OutboxRow {
  id: string;
  instructor_id: string;
  category: string;
  importance: string;
  title: string | null;
  body: string | null;
  payload: any;
  deliver_at: string;
  sent_at: string | null;
  created_at: string;
}

interface InstructorMini {
  id: string;
  name: string | null;
}

const CATEGORIES = ["all", "lesson", "message", "job", "system", "test_swap"] as const;

export default function NotificationOutbox() {
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [instructors, setInstructors] = useState<Record<string, InstructorMini>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replaying, setReplaying] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!(user && isAdmin)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("notification_outbox")
        .select("id, instructor_id, category, importance, title, body, payload, deliver_at, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (range !== "all") {
        const since =
          range === "today"
            ? startOfDay(new Date())
            : range === "7d"
              ? subDays(new Date(), 7)
              : subDays(new Date(), 30);
        q = q.gte("created_at", since.toISOString());
      }
      if (status === "pending") q = q.is("sent_at", null);
      if (status === "sent") q = q.not("sent_at", "is", null);
      if (category !== "all") q = q.eq("category", category);

      const { data, error } = await q;
      if (cancelled) return;
      if (error) {
        console.error("outbox fetch error", error);
        setRows([]);
        setLoading(false);
        return;
      }
      const outboxRows = (data as OutboxRow[]) ?? [];
      setRows(outboxRows);

      const ids = Array.from(new Set(outboxRows.map((r) => r.instructor_id)));
      if (ids.length > 0) {
        const { data: insRows } = await supabase
          .from("instructors")
          .select("id, name")
          .in("id", ids);
        const map: Record<string, InstructorMini> = {};
        for (const i of (insRows ?? []) as InstructorMini[]) map[i.id] = i;
        if (!cancelled) setInstructors(map);
      } else {
        setInstructors({});
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, range, status, category, reloadKey]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (instructorFilter !== "all" && r.instructor_id !== instructorFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          r.title ?? "",
          r.body ?? "",
          instructors[r.instructor_id]?.name ?? "",
          JSON.stringify(r.payload ?? {}),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, instructorFilter, search, instructors]);

  const stats = useMemo(() => {
    let pending = 0;
    let sent = 0;
    let overdue = 0;
    const nowMs = Date.now();
    for (const r of rows) {
      if (r.sent_at) sent++;
      else {
        pending++;
        if (new Date(r.deliver_at).getTime() < nowMs) overdue++;
      }
    }
    return { pending, sent, overdue };
  }, [rows]);

  const instructorOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: InstructorMini[] = [];
    for (const r of rows) {
      if (seen.has(r.instructor_id)) continue;
      seen.add(r.instructor_id);
      opts.push(
        instructors[r.instructor_id] ?? { id: r.instructor_id, name: r.instructor_id.slice(0, 8) },
      );
    }
    return opts.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [rows, instructors]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const replay = async (row: OutboxRow) => {
    setReplaying((s) => new Set(s).add(row.id));
    try {
      const kind = (row.payload as any)?.kind ?? "outbox";
      if (kind === "daily_summary") {
        // Trigger the daily summary generator; it is idempotent per day.
        await supabase.functions.invoke("send-daily-summary", {
          body: { instructor_id: row.instructor_id, force: true },
        });
      } else {
        // Reset the row so the digest cron picks it up immediately.
        const { error: upErr } = await supabase
          .from("notification_outbox")
          .update({ sent_at: null, deliver_at: new Date().toISOString() })
          .eq("id", row.id);
        if (upErr) throw upErr;
        await supabase.functions.invoke("process-notification-digest", { body: { force: true } });
      }
      toast({ title: "Replay queued", description: "The notification has been re-sent." });
      setReloadKey((k) => k + 1);
    } catch (e) {
      console.error("replay failed", e);
      toast({
        title: "Replay failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setReplaying((s) => {
        const next = new Set(s);
        next.delete(row.id);
        return next;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!(user && isAdmin)) return <Navigate to="/admin/login" replace />;

  return (
    <div className="container mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" /> Notification Outbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Deferred (hourly/daily) and daily-summary notifications, with replay.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-semibold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Sent</div>
            <div className="text-2xl font-semibold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Overdue (pending past deliver_at)</div>
            <div className={`text-2xl font-semibold ${stats.overdue > 0 ? "text-destructive" : ""}`}>
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            {filtered.length} {filtered.length === 1 ? "row" : "rows"} shown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setRange(r)}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All"}
              </Button>
            ))}
            <span className="mx-2 h-6 w-px bg-border" />
            {(["all", "pending", "sent"] as Status[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
              >
                {s[0].toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={instructorFilter} onValueChange={setInstructorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All instructors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instructors</SelectItem>
                {instructorOptions.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name ?? i.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search title, body, payload…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No outbox rows match these filters.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((r) => {
                const isOpen = expanded.has(r.id);
                const insName = instructors[r.instructor_id]?.name ?? r.instructor_id.slice(0, 8);
                const isSent = !!r.sent_at;
                const isOverdue = !isSent && new Date(r.deliver_at).getTime() < Date.now();
                const kind = (r.payload as any)?.kind;
                return (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className="flex flex-1 min-w-0 items-start gap-2 text-left"
                        onClick={() => toggleExpand(r.id)}
                      >
                        {isOpen ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {r.title ?? "(no title)"}
                          </div>
                          {r.body && (
                            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {r.body}
                            </div>
                          )}
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {insName}
                            <span className="mx-1.5">·</span>
                            <span title={format(parseISO(r.deliver_at), "PPpp")}>
                              deliver {formatDistanceToNow(parseISO(r.deliver_at), { addSuffix: true })}
                            </span>
                            {isSent && (
                              <>
                                <span className="mx-1.5">·</span>
                                <span title={format(parseISO(r.sent_at!), "PPpp")}>
                                  sent {formatDistanceToNow(parseISO(r.sent_at!), { addSuffix: true })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                          {kind === "daily_summary" && (
                            <Badge variant="secondary" className="text-[10px]">summary</Badge>
                          )}
                          {kind && kind !== "daily_summary" && (
                            <Badge variant="secondary" className="text-[10px]">{kind}</Badge>
                          )}
                          {r.importance === "important" && (
                            <Badge className="text-[10px]">important</Badge>
                          )}
                          {isSent ? (
                            <Badge variant="secondary" className="text-[10px]">sent</Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive" className="text-[10px]">overdue</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">pending</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => replay(r)}
                          disabled={replaying.has(r.id)}
                        >
                          {replaying.has(r.id) ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCw className="mr-1 h-3 w-3" />
                          )}
                          Replay
                        </Button>
                      </div>
                    </div>
                    {isOpen && (
                      <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted/50 p-2 text-[11px]">
{JSON.stringify(
  { id: r.id, payload: r.payload, created_at: r.created_at, deliver_at: r.deliver_at, sent_at: r.sent_at },
  null,
  2,
)}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
