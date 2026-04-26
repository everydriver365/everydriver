import { useState } from "react";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";
import { CalendarIcon, Loader2, RefreshCw, Plus, Minus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGoogleServiceCalendar } from "@/hooks/useGoogleServiceCalendar";

interface DiffItem {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
}

interface DiffResult {
  range: { from: string; to: string };
  counts: { added: number; removed: number; unchanged: number };
  added: DiffItem[];
  removed: DiffItem[];
}

interface Props {
  instructorId: string;
}

const formatRow = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function CalendarResyncRangePanel({ instructorId }: Props) {
  const today = new Date();
  const [from, setFrom] = useState<Date>(addDays(today, -7));
  const [to, setTo] = useState<Date>(addDays(today, 30));
  const [result, setResult] = useState<DiffResult | null>(null);

  const { resyncRange, isSyncing } = useGoogleServiceCalendar(instructorId);
  const queryClient = useQueryClient();

  const applyPreset = (preset: "last7" | "next30" | "month") => {
    const now = new Date();
    if (preset === "last7") {
      setFrom(addDays(now, -7));
      setTo(now);
    } else if (preset === "next30") {
      setFrom(now);
      setTo(addDays(now, 30));
    } else {
      setFrom(startOfMonth(now));
      setTo(endOfMonth(now));
    }
  };

  const handleResync = async () => {
    if (from >= to) return;
    const data = await resyncRange(from, to);
    if (data) {
      setResult(data as DiffResult);
      // Refresh dependent lesson/calendar data
      queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["tomorrow-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-calendar-events"] });
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Re-sync a date range</h4>
          <p className="text-xs text-muted-foreground">
            Manually re-pull a window from Google Calendar and see what changed.
          </p>
        </div>
      </div>

      {/* Date pickers */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("w-[150px] justify-start text-left font-normal")}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {format(from, "d MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={(d) => d && setFrom(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("w-[150px] justify-start text-left font-normal")}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {format(to, "d MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={(d) => d && setTo(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button size="sm" onClick={handleResync} disabled={isSyncing || from >= to}>
          {isSyncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Re-sync this range
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => applyPreset("last7")}>
          Last 7 days
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => applyPreset("next30")}>
          Next 30 days
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => applyPreset("month")}>
          This month
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-2xl border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <Plus className="mr-1 h-3 w-3" />
                Added: {result.counts.added}
              </Badge>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <Minus className="mr-1 h-3 w-3" />
                Removed: {result.counts.removed}
              </Badge>
              <Badge variant="secondary">Unchanged: {result.counts.unchanged}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {result.added.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-green-700 dark:text-green-300">
                Added
              </div>
              <ul className="space-y-1">
                {result.added.map((ev) => (
                  <li
                    key={`a-${ev.id}`}
                    className="rounded-xl border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs dark:border-green-900/50 dark:bg-green-950/20"
                  >
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-muted-foreground">
                      {formatRow(ev.start)} – {formatRow(ev.end)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.removed.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">
                Removed
              </div>
              <ul className="space-y-1">
                {result.removed.map((ev) => (
                  <li
                    key={`r-${ev.id}`}
                    className="rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs line-through dark:border-red-900/50 dark:bg-red-950/20"
                  >
                    <div className="font-medium">{ev.title}</div>
                    <div className="text-muted-foreground no-underline">
                      {formatRow(ev.start)} – {formatRow(ev.end)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.added.length === 0 && result.removed.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nothing changed — your Google Calendar already matches.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
