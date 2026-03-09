import { useState, useEffect } from "react";
import { Clock, MapPin, Calendar, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, differenceInHours, differenceInMinutes, parseISO } from "date-fns";
import { InstructorEnRouteTracker } from "./InstructorEnRouteTracker";

interface PupilPortalLessonCountdownProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
  onBookLesson?: () => void;
}

interface NextLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  lesson_type: string;
  status: string;
}

export function PupilPortalLessonCountdown({ 
  pupilId, 
  instructorId, 
  brandColour, 
  darkMode,
  onBookLesson
}: PupilPortalLessonCountdownProps) {
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextLesson();
  }, [pupilId]);

  // Realtime subscription for lesson status changes
  useEffect(() => {
    if (!nextLesson) return;
    const channel = supabase
      .channel(`countdown-lesson-status-${nextLesson.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scheduled_lessons", filter: `id=eq.${nextLesson.id}` },
        (payload) => {
          const updated = payload.new as any;
          setNextLesson(prev => prev ? { ...prev, status: updated.status } : null);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [nextLesson?.id]);

  useEffect(() => {
    if (!nextLesson) return;

    const updateCountdown = () => {
      const lessonDateTime = parseISO(`${nextLesson.lesson_date}T${nextLesson.start_time}`);
      const now = new Date();

      if (lessonDateTime <= now) {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = differenceInDays(lessonDateTime, now);
      const hours = differenceInHours(lessonDateTime, now) % 24;
      const minutes = differenceInMinutes(lessonDateTime, now) % 60;

      setCountdown({ days, hours, minutes });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextLesson]);

  const fetchNextLesson = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, lesson_type, status")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .gte("lesson_date", today)
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setNextLesson(data);
      }
    } catch (error) {
      console.error("Error fetching next lesson:", error);
    } finally {
      setLoading(false);
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
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-6">
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse flex gap-4">
              <div className="h-16 w-16 rounded-lg bg-muted"></div>
              <div className="h-16 w-16 rounded-lg bg-muted"></div>
              <div className="h-16 w-16 rounded-lg bg-muted"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextLesson) {
    return (
      <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--brand-text)' }}>No Upcoming Lessons</p>
          <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
            Book a lesson to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const lessonDate = parseISO(nextLesson.lesson_date);
  const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isTomorrow = format(lessonDate, 'yyyy-MM-dd') === format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  // Show en-route tracker instead of countdown
  if (nextLesson.status === "en_route") {
    return (
      <InstructorEnRouteTracker
        pupilId={pupilId}
        lessonId={nextLesson.id}
        brandColour={brandColour}
      />
    );
  }

  return (
    <Card 
      className="overflow-hidden"
      style={{ 
        backgroundColor: brandColour || '#1e3a5f',
        borderColor: 'transparent'
      }}
    >
      <CardContent className="p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-white/80" />
          <span className="text-white/80 text-sm font-medium">Next Lesson</span>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-4 mb-4">
          {countdown.days > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold">{countdown.days}</div>
              <div className="text-xs text-white/70">days</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-3xl font-bold">{countdown.hours}</div>
            <div className="text-xs text-white/70">hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{countdown.minutes}</div>
            <div className="text-xs text-white/70">mins</div>
          </div>
        </div>

        {/* Lesson Details */}
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">
              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(lessonDate, 'EEE, d MMM')}
            </span>
            <span className="font-semibold">{formatTime(nextLesson.start_time)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">{nextLesson.lesson_type}</span>
            <span className="text-white/70">{nextLesson.duration_minutes} mins</span>
          </div>
          {nextLesson.pickup_location && (
            <div className="flex items-center gap-2 text-sm text-white/80 pt-1">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{nextLesson.pickup_location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
