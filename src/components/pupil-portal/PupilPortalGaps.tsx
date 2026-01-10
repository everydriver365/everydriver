import { useState, useEffect } from "react";
import { Calendar, Clock, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO, isBefore, isAfter, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface PupilPortalGapsProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface ScheduledLesson {
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
}

export function PupilPortalGaps({ 
  pupilId, 
  instructorId, 
  brandColour, 
  darkMode 
}: PupilPortalGapsProps) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    calculateAvailableSlots();
  }, [instructorId]);

  const calculateAvailableSlots = async () => {
    try {
      // Fetch working hours
      const { data: workingHours } = await supabase
        .from("instructor_working_hours")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (!workingHours || workingHours.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch existing lessons for next 14 days
      const today = format(new Date(), 'yyyy-MM-dd');
      const twoWeeksLater = format(addDays(new Date(), 14), 'yyyy-MM-dd');

      const { data: existingLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes")
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .gte("lesson_date", today)
        .lte("lesson_date", twoWeeksLater);

      // Calculate available slots
      const slots: TimeSlot[] = [];
      
      for (let i = 1; i <= 14; i++) {
        const date = addDays(new Date(), i);
        const dayOfWeek = date.getDay();
        const dateStr = format(date, 'yyyy-MM-dd');

        // Find working hours for this day
        const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
        if (!dayHours) continue;

        // Parse working hours
        const [startHour, startMin] = dayHours.start_time.split(':').map(Number);
        const [endHour, endMin] = dayHours.end_time.split(':').map(Number);
        const workStart = startHour * 60 + startMin;
        const workEnd = endHour * 60 + endMin;

        // Get lessons for this day
        const dayLessons = (existingLessons || [])
          .filter(l => l.lesson_date === dateStr)
          .map(l => {
            const [h, m] = l.start_time.split(':').map(Number);
            return {
              start: h * 60 + m,
              end: h * 60 + m + l.duration_minutes
            };
          })
          .sort((a, b) => a.start - b.start);

        // Find gaps
        let currentTime = workStart;
        
        for (const lesson of dayLessons) {
          if (lesson.start > currentTime) {
            const gapDuration = lesson.start - currentTime;
            if (gapDuration >= 60) { // At least 1 hour gap
              slots.push({
                date: dateStr,
                startTime: `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`,
                endTime: `${Math.floor(lesson.start / 60).toString().padStart(2, '0')}:${(lesson.start % 60).toString().padStart(2, '0')}`,
                duration: gapDuration
              });
            }
          }
          currentTime = Math.max(currentTime, lesson.end);
        }

        // Check for gap after last lesson
        if (currentTime < workEnd) {
          const gapDuration = workEnd - currentTime;
          if (gapDuration >= 60) {
            slots.push({
              date: dateStr,
              startTime: `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`,
              endTime: `${Math.floor(workEnd / 60).toString().padStart(2, '0')}:${(workEnd % 60).toString().padStart(2, '0')}`,
              duration: gapDuration
            });
          }
        }
      }

      setAvailableSlots(slots.slice(0, 20)); // Limit to 20 slots
    } catch (error) {
      console.error("Error calculating slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: TimeSlot) => {
    const slotKey = `${slot.date}-${slot.startTime}`;
    setBooking(slotKey);

    try {
      // Get pupil details for pickup location
      const { data: pupilData } = await supabase
        .from("pupils")
        .select("address, postcode")
        .eq("id", pupilId)
        .single();

      // Create the booking (1 hour lesson at slot start)
      const { error } = await supabase
        .from("scheduled_lessons")
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          lesson_date: slot.date,
          start_time: slot.startTime,
          duration_minutes: 60,
          pickup_location: pupilData?.address || '',
          pickup_postcode: pupilData?.postcode || '',
          lesson_type: 'Standard Lesson',
          status: 'confirmed',
          payment_status: 'not_paid'
        });

      if (error) throw error;

      toast({ title: "Lesson booked!", description: "Your instructor will confirm shortly" });
      
      // Remove the slot from available
      setAvailableSlots(prev => prev.filter(s => 
        !(s.date === slot.date && s.startTime === slot.startTime)
      ));
    } catch (error) {
      console.error("Error booking slot:", error);
      toast({ title: "Error", description: "Failed to book lesson", variant: "destructive" });
    } finally {
      setBooking(null);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  if (loading) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--brand-muted)' }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--brand-text)' }}>
              No Available Slots
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--brand-muted)' }}>
              Contact your instructor for availability
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="px-4 space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>
        Available Slots
      </h2>
      <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
        Book an available slot for a 1-hour lesson
      </p>

      {Object.entries(slotsByDate).map(([date, slots]) => (
        <Card 
          key={date}
          style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--brand-text)' }}>
              <Calendar className="h-4 w-4" style={{ color: brandColour || '#1e3a5f' }} />
              {format(parseISO(date), 'EEEE, d MMMM')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {slots.map((slot, idx) => {
                const slotKey = `${slot.date}-${slot.startTime}`;
                const isBooking = booking === slotKey;

                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3"
                    style={{ borderColor: 'var(--brand-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4" style={{ color: 'var(--brand-muted)' }} />
                      <div>
                        <div className="font-medium" style={{ color: 'var(--brand-text)' }}>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                          {Math.floor(slot.duration / 60)}h {slot.duration % 60 > 0 ? `${slot.duration % 60}m` : ''} available
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isBooking}
                      onClick={() => handleBookSlot(slot)}
                      style={{ backgroundColor: brandColour || '#1e3a5f', color: '#ffffff' }}
                    >
                      {isBooking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Book
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
