import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sun,
  Sunset,
  Moon,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek, isBefore, isToday, parseISO, isSameDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { checkLessonClash, describeLessonClashError } from '@/lib/lessonClashCheck';

interface SelfBookingCalendarProps {
  pupilId: string;
  instructorId: string;
  brandColour?: string;
  className?: string;
}

interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface BookingSettings {
  allow_self_booking: boolean;
  require_approval: boolean;
  min_notice_hours: number;
  max_advance_days: number;
  allowed_durations: number[];
  booking_message?: string;
}

function getTimeSlotGroup(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const TIME_GROUP_CONFIG = {
  morning: { label: 'Morning', icon: Sun, color: 'text-amber-500' },
  afternoon: { label: 'Afternoon', icon: Sunset, color: 'text-orange-500' },
  evening: { label: 'Evening', icon: Moon, color: 'text-indigo-500' },
};

const SelfBookingCalendar: React.FC<SelfBookingCalendarProps> = ({
  pupilId,
  instructorId,
  brandColour = '#3B82F6',
  className,
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const dayStripRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch booking settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['booking-settings', instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_booking_settings')
        .select('*')
        .eq('instructor_id', instructorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BookingSettings | null;
    },
  });

  // Fetch instructor working hours
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['instructor-availability', instructorId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_working_hours')
        .select('id, day_of_week, start_time, end_time, is_active')
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []).map(h => ({
        id: h.id,
        day_of_week: h.day_of_week,
        start_time: h.start_time,
        end_time: h.end_time,
        is_available: h.is_active,
      }));
    },
    enabled: true,
  });

  // Fetch existing bookings for the week
  const { data: existingBookings } = useQuery({
    queryKey: ['existing-bookings', instructorId, weekStart],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 13); // fetch 2 weeks for scrolling
      
      const { data, error } = await supabase
        .from('scheduled_lessons')
        .select('lesson_date, start_time, duration_minutes')
        .eq('instructor_id', instructorId)
        .gte('lesson_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('lesson_date', format(weekEnd, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');

      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  // Create booking mutation
  const bookLessonMutation = useMutation({
    mutationFn: async (slot: AvailableSlot) => {
      const { data: pupil, error: pupilError } = await supabase
        .from('pupils')
        .select('address, postcode')
        .eq('id', pupilId)
        .single();

      if (pupilError) throw pupilError;

      const bookingStatus = 'confirmed';
      const pupilData = pupil as { address: string | null; postcode: string | null };

      // Pre-check for clashes so the user gets a clean message instead of a raw DB error.
      const clash = await checkLessonClash({
        instructorId,
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes: selectedDuration,
      });
      if (clash.hardOverlap) {
        throw new Error(clash.message ?? 'That slot is already booked. Please pick another time.');
      }

      const { error } = await supabase
        .from('scheduled_lessons')
        .insert({
          instructor_id: instructorId,
          pupil_id: pupilId,
          lesson_date: slot.date,
          start_time: slot.startTime,
          duration_minutes: selectedDuration,
          status: 'scheduled',
          booking_status: bookingStatus,
          pickup_address: pupilData.address,
          pickup_postcode: pupilData.postcode,
        });

      if (error) {
        const friendly = describeLessonClashError(error);
        throw new Error(friendly ?? error.message);
      }
      return bookingStatus;
    },
    onSuccess: (bookingStatus) => {
      queryClient.invalidateQueries({ queryKey: ['existing-bookings'] });
      setShowConfirmDialog(false);
      setSelectedSlot(null);
      setBookingSuccess(true);
      
      // Confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: [brandColour, '#10B981', '#F59E0B'],
      });

      setTimeout(() => setBookingSuccess(false), 3000);
      
      toast({
        title: 'Lesson Booked! 🎉',
        description: 'Your lesson has been confirmed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Unable to book lesson. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Generate available slots
  const DEFAULT_SETTINGS: BookingSettings = {
    allow_self_booking: true,
    require_approval: false,
    min_notice_hours: 2,
    max_advance_days: 56,
    allowed_durations: [60, 90, 120],
  };

  const effectiveSettings = settings || DEFAULT_SETTINGS;

  const availableSlots = useMemo(() => {
    if (!availability) return {};

    const slots: Record<string, AvailableSlot[]> = {};
    const minNoticeDate = addDays(new Date(), effectiveSettings.min_notice_hours / 24);
    const maxAdvanceDate = addDays(new Date(), effectiveSettings.max_advance_days);

    for (let i = 0; i < 14; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeekNum = date.getDay(); // 0=Sun, 1=Mon, ...

      if (isBefore(date, minNoticeDate) || isBefore(maxAdvanceDate, date)) continue;

      const dayAvailability = availability.filter(
        (a) => a.day_of_week === dayOfWeekNum && a.is_available
      );

      slots[dateStr] = [];

      dayAvailability.forEach((avail) => {
        const startHour = parseInt(avail.start_time?.split(':')[0] || '9');
        const endHour = parseInt(avail.end_time?.split(':')[0] || '17');

        for (let hour = startHour; hour < endHour; hour++) {
          const slotStart = `${hour.toString().padStart(2, '0')}:00`;
          const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

          const isBooked = existingBookings?.some((booking) => {
            if (booking.lesson_date !== dateStr) return false;
            const bookingStart = parseInt(booking.start_time?.split(':')[0] || '0');
            const bookingDuration = booking.duration_minutes || 60;
            const bookingEnd = bookingStart + bookingDuration / 60;
            return hour >= bookingStart && hour < bookingEnd;
          });

          if (!isBooked) {
            slots[dateStr].push({ date: dateStr, startTime: slotStart, endTime: slotEnd });
          }
        }
      });
    }

    return slots;
  }, [availability, existingBookings, weekStart, effectiveSettings]);

  const handlePrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const handleNextWeek = () => setWeekStart((prev) => addDays(prev, 7));

  const handleSlotClick = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = () => {
    if (selectedSlot) {
      bookLessonMutation.mutate(selectedSlot);
    }
  };


  if (settingsLoading || availabilityLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));
  const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
  const daySlots = availableSlots[selectedDateStr] || [];

  // Group slots by time of day
  const groupedSlots = {
    morning: daySlots.filter((s) => getTimeSlotGroup(s.startTime) === 'morning'),
    afternoon: daySlots.filter((s) => getTimeSlotGroup(s.startTime) === 'afternoon'),
    evening: daySlots.filter((s) => getTimeSlotGroup(s.startTime) === 'evening'),
  };

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: brandColour }} />
            Book a Lesson
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {settings?.booking_message && (
          <p className="text-sm text-muted-foreground px-4 py-2 bg-muted/50 rounded-lg mx-4">
            {settings.booking_message}
          </p>
        )}

        {/* Horizontal Day Strip */}
        <div
          ref={dayStripRef}
          className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory"
        >
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const slotCount = (availableSlots[dateStr] || []).length;
            const isSelected = isSameDay(day, selectedDay);
            const isCurrentDay = isToday(day);

            return (
              <motion.button
                key={dateStr}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col items-center min-w-[56px] py-2.5 px-2 rounded-2xl border transition-all snap-center shrink-0",
                  isSelected
                    ? "border-transparent shadow-md"
                    : "border-border bg-card hover:bg-muted",
                  slotCount === 0 && !isSelected && "opacity-40"
                )}
                style={{
                  backgroundColor: isSelected ? brandColour : undefined,
                  color: isSelected ? '#ffffff' : undefined,
                }}
              >
                <span className={cn("text-[10px] font-medium uppercase", !isSelected && "text-muted-foreground")}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isCurrentDay && !isSelected && "text-primary"
                )}>
                  {format(day, 'd')}
                </span>
                {slotCount > 0 && (
                  <span className={cn(
                    "text-[9px] font-medium mt-0.5",
                    isSelected ? "opacity-80" : "text-muted-foreground"
                  )}>
                    {slotCount} slots
                  </span>
                )}
                {slotCount === 0 && (
                  <span className={cn(
                    "text-[9px] mt-0.5",
                    isSelected ? "opacity-60" : "text-muted-foreground"
                  )}>
                    Full
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Day Label */}
        <div className="px-4">
          <h3 className="text-sm font-semibold text-foreground">
            {format(selectedDay, 'EEEE, MMMM d')}
          </h3>
        </div>

        {/* Time Slots grouped by period */}
        <div className="px-4 space-y-4">
          <AnimatePresence mode="wait">
            {daySlots.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No available slots on this day</p>
              </motion.div>
            ) : (
              <motion.div key={selectedDateStr} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {(['morning', 'afternoon', 'evening'] as const).map((period) => {
                  const slots = groupedSlots[period];
                  if (slots.length === 0) return null;
                  const config = TIME_GROUP_CONFIG[period];

                  return (
                    <div key={period} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {config.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot, i) => {
                          const isPopular = slots.length <= 2;
                          return (
                            <motion.button
                              key={`${slot.date}-${slot.startTime}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSlotClick(slot)}
                              className="relative rounded-xl border border-border bg-card py-3 px-2 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
                            >
                              <span className="text-sm font-semibold text-foreground">{slot.startTime}</span>
                              {isPopular && (
                                <div className="absolute -top-1 -right-1">
                                  <Badge className="text-[8px] px-1 py-0 h-4 bg-amber-500 hover:bg-amber-500 border-0">
                                    <Flame className="h-2 w-2 mr-0.5" />
                                    Hot
                                  </Badge>
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="px-4 flex items-center gap-3 text-xs text-muted-foreground">
        </div>
      </div>

      {/* Sticky Bottom Summary + Confirm */}
      <AnimatePresence>
        {selectedSlot && showConfirmDialog && (
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
                <DialogDescription>
                  Confirm your lesson booking.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Starting at {selectedSlot.startTime}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lesson Duration</label>
                  <Select
                    value={selectedDuration.toString()}
                    onValueChange={(val) => setSelectedDuration(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings?.allowed_durations || [60, 90, 120]).map((duration) => (
                        <SelectItem key={duration} value={duration.toString()}>
                          {duration} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={bookLessonMutation.isPending}
                  style={{ backgroundColor: brandColour }}
                >
                  {bookLessonMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Confirm Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Success animation overlay */}
      <AnimatePresence>
        {bookingSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: brandColour }}
            >
              <Check className="h-10 w-10 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SelfBookingCalendar;
