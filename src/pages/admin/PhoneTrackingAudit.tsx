import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, MapPin, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow, parseISO, subDays } from "date-fns";

interface Row {
  id: string;
  instructor_id: string;
  pupil_id: string | null;
  event_type: "permission_changed" | "tracking_started" | "tracking_stopped";
  status: string | null;
  details: any;
  user_agent: string | null;
  created_at: string;
}

type Range = "today" | "7d" | "30d" | "all";
type EventFilter = "all" | Row["event_type"];

const EVENT_LABEL: Record<Row["event_type"], string> = {
  permission_changed: "Permission",
  tracking_started: "Started",
  tracking_stopped: "Stopped",
};

const EVENT_COLOR: Record<Row["event_type"], string> = {
  permission_changed: "bg-amber-100 text-amber-900",
  tracking_started: "bg-emerald-100 text-emerald-900",
  tracking_stopped: "bg-red-100 text-red-900",
};

export default function PhoneTrackingAudit() {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [search, setSearch] = useState("");
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});

  const sinceIso = useMemo(() => {
    if (range === "all") return null;
    const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
    return subDays(new Date(), days).toISOString();
  }, [range]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("phone_tracking_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (sinceIso) q = q.gte("created_at", sinceIso);
    if (eventFilter !== "all") q = q.eq("event_type", eventFilter);
    const { data } = await q;
    const list = (data || []) as Row[];
    setRows(list);

    // Resolve instructor names in one go
    const ids = Array.from(new Set(list.map((r) => r.instructor_id)));
    if (ids.length) {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (instructors || []).forEach((i: any) => { map[i.id] = i.name; });
      setInstructorNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sinceIso, eventFilter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (instructorNames[r.instructor_id] || "").toLowerCase().includes(s) ||
      r.instructor_id.toLowerCase().includes(s) ||
      (r.pupil_id || "").toLowerCase().includes(s) ||
      (r.status || "").toLowerCase().includes(s),
    );
  }, [rows, search, instructorNames]);

  if (adminLoading) {
    return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  }
  if (!isAdmin) {
    return <div className="p-8">Admin access required.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" /> Phone tracking audit
        </h1>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Permission changes and start/stop events for instructor phone GPS tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as EventFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="permission_changed">Permission changed</SelectItem>
              <SelectItem value="tracking_started">Tracking started</SelectItem>
              <SelectItem value="tracking_stopped">Tracking stopped</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search instructor / pupil / status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:col-span-1"
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} event{filtered.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events for this filter.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div key={r.id} className="py-3 grid grid-cols-12 gap-2 items-center text-sm">
                  <div className="col-span-3">
                    <div className="font-medium">{instructorNames[r.instructor_id] || "Unknown instructor"}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{r.instructor_id.slice(0, 8)}…</div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={EVENT_COLOR[r.event_type]}>{EVENT_LABEL[r.event_type]}</Badge>
                  </div>
                  <div className="col-span-2 text-xs">
                    {r.status && <Badge variant="outline">{r.status}</Badge>}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground font-mono truncate">
                    {r.pupil_id ? r.pupil_id.slice(0, 8) + "…" : "—"}
                  </div>
                  <div className="col-span-3 text-xs text-muted-foreground text-right">
                    <div>{format(parseISO(r.created_at), "d MMM HH:mm:ss")}</div>
                    <div>{formatDistanceToNow(parseISO(r.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
