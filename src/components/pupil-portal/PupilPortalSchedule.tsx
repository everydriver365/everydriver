import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Phone, MessageSquare, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface PupilPortalScheduleProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
  instructorPhone: string | null;
}

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  lesson_type: string;
  status: string;
  payment_status: string;
}

export function PupilPortalSchedule({ 
  pupilId, 
  instructorId, 
  brandColour, 
  darkMode,
  instructorPhone 
}: PupilPortalScheduleProps) {
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [pupilId]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, lesson_type, status, payment_status")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (!error && data) {
        setLessons(data);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = (lesson: ScheduledLesson) => {
    setSelectedLesson(lesson);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedLesson) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({ status: "cancelled" })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      setLessons(prev => prev.filter(l => l.id !== selectedLesson.id));
      toast({ title: "Lesson cancelled", description: "Your instructor has been notified" });
      setCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({ title: "Error", description: "Failed to cancel lesson", variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const today = startOfDay(new Date());
  const upcomingLessons = lessons.filter(l => !isBefore(parseISO(l.lesson_date), today));
  const pastLessons = lessons.filter(l => isBefore(parseISO(l.lesson_date), today));

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--brand-text)' }}>
          Upcoming Lessons ({upcomingLessons.length})
        </h2>
        
        {upcomingLessons.length === 0 ? (
          <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
            <CardContent className="p-6 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
              <p style={{ color: 'var(--brand-muted)' }}>No upcoming lessons</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => {
              const lessonDate = parseISO(lesson.lesson_date);
              const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <Card 
                  key={lesson.id}
                  style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium" style={{ color: 'var(--brand-text)' }}>
                          {isToday ? 'Today' : format(lessonDate, 'EEE, d MMM')}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                          {formatTime(lesson.start_time)} • {lesson.duration_minutes} mins
                        </div>
                      </div>
                      <Badge 
                        variant={lesson.payment_status === 'paid' ? 'default' : 'secondary'}
                        style={lesson.payment_status === 'paid' ? { backgroundColor: '#22c55e' } : {}}
                      >
                        {lesson.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>

                    <div className="text-sm mb-3" style={{ color: 'var(--brand-muted)' }}>
                      {lesson.lesson_type}
                    </div>

                    {lesson.pickup_location && (
                      <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--brand-text)' }}>
                        <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-muted)' }} />
                        <span className="truncate">{lesson.pickup_location}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {instructorPhone && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => window.location.href = `tel:${instructorPhone}`}
                            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => window.location.href = `sms:${instructorPhone}`}
                            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)' }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Text
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelRequest(lesson)}
                        className="text-destructive hover:text-destructive"
                        style={{ borderColor: 'var(--brand-border)' }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Lesson?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this lesson? Your instructor will be notified.
              Cancellation charges may apply depending on notice period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Lesson
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
