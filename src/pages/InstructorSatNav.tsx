import { useState, useEffect } from "react";
import { Navigation, MapPin, Clock, User, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface UpcomingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  pickup_postcode: string;
  pickup_location: string | null;
  pupils: {
    name: string;
  } | null;
}

export default function InstructorSatNav() {
  const { instructor } = useInstructorAuth();
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingLessons = async () => {
      if (!instructor?.id) return;

      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from("scheduled_lessons")
          .select(`
            id,
            lesson_date,
            start_time,
            pickup_postcode,
            pickup_location,
            pupils(name)
          `)
          .eq("instructor_id", instructor.id)
          .eq("status", "scheduled")
          .gte("lesson_date", today)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(10);

        if (error) throw error;
        setLessons(data || []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingLessons();
  }, [instructor?.id]);

  const openNavigation = (address: string, postcode: string) => {
    const destination = encodeURIComponent(address || postcode);
    
    // Check if on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Open Apple Maps on iOS
      window.open(`maps://maps.apple.com/?daddr=${destination}`, '_blank');
    } else {
      // Open Google Maps on Android/other
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const formatLessonDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, dd MMM");
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!instructor) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Sat Nav</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Navigate to your upcoming lessons</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-lg mb-2">No Upcoming Lessons</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any scheduled lessons to navigate to.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <Card 
                key={lesson.id} 
                className={index === 0 ? "border-primary/50 bg-primary/5" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Date & Time Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                          {formatLessonDate(lesson.lesson_date)}
                        </Badge>
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatTime(lesson.start_time)}
                        </span>
                      </div>

                      {/* Pupil Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {lesson.pupils?.name || "Unknown Pupil"}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {lesson.pickup_location || lesson.pickup_postcode}
                        </span>
                      </div>
                    </div>

                    {/* Navigate Button */}
                    <Button
                      onClick={() => openNavigation(
                        lesson.pickup_location || '',
                        lesson.pickup_postcode
                      )}
                      className="shrink-0 gap-2"
                      size={index === 0 ? "default" : "sm"}
                    >
                      <Navigation className="h-4 w-4" />
                      {index === 0 ? "Navigate" : "Go"}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick tip */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Tap "Navigate" to open directions in your phone's map app (Google Maps on Android, Apple Maps on iOS).
            </p>
          </CardContent>
        </Card>
      </div>
    </InstructorPortalLayout>
  );
}
