import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, addWeeks, format } from "date-fns";
import { CalendarIcon, CheckCircle2, AlertTriangle, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  checkReservationCapacity,
  describeBindingConstraint,
  TIME_WINDOW_RANGES,
  type CapacityResult,
  type TimeWindowKey,
} from "@/lib/courseReservation/capacityCheck";
import { loadCourseAvailabilitySources } from "@/lib/courseAvailability";

interface Props {
  instructorId: string;
  courseId: string;
  courseHours: number;
  /** Pre-loaded instructor row (must include id + booking config fields). */
  instructor: any;
  /** Max hours-per-week cap from instructor_booking_settings, or null for no cap. */
  maxHoursPerWeekCap: number | null;
  pupilId: string;
  onReserved?: (reservationId: string) => void;
}

const DAYS = [
  { idx: 1, short: "Mon" },
  { idx: 2, short: "Tue" },
  { idx: 3, short: "Wed" },
  { idx: 4, short: "Thu" },
  { idx: 5, short: "Fri" },
  { idx: 6, short: "Sat" },
  { idx: 0, short: "Sun" },
];

const TIME_WINDOW_KEYS: TimeWindowKey[] = ["morning", "afternoon", "evening"];

export function StartDateOnlyBookingPanel({
  instructorId,
  courseId,
  courseHours,
  instructor,
  maxHoursPerWeekCap,
  pupilId,
  onReserved,
}: Props) {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(addDays(today, 7));
  const [completionWeeks, setCompletionWeeks] = useState<number>(Math.max(2, Math.ceil(courseHours / 5)));
  const [allowedDays, setAllowedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeWindows, setTimeWindows] = useState<TimeWindowKey[]>(["morning", "afternoon"]);
  const cappedDefault = maxHoursPerWeekCap ? Math.min(8, maxHoursPerWeekCap) : 8;
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(cappedDefault);
  const [notes, setNotes] = useState("");

  const maxSlider = maxHoursPerWeekCap ?? 40;

  // Pull availability sources for the candidate window so capacity check runs live.
  const windowEnd = useMemo(() => addWeeks(startDate, completionWeeks), [startDate, completionWeeks]);

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["reservation-availability-sources", instructorId, format(startDate, "yyyy-MM-dd"), completionWeeks],
    queryFn: () => loadCourseAvailabilitySources(supabase as any, [instructorId], startDate, windowEnd),
    enabled: !!instructorId,
  });

  const capacity: CapacityResult | null = useMemo(() => {
    if (!sources || !instructor) return null;
    if (allowedDays.length === 0 || timeWindows.length === 0) {
      return { ok: false, hoursAvailable: 0, hoursRequired: courseHours, shortfallHours: courseHours, mostBinding: allowedDays.length === 0 ? "days" : "time_windows" };
    }
    return checkReservationCapacity(
      instructor,
      {
        startDate,
        completionWeeks,
        allowedDays,
        timeWindows,
        hoursPerWeekCap: hoursPerWeek,
        totalHours: courseHours,
      },
      sources,
    );
  }, [sources, instructor, startDate, completionWeeks, allowedDays, timeWindows, hoursPerWeek, courseHours]);

  const reserveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-course-reservation", {
        body: {
          instructor_id: instructorId,
          course_id: courseId,
          pupil_id: pupilId,
          start_date: format(startDate, "yyyy-MM-dd"),
          completion_window_weeks: completionWeeks,
          allowed_days: allowedDays,
          time_windows: timeWindows,
          hours_per_week_cap: hoursPerWeek,
          total_hours: courseHours,
          pupil_notes: notes || null,
        },
      });
      if (error) throw error;
      return data as { reservation_id: string };
    },
    onSuccess: (data) => {
      toast({ title: "Reservation created", description: "Your instructor will be in touch to confirm exact lesson times." });
      onReserved?.(data.reservation_id);
    },
    onError: (err: any) => {
      toast({ title: "Couldn't reserve", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const toggleDay = (d: number) => setAllowedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const toggleWindow = (w: TimeWindowKey) => setTimeWindows((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));

  const canReserve = capacity?.ok === true && !reserveMutation.isPending;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-bold text-foreground">Reserve start date only</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pick when you want to start and your usual availability. You and your instructor will agree exact lesson times together once your reservation is confirmed.
        </p>
      </div>

      {/* Start date */}
      <div className="space-y-2">
        <Label>Start date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(startDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => d && setStartDate(d)}
              disabled={(d) => d < addDays(today, 0)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Completion window */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Finish within</Label>
          <span className="text-sm font-semibold">{completionWeeks} {completionWeeks === 1 ? "week" : "weeks"} of start date</span>
        </div>
        <Slider min={1} max={26} step={1} value={[completionWeeks]} onValueChange={([v]) => setCompletionWeeks(v)} />
      </div>

      {/* Allowed days */}
      <div className="space-y-2">
        <Label>Days you can do lessons</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = allowedDays.includes(d.idx);
            return (
              <button
                key={d.idx}
                type="button"
                onClick={() => toggleDay(d.idx)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                  on ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time windows */}
      <div className="space-y-2">
        <Label>Times of day that suit you</Label>
        <div className="flex flex-wrap gap-2">
          {TIME_WINDOW_KEYS.map((w) => {
            const on = timeWindows.includes(w);
            return (
              <button
                key={w}
                type="button"
                onClick={() => toggleWindow(w)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors",
                  on ? "bg-foreground text-background border-foreground" : "bg-background border-border hover:border-foreground/40"
                )}
              >
                {TIME_WINDOW_RANGES[w].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hours per week */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Hours per week</Label>
          <span className="text-sm font-semibold">
            Up to {hoursPerWeek}h / week{maxHoursPerWeekCap ? ` (instructor cap ${maxHoursPerWeekCap}h)` : ""}
          </span>
        </div>
        <Slider min={1} max={maxSlider} step={1} value={[hoursPerWeek]} onValueChange={([v]) => setHoursPerWeek(v)} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Anything else your instructor should know? (optional)</Label>
        <Textarea
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. I'm at work 9–5 on Mondays so prefer early evenings."
        />
      </div>

      {/* Capacity banner */}
      <CapacityBanner loading={sourcesLoading} capacity={capacity} />

      {/* CTA */}
      <Button
        type="button"
        className="w-full"
        disabled={!canReserve}
        onClick={() => reserveMutation.mutate()}
      >
        {reserveMutation.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reserving…</>
        ) : (
          <><Lock className="h-4 w-4 mr-2" /> Reserve start date</>
        )}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        Your reservation is confirmed only once payment is taken. You'll arrange exact lesson times directly with your instructor afterwards.
      </p>
    </div>
  );
}

function CapacityBanner({ loading, capacity }: { loading: boolean; capacity: CapacityResult | null }) {
  if (loading || !capacity) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your instructor's availability…
      </div>
    );
  }

  if (capacity.ok) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold">Your instructor has time to complete this course.</div>
          <div className="text-xs mt-0.5">
            About {capacity.hoursAvailable.toFixed(1)}h available across your selected window — enough for the {capacity.hoursRequired}h course.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-semibold">
          Only {capacity.hoursAvailable.toFixed(1)}h of {capacity.hoursRequired}h fit in your selection.
        </div>
        <div className="text-xs mt-0.5">{describeBindingConstraint(capacity.mostBinding)}</div>
      </div>
    </div>
  );
}
