import { useState, useEffect } from "react";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parse } from "date-fns";
import { toast } from "sonner";

interface StepBookNextProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  durationMinutes: number;
  onBooked: () => void;
  onSkip: () => void;
}

interface AvailableSlot {
  date: string;
  startTime: string;
  label: string;
}

export function StepBookNext({
  pupilId,
  pupilName,
  instructorId,
  durationMinutes,
  onBooked,
  onSkip,
}: StepBookNextProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    findAvailableSlots();
  }, []);

  const findAvailableSlots = async () => {
    try {
      // Fetch instructor preferences + buffer
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("prefer_earliest_slot, buffer_minutes")
        .eq("id", instructorId)
        .single();
      const preferEarliest = (instructorData as any)?.prefer_earliest_slot ?? false;
      const bufferMinutes = (instructorData as any)?.buffer_minutes ?? 0;

      // Look at next 7 days for gaps in the schedule
      const found: AvailableSlot[] = [];
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const weekLaterStr = format(addDays(today, 7), "yyyy-MM-dd");

      // Fetch calendar events for the 7-day window
      const { data: calendarEvents } = await supabase
        .from("instructor_calendar_events")
        .select("start_time, end_time")
        .eq("instructor_id", instructorId)
        .eq("is_busy", true)
        .gte("end_time", `${todayStr}T00:00:00`)
        .lte("start_time", `${weekLaterStr}T23:59:59`);

      const bufferMs = bufferMinutes * 60000;

      for (let d = 1; d <= 7 && found.length < 3; d++) {
        const date = addDays(today, d);
        const dateStr = format(date, "yyyy-MM-dd");

        const { data: existing } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", dateStr)
          .neq("status", "cancelled")
          .order("start_time");

        // Parse calendar busy times for this day (ignoring all-day events)
        const dayCalBusy = (calendarEvents || [])
          .map(ev => ({ start: new Date(ev.start_time), end: new Date(ev.end_time) }))
          .filter(ev => {
            if (ev.end.getTime() - ev.start.getTime() >= 24 * 60 * 60 * 1000) return false;
            return format(ev.start, "yyyy-MM-dd") === dateStr;
          });

        const candidateTimes = preferEarliest 
          ? ["09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "13:00:00", "15:00:00"]
          : ["09:00:00", "11:00:00", "13:00:00", "15:00:00"];

        for (const ct of candidateTimes) {
          if (found.length >= 3) break;
          const candidateStart = parse(ct, "HH:mm:ss", date).getTime();
          const candidateEnd = candidateStart + durationMinutes * 60000;

          // Check conflicts with existing lessons using flat buffer
          const lessonConflict = (existing || []).some((ex) => {
            const exStart = parse(ex.start_time, "HH:mm:ss", date).getTime();
            const exEnd = exStart + (ex.duration_minutes || 60) * 60000;
            return candidateStart < (exEnd + bufferMs) && candidateEnd > (exStart - bufferMs);
          });

          // Check calendar conflicts with flat buffer
          const calConflict = dayCalBusy.some(ev =>
            candidateStart < (ev.end.getTime() + bufferMs) && candidateEnd > (ev.start.getTime() - bufferMs)
          );

          if (!lessonConflict && !calConflict) {
            found.push({
              date: dateStr,
              startTime: ct,
              label: `${format(date, "EEE d MMM")} at ${format(parse(ct, "HH:mm:ss", date), "h:mma")}`,
            });
          }
        }
      }

      setSlots(found);
    } catch (e) {
      console.error("Error finding slots:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slot: AvailableSlot) => {
    setBooking(slot.label);
    try {
      const { error } = await supabase.from("scheduled_lessons").insert({
        instructor_id: instructorId,
        pupil_id: pupilId,
        lesson_date: slot.date,
        start_time: slot.startTime,
        duration_minutes: durationMinutes,
        status: "scheduled",
        lesson_type: "Standard",
      });

      if (error) throw error;
      toast.success(`Booked ${pupilName} for ${slot.label}`);
      onBooked();
    } catch (e) {
      console.error(e);
      toast.error("Failed to book lesson");
    } finally {
      setBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No available slots found in the next 7 days
        </p>
      ) : (
        slots.map((slot) => (
          <button
            key={slot.label}
            onClick={() => handleBook(slot)}
            disabled={!!booking}
            className="w-full flex items-center gap-3 p-3 rounded-none bg-muted/50 hover:bg-muted transition-colors text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">{slot.label}</span>
              <span className="text-xs text-muted-foreground">{durationMinutes} min lesson</span>
            </div>
            {booking === slot.label ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs font-medium text-primary">Book</span>
            )}
          </button>
        ))
      )}

      <Button variant="ghost" size="sm" onClick={onSkip} className="w-full">
        Skip — don't book now
      </Button>
    </div>
  );
}
