import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarSearch,
  Loader2,
  RefreshCw,
  Ban,
  CalendarDays,
  Clock,
  Info,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface PreviewEvent {
  id: string;
  title: string;
  isAllDay: boolean;
  start: string;
  end: string;
  durationMinutes: number;
  wouldBlock: boolean;
  location: string | null;
  htmlLink: string | null;
  status: string;
}

interface Props {
  instructorId: string;
  onApplied?: () => void;
}

type Filter = "all" | "blocking" | "informational" | "all_day";

function fmt(iso: string, includeTime: boolean) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: includeTime ? "2-digit" : undefined,
      minute: includeTime ? "2-digit" : undefined,
    });
  } catch {
    return iso;
  }
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const days = Math.floor(h / 24);
  if (days >= 1) {
    const remH = h % 24;
    return remH ? `${days}d ${remH}h` : `${days}d`;
  }
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function CalendarImportPreview({ instructorId, onApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [events, setEvents] = useState<PreviewEvent[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "previewExternalEvents", instructorId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list = (data?.events ?? []) as PreviewEvent[];
      // Sort by start time ascending
      list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setEvents(list);
    } catch (err: any) {
      console.error("Preview load error:", err);
      toast.error(err?.message ?? "Failed to load preview");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && events === null) void load();
  };

  const stats = useMemo(() => {
    const list = events ?? [];
    return {
      total: list.length,
      blocking: list.filter((e) => e.wouldBlock).length,
      informational: list.filter((e) => !e.wouldBlock).length,
      allDay: list.filter((e) => e.isAllDay).length,
    };
  }, [events]);

  const filtered = useMemo(() => {
    const list = events ?? [];
    if (filter === "blocking") return list.filter((e) => e.wouldBlock);
    if (filter === "informational") return list.filter((e) => !e.wouldBlock);
    if (filter === "all_day") return list.filter((e) => e.isAllDay);
    return list;
  }, [events, filter]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "fetchExternalEvents", instructorId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Imported ${data?.synced ?? "events"} from Google Calendar`);
      onApplied?.();
      setOpen(false);
    } catch (err: any) {
      console.error("Apply import error:", err);
      toast.error(err?.message ?? "Failed to apply import");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarSearch className="mr-2 h-4 w-4" />
          Preview Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Google Calendar import</DialogTitle>
          <DialogDescription>
            See exactly what will be pulled in from your Google Calendar before it
            affects your availability. All-day events with no blocking keyword in
            the title (e.g. holiday, leave, sick, off) are imported as
            informational and will NOT block bookings.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatTile label="Total" value={stats.total} icon={<CalendarDays className="h-3.5 w-3.5" />} />
          <StatTile
            label="Will block"
            value={stats.blocking}
            tone="block"
            icon={<Ban className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="Informational"
            value={stats.informational}
            tone="info"
            icon={<Info className="h-3.5 w-3.5" />}
          />
          <StatTile
            label="All-day"
            value={stats.allDay}
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all" as Filter, label: `All (${stats.total})` },
            { id: "blocking" as Filter, label: `Blocking (${stats.blocking})` },
            { id: "informational" as Filter, label: `Informational (${stats.informational})` },
            { id: "all_day" as Filter, label: `All-day (${stats.allDay})` },
          ].map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={filter === t.id ? "default" : "outline"}
              onClick={() => setFilter(t.id)}
              className="h-7 px-2 text-xs"
            >
              {t.label}
            </Button>
          ))}
        </div>

        <ScrollArea className="max-h-[50vh] pr-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Fetching events from Google…
            </div>
          ) : !events || events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              No events found in the next 12 months.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nothing matches this filter.
            </div>
          ) : (
            <div className="rounded-xl border divide-y">
              {filtered.map((e) => (
                <div key={e.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium text-sm truncate">{e.title}</div>
                      {e.isAllDay ? (
                        <Badge variant="outline" className="text-[10px] py-0">All-day</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0">Timed</Badge>
                      )}
                      {e.wouldBlock ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 bg-rose-50 text-rose-700 border-rose-200"
                        >
                          <Ban className="h-2.5 w-2.5 mr-1" /> Will block
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 bg-sky-50 text-sky-700 border-sky-200"
                        >
                          <Info className="h-2.5 w-2.5 mr-1" /> Informational
                        </Badge>
                      )}
                      {e.status !== "confirmed" && (
                        <Badge variant="outline" className="text-[10px] py-0">{e.status}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fmt(e.start, !e.isAllDay)} → {fmt(e.end, !e.isAllDay)} · {formatDuration(e.durationMinutes)}
                    </div>
                    {e.location && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {e.location}
                      </div>
                    )}
                  </div>
                  {e.htmlLink && (
                    <a
                      href={e.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Open in Google Calendar"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading || applying}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={applying || loading || !events || events.length === 0}
          >
            {applying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Apply import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "block" | "info";
}) {
  const toneClass =
    tone === "block"
      ? "border-rose-200 bg-rose-50/50"
      : tone === "info"
        ? "border-sky-200 bg-sky-50/50"
        : "";
  return (
    <div className={`rounded-xl border p-2 ${toneClass}`}>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold mt-0.5">{value.toLocaleString()}</div>
    </div>
  );
}

export default CalendarImportPreview;
