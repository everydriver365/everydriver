import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfWeek, isBefore, isToday, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

const SelfBookingCalendar: React.FC<SelfBookingCalendarProps> = ({
  pupilId,
  instructorId,
  brandColour = '#3B82F6',
  className,
}) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // Fetch instructor availability
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['instructor-availability', instructorId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_availability' as never)
        .select('id, day_of_week, start_time, end_time, is_available')
        .eq('instructor_id', instructorId);

      if (error) throw error;
      return (data || []) as { id: string; day_of_week: string; start_time: string; end_time: string; is_available: boolean }[];
    },
    enabled: !!settings?.allow_self_booking,
  });

  // Fetch existing bookings for the week
  const { data: existingBookings } = useQuery({
    queryKey: ['existing-bookings', instructorId, weekStart],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 6);
      
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
    enabled: !!settings?.allow_self_booking,
  });

  // Create booking mutation
  const bookLessonMutation = useMutation({
    mutationFn: async (slot: AvailableSlot) => {
      // Get pupil details
      const { data: pupil, error: pupilError } = await supabase
        .from('pupils')
        .select('address, postcode')
        .eq('id', pupilId)
        .single();

      if (pupilError) throw pupilError;

      const bookingStatus = settings?.require_approval ? 'pending_approval' : 'confirmed';
      const pupilData = pupil as { address: string | null; postcode: string | null };

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

      if (error) throw error;
      return bookingStatus;
    },
    onSuccess: (bookingStatus) => {
      queryClient.invalidateQueries({ queryKey: ['existing-bookings'] });
      setShowConfirmDialog(false);
      setSelectedSlot(null);
      
      toast({
        title: bookingStatus === 'pending_approval' ? 'Booking Requested!' : 'Lesson Booked!',
        description: bookingStatus === 'pending_approval'
          ? 'Your instructor will confirm your booking soon.'
          : 'Your lesson has been confirmed.',
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

  // Generate available slots for the week
  const availableSlots = useMemo(() => {
    if (!availability || !settings) return {};

    const slots: Record<string, AvailableSlot[]> = {};
    const minNoticeDate = addDays(new Date(), settings.min_notice_hours / 24);
    const maxAdvanceDate = addDays(new Date(), settings.max_advance_days);

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = format(date, 'EEEE').toLowerCase();

      // Skip if date is before minimum notice or after max advance
      if (isBefore(date, minNoticeDate) || isBefore(maxAdvanceDate, date)) {
        continue;
      }

      // Find availability for this day
      const dayAvailability = availability.filter(
        (a) => a.day_of_week?.toLowerCase() === dayOfWeek && a.is_available
      );

      slots[dateStr] = [];

      dayAvailability.forEach((avail) => {
        // Generate hourly slots
        const startHour = parseInt(avail.start_time?.split(':')[0] || '9');
        const endHour = parseInt(avail.end_time?.split(':')[0] || '17');

        for (let hour = startHour; hour < endHour; hour++) {
          const slotStart = `${hour.toString().padStart(2, '0')}:00`;
          const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;

          // Check if slot is already booked
          const isBooked = existingBookings?.some((booking) => {
            if (booking.lesson_date !== dateStr) return false;
            const bookingStart = parseInt(booking.start_time?.split(':')[0] || '0');
            const bookingDuration = booking.duration_minutes || 60;
            const bookingEnd = bookingStart + bookingDuration / 60;
            return hour >= bookingStart && hour < bookingEnd;
          });

          if (!isBooked) {
            slots[dateStr].push({
              date: dateStr,
              startTime: slotStart,
              endTime: slotEnd,
            });
          }
        }
      });
    }

    return slots;
  }, [availability, existingBookings, weekStart, settings]);

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

  // If self-booking is not enabled
  if (!settingsLoading && !settings?.allow_self_booking) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-1">Self-Booking Not Available</h3>
          <p className="text-sm text-muted-foreground">
            Contact your instructor directly to book lessons.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (settingsLoading || availabilityLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" style={{ color: brandColour }} />
              Book a Lesson
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {settings?.booking_message && (
            <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
              {settings.booking_message}
            </p>
          )}

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  isToday(day) && "text-primary"
                )}
              >
                <div>{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-lg",
                  isToday(day) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 min-h-[200px]">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const daySlots = availableSlots[dateStr] || [];

              return (
                <div
                  key={day.toISOString()}
                  className="border rounded-lg p-1 min-h-[150px] bg-muted/20"
                >
                  {daySlots.length > 0 ? (
                    <div className="space-y-1">
                      {daySlots.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.startTime}`}
                          onClick={() => handleSlotClick(slot)}
                          className="w-full text-xs py-1.5 px-1 rounded text-center transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: `${brandColour}20`,
                            color: brandColour,
                          }}
                        >
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: `${brandColour}20` }}
              />
              <span>Available</span>
            </div>
            {settings?.require_approval && (
              <Badge variant="secondary" className="text-xs">
                Requires approval
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              {settings?.require_approval
                ? 'Your booking will be sent to your instructor for approval.'
                : 'Confirm your lesson booking.'}
            </DialogDescription>
          </DialogHeader>

          {selectedSlot && (
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
          )}

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
              {settings?.require_approval ? 'Request Booking' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelfBookingCalendar;
