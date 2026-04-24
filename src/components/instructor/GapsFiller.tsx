import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, MessageSquare, Percent, PoundSterling, Send, Clock, CheckCircle2, AlertCircle, Radio } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, parseISO, startOfDay, isAfter } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  selected: boolean;
}

interface GapsFillerProps {
  instructorId: string;
}

export function GapsFiller({ instructorId }: GapsFillerProps) {
  const [searchParams] = useSearchParams();
  const [instructorName, setInstructorName] = useState("");
  const [gaps, setGaps] = useState<GapSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [pupilCount, setPupilCount] = useState(0);
  const [pendingPreselectedSlotId, setPendingPreselectedSlotId] = useState<string | null>(null);

  // Optional feasibility-filtered pupil subset passed in via the `pupils` URL param
  // by `GapFillCard` after applying buffer + per-pupil travel time. When present we
  // ONLY text those pupils — never the full list.
  const targetedPupilIds = (() => {
    const raw = searchParams.get("pupils");
    if (!raw) return null;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return ids.length > 0 ? ids : null;
  })();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const previousGapsRef = useRef<string[]>([]);

  // Clear highlight after animation
  const triggerHighlight = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setHighlightedIds(new Set(ids));
    setTimeout(() => setHighlightedIds(new Set()), 1500);
  }, []);

  // Debounced refetch to prevent rapid updates
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAvailableGaps(true);
    }, 500);
  }, []);

  useEffect(() => {
    fetchInstructorData();
    fetchAvailableGaps();
    fetchPupilCount();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [instructorId]);

  useEffect(() => {
    const date = searchParams.get("date");
    const start = searchParams.get("start");
    setPendingPreselectedSlotId(date && start ? `${date}-${start}` : null);
  }, [searchParams]);

  // Use hub for all realtime subscriptions instead of individual channels
  const hubCallback = useCallback(() => debouncedRefetch(), [debouncedRefetch]);

  useRealtimeSubscription("scheduled_lessons", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_working_hours", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_date_overrides", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_manual_blocks", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("instructor_calendar_events", "*", hubCallback, {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });
  useRealtimeSubscription("pupils", "*", () => fetchPupilCount(), {
    filter: `instructor_id=eq.${instructorId}`,
    enabled: !!instructorId,
  });

  const fetchInstructorData = async () => {
    try {
      const { data } = await supabase
        .from("instructors")
        .select("name")
        .eq("id", instructorId)
        .single();
      
      if (data) setInstructorName(data.name);
    } catch (error) {
      console.error("Error fetching instructor:", error);
    }
  };

  const fetchPupilCount = async () => {
    try {
      let q = supabase
        .from("pupils")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .not("phone", "is", null);

      // If GapFillCard has narrowed the audience to those who fit the slot, count only those.
      if (targetedPupilIds && targetedPupilIds.length > 0) {
        q = q.in("id", targetedPupilIds);
      }

      const { count } = await q;
      setPupilCount(count || 0);
    } catch (error) {
      console.error("Error fetching pupil count:", error);
    }
  };

  const fetchAvailableGaps = async (isRealtime = false) => {
    if (!isRealtime) setLoading(true);
    try {
      // Get instructor's working hours
      const { data: workingHours } = await supabase
        .from("instructor_working_hours")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      // Get scheduled lessons for next 14 days
      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd");
      const todayISO = new Date().toISOString();
      const twoWeeksISO = addDays(new Date(), 14).toISOString();
      
      const { data: scheduledLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .lte("lesson_date", twoWeeksLater)
        .neq("status", "cancelled");

      // Get date overrides
      const { data: overrides } = await supabase
        .from("instructor_date_overrides")
        .select("*")
        .eq("instructor_id", instructorId)
        .gte("override_date", today);

      // Get manual blocks
      const { data: manualBlocks } = await supabase
        .from("instructor_manual_blocks")
        .select("start_datetime, end_datetime")
        .eq("instructor_id", instructorId)
        .gte("end_datetime", todayISO)
        .lte("start_datetime", twoWeeksISO);

      // Get synced calendar events (from Google Calendar, Nylas, etc.)
      const { data: calendarEvents } = await supabase
        .from("instructor_calendar_events")
        .select("start_time, end_time, is_busy")
        .eq("instructor_id", instructorId)
        .eq("is_busy", true)
        .gte("end_time", todayISO)
        .lte("start_time", twoWeeksISO);

      // Calculate gaps
      const calculatedGaps: GapSlot[] = [];
      
      const nowHour = new Date().getHours();
      const todayStr = format(new Date(), "yyyy-MM-dd");
      
      for (let i = 0; i < 14; i++) {
        const currentDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayOfWeek = currentDate.getDay();

        // Check if there's an override for this date
        const override = overrides?.find(o => o.override_date === dateStr);
        
        if (override && !override.is_available) {
          continue; // Instructor marked as unavailable
        }

        // Get working hours for this day
        const dayHours = workingHours?.find(wh => wh.day_of_week === dayOfWeek);
        
        if (!dayHours && !override?.is_available) {
          continue; // No working hours set for this day
        }

        const startHour = override?.start_time || dayHours?.start_time || "09:00";
        const endHour = override?.end_time || dayHours?.end_time || "17:00";

        // Get lessons for this day
        const dayLessons = scheduledLessons?.filter(l => l.lesson_date === dateStr) || [];

        // Get manual blocks for this day
        const dayBlocks = manualBlocks?.filter(b => {
          const blockStart = new Date(b.start_datetime);
          const blockEnd = new Date(b.end_datetime);
          return format(blockStart, "yyyy-MM-dd") === dateStr || format(blockEnd, "yyyy-MM-dd") === dateStr;
        }) || [];

        // Get external calendar events for this day
        const dayCalendarEvents = calendarEvents?.filter(e => {
          const eventStart = new Date(e.start_time);
          const eventEnd = new Date(e.end_time);
          return format(eventStart, "yyyy-MM-dd") === dateStr || format(eventEnd, "yyyy-MM-dd") === dateStr;
        }) || [];

        // Find gaps in the schedule (simplified: show 2-hour slots that are free)
        const workStart = parseInt(startHour.split(":")[0]);
        const workEnd = parseInt(endHour.split(":")[0]);

        for (let hour = workStart; hour + 2 <= workEnd; hour += 2) {
          // Skip past slots for today
          if (dateStr === todayStr && hour + 2 <= nowHour) continue;
          
          const slotStart = `${hour.toString().padStart(2, "0")}:00`;
          const slotEnd = `${(hour + 2).toString().padStart(2, "0")}:00`;
          const slotStartHour = hour;
          const slotEndHour = hour + 2;

          // Check if this slot overlaps with any scheduled lesson
          const hasLessonConflict = dayLessons.some(lesson => {
            const lessonStart = parseInt(lesson.start_time.split(":")[0]);
            const lessonEnd = lessonStart + Math.ceil(lesson.duration_minutes / 60);
            return (slotStartHour < lessonEnd && slotEndHour > lessonStart);
          });

          // Check if this slot overlaps with any manual block
          const hasBlockConflict = dayBlocks.some(block => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);
            const blockStartHour = blockStart.getHours() + blockStart.getMinutes() / 60;
            const blockEndHour = blockEnd.getHours() + blockEnd.getMinutes() / 60;
            
            // Check if block is on this specific date
            if (format(blockStart, "yyyy-MM-dd") === dateStr) {
              return (slotStartHour < blockEndHour && slotEndHour > blockStartHour);
            }
            return false;
          });

          // Check if this slot overlaps with any external calendar event
          // Ignore all-day events (00:00 to 23:59 or spanning multiple days) as they are informational
          const hasCalendarConflict = dayCalendarEvents.some(event => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);
            
            // Skip all-day / multi-day events (informational, not blocking)
            const eventStartHour = eventStart.getHours() + eventStart.getMinutes() / 60;
            const eventEndHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
            const isAllDay = (eventStartHour === 0 && (eventEndHour === 0 || eventEndHour >= 23.5));
            const isMultiDay = (eventEnd.getTime() - eventStart.getTime()) >= 24 * 60 * 60 * 1000;
            if (isAllDay || isMultiDay) return false;
            
            // Check if event is on this specific date
            if (format(eventStart, "yyyy-MM-dd") === dateStr) {
              return (slotStartHour < eventEndHour && slotEndHour > eventStartHour);
            }
            return false;
          });

          if (!hasLessonConflict && !hasBlockConflict && !hasCalendarConflict) {
            calculatedGaps.push({
              id: `${dateStr}-${slotStart}`,
              date: dateStr,
              startTime: slotStart,
              endTime: slotEnd,
              selected: false,
            });
          }
        }
      }

      const newGaps = calculatedGaps.slice(0, 20);
      const newGapIds = newGaps.map(g => g.id);
      const hydratedGaps = pendingPreselectedSlotId
        ? newGaps.map((gap) =>
            gap.id === pendingPreselectedSlotId ? { ...gap, selected: true } : gap
          )
        : newGaps;
      
      // Find new slots that weren't in the previous list
      if (isRealtime && previousGapsRef.current.length > 0) {
        const addedIds = newGapIds.filter(id => !previousGapsRef.current.includes(id));
        triggerHighlight(addedIds);
      }

      if (pendingPreselectedSlotId && newGapIds.includes(pendingPreselectedSlotId)) {
        triggerHighlight([pendingPreselectedSlotId]);
        setPendingPreselectedSlotId(null);
      }
      
      previousGapsRef.current = newGapIds;
      setGaps(hydratedGaps);
    } catch (error) {
      console.error("Error fetching gaps:", error);
      toast.error("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    setGaps(prev => prev.map(g => 
      g.id === slotId ? { ...g, selected: !g.selected } : g
    ));
  };

  const selectAll = () => {
    setGaps(prev => prev.map(g => ({ ...g, selected: true })));
  };

  const clearAll = () => {
    setGaps(prev => prev.map(g => ({ ...g, selected: false })));
  };

  const selectedSlots = gaps.filter(g => g.selected);

  const sendOffers = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one slot");
      return;
    }

    if (pupilCount === 0) {
      toast.error("No pupils with phone numbers to message");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gap-sms", {
        body: {
          instructorId,
          instructorName,
          slots: selectedSlots.map(s => ({
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          discountType: discountType === "none" ? null : discountType,
          discountValue: discountType === "none" ? null : discountValue,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Sent offers to ${data.sentCount} pupils!`);
        clearAll();
      } else {
        toast.error(data?.message || "Failed to send offers");
      }
    } catch (error) {
      console.error("Error sending offers:", error);
      toast.error("Failed to send SMS offers");
    } finally {
      setSending(false);
    }
  };

  const formatSlotDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "EEE d MMM");
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <InstructorCard>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-5 w-5 text-purple-500" />
          Fill Your Gaps
        </div>
        {isLive && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-600 gap-1">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Text all {pupilCount} pupils with phone numbers about available slots
      </p>
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : gaps.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No gaps found - you're fully booked!</p>
          </div>
        ) : (
          <>
            {/* Slot Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select slots to offer</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto touch-pan-y">
                {gaps.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSlot(slot.id);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      toggleSlot(slot.id);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all min-h-[48px] touch-manipulation active:scale-[0.98] ${
                      slot.selected 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-border hover:border-purple-500/50"
                    } ${highlightedIds.has(slot.id) ? "animate-highlight-pulse ring-2 ring-green-500/50 bg-green-500/10" : ""}`}
                  >
                    <Checkbox checked={slot.selected} className="pointer-events-none" />
                    <div className="flex-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatSlotDate(slot.date)}
                      </Badge>
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300">
                        {calculateDuration(slot.startTime, slot.endTime)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Options */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Add a discount?</Label>
              <RadioGroup 
                value={discountType} 
                onValueChange={(v) => setDiscountType(v as typeof discountType)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="text-sm cursor-pointer">No discount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="text-sm cursor-pointer flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Percentage off
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="text-sm cursor-pointer flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" /> Fixed amount off
                  </Label>
                </div>
              </RadioGroup>

              {discountType !== "none" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-20"
                    min={1}
                    max={discountType === "percentage" ? 50 : 100}
                  />
                  <span className="text-sm text-muted-foreground">
                    {discountType === "percentage" ? "% off" : "£ off"}
                  </span>
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendOffers}
              disabled={sending || selectedSlots.length === 0 || pupilCount === 0}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to {pupilCount} Pupils ({selectedSlots.length} slots)
                </>
              )}
            </Button>

            {pupilCount === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-2xl p-2">
                <AlertCircle className="h-4 w-4" />
                Add phone numbers to your pupils first
              </div>
            )}
          </>
        )}
      </div>
    </InstructorCard>
  );
}
