import { useCallback, useEffect, useMemo, useState } from "react";
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
  CalendarPlus,
  CalendarClock,
  CalendarX,
  Eye,
  Loader2,
  RefreshCw,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  instructorId: string;
  onSynced?: () => void;
}

type ChangeKind = "create" | "update" | "delete";

interface PendingItem {
  queueId: string;
  lessonId: string;
  kind: ChangeKind;
  pupilName: string;
  lessonDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  pickupLocation: string | null;
}

const KIND_META: Record<ChangeKind, { label: string; icon: typeof CalendarPlus; tone: string }> = {
  create: { label: "Create", icon: CalendarPlus, tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  update: { label: "Update", icon: CalendarClock, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  delete: { label: "Delete", icon: CalendarX, tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

function formatWhen(date: string | null, time: string | null) {
  if (!date) return "—";
  try {
    const iso = time ? `${date}T${time}` : date;
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return `${date} ${time ?? ""}`.trim();
  }
}

export function CalendarSyncPreview({ instructorId, onSynced }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<PendingItem[]>([]);

  const load = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const { data: queue, error } = await supabase
        .from("calendar_sync_queue")
        .select("id, lesson_id, action, created_at")
        .eq("instructor_id", instructorId)
        .is("processed_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const lessonIds = Array.from(new Set((queue ?? []).map((q) => q.lesson_id).filter(Boolean)));
      let lessonsById = new Map<string, any>();
      if (lessonIds.length) {
        const { data: lessons, error: lErr } = await supabase
          .from("scheduled_lessons")
          .select(
            "id, lesson_date, start_time, duration_minutes, status, google_event_id, pickup_location, pupils(name)"
          )
          .in("id", lessonIds);
        if (lErr) throw lErr;
        lessonsById = new Map((lessons ?? []).map((l: any) => [l.id, l]));
      }

      const built: PendingItem[] = (queue ?? []).map((q: any) => {
        const lesson = lessonsById.get(q.lesson_id);
        const hasEvent = !!lesson?.google_event_id;
        const cancelled = lesson?.status === "cancelled";

        let kind: ChangeKind = "create";
        if (q.action === "deleteLesson" || (cancelled && hasEvent)) {
          kind = "delete";
        } else if (hasEvent) {
          kind = "update";
        } else {
          kind = "create";
        }

        return {
          queueId: q.id,
          lessonId: q.lesson_id,
          kind,
          pupilName: lesson?.pupils?.name ?? "Unknown pupil",
          lessonDate: lesson?.lesson_date ?? null,
          startTime: lesson?.start_time ?? null,
          durationMinutes: lesson?.duration_minutes ?? null,
          pickupLocation: lesson?.pickup_location ?? null,
        };
      });

      setItems(built);
    } catch (err) {
      console.error("CalendarSyncPreview load error:", err);
      toast.error("Failed to load sync preview");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const grouped = useMemo(() => {
    return {
      create: items.filter((i) => i.kind === "create"),
      update: items.filter((i) => i.kind === "update"),
      delete: items.filter((i) => i.kind === "delete"),
    };
  }, [items]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const [outgoing, incoming] = await Promise.allSettled([
        supabase.functions.invoke("process-calendar-queue", { body: { instructorId } }),
        supabase.functions.invoke("google-calendar-service", {
          body: { action: "fetchExternalEvents", instructorId },
        }),
      ]);
      if (outgoing.status === "rejected") console.error(outgoing.reason);
      if (incoming.status === "rejected") console.error(incoming.reason);
      toast.success("Sync triggered");
      onSynced?.();
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  const renderGroup = (kind: ChangeKind, list: PendingItem[]) => {
    if (!list.length) return null;
    const meta = KIND_META[kind];
    const Icon = meta.icon;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${meta.tone} gap-1`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{list.length} lesson{list.length === 1 ? "" : "s"}</span>
        </div>
        <div className="rounded-xl border divide-y">
          {list.map((i) => (
            <div key={i.queueId} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{i.pupilName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatWhen(i.lessonDate, i.startTime)}
                  {i.durationMinutes ? ` · ${i.durationMinutes} min` : ""}
                </div>
                {i.pickupLocation && (
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{i.pickupLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pending calendar changes</DialogTitle>
          <DialogDescription>
            Lessons queued to be created, updated, or deleted on your Google Calendar at the next sync.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              Nothing pending — your calendar is up to date.
            </div>
          ) : (
            <div className="space-y-4">
              {renderGroup("create", grouped.create)}
              {renderGroup("update", grouped.update)}
              {renderGroup("delete", grouped.delete)}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading || syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing || loading || items.length === 0}
          >
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CalendarSyncPreview;
