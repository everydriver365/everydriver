import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday } from "date-fns";
import { Calendar, Loader2, AlertCircle, Plus, List, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleDayTabs } from "./ScheduleDayTabs";
import { ExpandableLessonCard } from "./ExpandableLessonCard";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { AddLessonSheet } from "./AddLessonSheet";
import { TravelTimeIndicator } from "./TravelTimeIndicator";
import { VerticalTimelineView } from "./VerticalTimelineView";
import { useLessonTravelTimes } from "@/hooks/useLessonTravelTimes";

// Decorative tyre track SVG pattern
function TyreTrackPattern() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-32 md:w-48 opacity-[0.05] pointer-events-none text-primary"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMaxYMid slice"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left track */}
      <g>
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`left-${i}`} transform={`translate(40, ${i * 30})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
      {/* Right track */}
      <g>
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={`right-${i}`} transform={`translate(110, ${i * 30 + 15})`}>
            <polygon points="0,0 25,8 25,18 0,10" />
            <polygon points="30,0 55,8 55,18 30,10" />
          </g>
        ))}
      </g>
    </svg>
  );
}

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  pickup_postcode: string | null;
  status: string;
  payment_status: string;
  prepaid_hours_used: number;
  amount_due: number;
  notes: string | null;
  card_color?: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    prepaid_hours: number;
    account_balance: number;
  };
}

interface NewMobileScheduleViewProps {
  instructorId: string;
}

export function NewMobileScheduleView({ instructorId }: NewMobileScheduleViewProps) {
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [lessonColors, setLessonColors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  useEffect(() => {
    fetchLessons();
  }, [instructorId, selectedDate]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          duration_minutes,
          lesson_type,
          pickup_location,
          pickup_postcode,
          status,
          payment_status,
          prepaid_hours_used,
          amount_due,
          notes,
          pupil:pupils(
            id,
            name,
            phone,
            address,
            postcode,
            prepaid_hours,
            account_balance
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", dateStr)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      const transformedData = (data || []).map((lesson: any) => ({
        ...lesson,
        pupil: lesson.pupil || {
          id: "",
          name: "Unknown",
          phone: null,
          address: "",
          postcode: "",
          prepaid_hours: 0,
          account_balance: 0
        }
      }));
      
      setLessons(transformedData);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (address: string, postcode: string) => {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://maps.apple.com/?daddr=${query}`
      : `geo:0,0?q=${query}`;
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    
    window.location.href = url;
    setTimeout(() => {
      window.open(fallbackUrl, "_blank");
    }, 500);
  };

  const handleCall = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string | null) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `sms:${phone}`;
  };

  const handleOnWay = async (lesson: ScheduledLesson, delayMinutes?: number) => {
    if (!lesson.pupil?.phone) {
      toast({
        title: "No phone number",
        description: "This pupil doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(lesson.id);
    
    const firstName = (lesson.pupil?.name || "").split(" ")[0];
    let message: string;
    
    if (delayMinutes === -1) {
      message = `Hi ${firstName}, I'll call you as soon as I can!`;
    } else if (delayMinutes === -2) {
      message = `Hi ${firstName}, I'm on my way to you now!`;
    } else if (delayMinutes) {
      message = `Hi ${firstName}, I'm on my way! I'll be with you in about ${delayMinutes} minutes.`;
    } else {
      message = `Hi ${firstName}, I'm on my way to you!`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${lesson.pupil.phone}?body=${encodedMessage}`;
    
    setSendingMessage(null);
  };

  const handleCancelLesson = (lesson: ScheduledLesson) => {
    setSelectedLesson(lesson);
    setCancelDialogOpen(true);
  };

  const handleRescheduleLesson = (lesson: ScheduledLesson) => {
    setSelectedLesson(lesson);
    setRescheduleDialogOpen(true);
  };

  const handleDeleteLesson = (lesson: ScheduledLesson) => {
    // Use the cancel flow for deletion (same result)
    setSelectedLesson(lesson);
    setCancelDialogOpen(true);
  };

  const handleColorChange = (lessonId: string, color: string) => {
    setLessonColors(prev => ({ ...prev, [lessonId]: color }));
    // Optionally persist to localStorage
    const stored = JSON.parse(localStorage.getItem('lessonColors') || '{}');
    stored[lessonId] = color;
    localStorage.setItem('lessonColors', JSON.stringify(stored));
  };

  // Load persisted colors on mount
  useEffect(() => {
    const stored = localStorage.getItem('lessonColors');
    if (stored) {
      try {
        setLessonColors(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse lesson colors:', e);
      }
    }
  }, []);

  const lessonCount = lessons.length;

  // Memoize lessons for travel time calculation to prevent infinite loop
  const lessonsForTravel = useMemo(
    () =>
      lessons.map((l) => ({
        id: l.id,
        start_time: l.start_time,
        duration_minutes: l.duration_minutes,
        pickup_postcode: l.pickup_postcode,
        pupil: l.pupil ? { postcode: l.pupil.postcode } : undefined,
      })),
    [lessons]
  );

  // Get travel times between lessons
  const { getTravelTime } = useLessonTravelTimes(lessonsForTravel);

  return (
    <div className="relative space-y-4 overflow-hidden">
      <TyreTrackPattern />
      {/* Day Tabs */}
      <ScheduleDayTabs 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />

      {/* Header with Lesson Count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {format(selectedDate, "EEEE")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        </div>
      </div>

      {/* Lessons View - List or Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No lessons scheduled</p>
            <p className="text-sm text-muted-foreground/70">
              {isToday(selectedDate) ? "Enjoy your day off!" : `No lessons on ${format(selectedDate, "EEEE")}`}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "timeline" ? (
        <VerticalTimelineView
          lessons={lessons.map(l => ({
            ...l,
            pupil: {
              ...l.pupil,
              profile_image_url: null,
              test_date: null,
            }
          }))}
          onLessonClick={(lesson) => {
            // Could expand or show details
          }}
        />
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {lessons.map((lesson, index) => {
              const nextLesson = lessons[index + 1];
              const travelTime = nextLesson
                ? getTravelTime(lesson.id, nextLesson.id)
                : null;

              return (
                <div key={lesson.id}>
                  <ExpandableLessonCard
                    lesson={lesson}
                    onNavigate={handleNavigate}
                    onCall={handleCall}
                    onText={handleText}
                    onOnWay={handleOnWay}
                    onCancel={handleCancelLesson}
                    onReschedule={handleRescheduleLesson}
                    sendingMessage={sendingMessage}
                    cardColor={lessonColors[lesson.id] || "bg-card"}
                    onColorChange={(color) => handleColorChange(lesson.id, color)}
                    onDelete={handleDeleteLesson}
                  />
                  {/* Travel time indicator to next lesson */}
                  {travelTime && (
                    <TravelTimeIndicator
                      durationMinutes={travelTime.durationMinutes}
                      durationText={travelTime.durationText}
                      gapMinutes={travelTime.gapMinutes}
                      status={travelTime.status}
                      isLoading={travelTime.isLoading}
                    />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Cancel Dialog */}
      {selectedLesson && (
        <CancelLessonDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            setCancelDialogOpen(open);
            if (!open) setSelectedLesson(null);
          }}
          lessonId={selectedLesson.id}
          pupilId={selectedLesson.pupil?.id || ""}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          amountDue={selectedLesson.amount_due || 0}
          pupilBalance={selectedLesson.pupil?.account_balance || 0}
          durationMinutes={selectedLesson.duration_minutes}
          lessonDate={selectedLesson.lesson_date}
          lessonTime={selectedLesson.start_time}
          instructorId={instructorId}
          onCancelled={fetchLessons}
        />
      )}

      {/* Reschedule Sheet */}
      {selectedLesson && (
        <RescheduleLessonSheet
          open={rescheduleDialogOpen}
          onOpenChange={(open) => {
            setRescheduleDialogOpen(open);
            if (!open) setSelectedLesson(null);
          }}
          lessonId={selectedLesson.id}
          instructorId={instructorId}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          currentDate={selectedLesson.lesson_date}
          currentTime={selectedLesson.start_time}
          durationMinutes={selectedLesson.duration_minutes}
          onRescheduled={fetchLessons}
        />
      )}

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
        instructorId={instructorId}
        defaultDate={selectedDate}
        onSuccess={fetchLessons}
      />
    </div>
  );
}
