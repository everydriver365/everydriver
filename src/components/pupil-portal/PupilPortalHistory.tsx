import { useState, useEffect } from "react";
import { History, Star, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface PupilPortalHistoryProps {
  pupilId: string;
  brandColour: string | null;
  darkMode: boolean;
}

interface LessonRecord {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
}

export function PupilPortalHistory({ pupilId, brandColour, darkMode }: PupilPortalHistoryProps) {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessonHistory();
  }, [pupilId]);

  const fetchLessonHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes, rating, skills_practiced")
        .eq("pupil_id", pupilId)
        .order("lesson_date", { ascending: false })
        .limit(50);

      if (!error && data) {
        setLessons(data);
      }
    } catch (error) {
      console.error("Error fetching lesson history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-6 text-center">
            <History className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--brand-muted)' }} />
            <p style={{ color: 'var(--brand-muted)' }}>No lesson history yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--brand-muted)' }}>
              Your completed lessons will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalHours = lessons.reduce((acc, l) => acc + l.duration_minutes, 0) / 60;
  const avgRating = lessons.filter(l => l.rating).length > 0
    ? lessons.filter(l => l.rating).reduce((acc, l) => acc + (l.rating || 0), 0) / lessons.filter(l => l.rating).length
    : 0;

  return (
    <div className="px-4 space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold" style={{ color: brandColour || '#1e3a5f' }}>
              {lessons.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Lessons</div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold" style={{ color: brandColour || '#1e3a5f' }}>
              {totalHours.toFixed(1)}h
            </div>
            <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Total Time</div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold flex items-center justify-center gap-1" style={{ color: brandColour || '#1e3a5f' }}>
              {avgRating > 0 ? avgRating.toFixed(1) : '-'}
              {avgRating > 0 && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
            </div>
            <div className="text-xs" style={{ color: 'var(--brand-muted)' }}>Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson List */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--brand-text)' }}>
          Past Lessons
        </h2>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card 
              key={lesson.id}
              style={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" style={{ color: 'var(--brand-muted)' }} />
                    <span className="font-medium" style={{ color: 'var(--brand-text)' }}>
                      {format(parseISO(lesson.lesson_date), 'EEE, d MMM yyyy')}
                    </span>
                  </div>
                  {renderStars(lesson.rating)}
                </div>

                <div className="flex items-center gap-4 text-sm mb-2" style={{ color: 'var(--brand-muted)' }}>
                  {lesson.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(lesson.start_time)}
                    </span>
                  )}
                  <span>{lesson.duration_minutes} mins</span>
                </div>

                {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {lesson.skills_practiced.slice(0, 3).map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {lesson.skills_practiced.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lesson.skills_practiced.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {lesson.notes && (
                  <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
                    {lesson.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
