import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours } from "date-fns";

interface LessonReminder {
  id: string;
  pupil_name: string;
  start_time: string;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
}

interface ChannelConfig {
  sms: boolean;
  email: boolean;
  push: boolean;
}

export function ReminderStatusWidget() {
  const { instructor } = useInstructorAuth();
  const [lessons, setLessons] = useState<LessonReminder[]>([]);
  const [channels, setChannels] = useState<ChannelConfig>({ sms: false, email: false, push: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructor?.id) return;

    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      const in24h = addHours(now, 24);
      const today = format(now, "yyyy-MM-dd");
      const tomorrow = format(in24h, "yyyy-MM-dd");

      // Fetch lessons in next 24h and channel preferences in parallel
      const [lessonsRes, prefsRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("id, start_time, reminder_24h_sent_at, reminder_1h_sent_at, pupils(name)")
          .eq("instructor_id", instructor.id)
          .neq("status", "cancelled")
          .gte("lesson_date", today)
          .lte("lesson_date", tomorrow)
          .order("start_time", { ascending: true })
          .limit(10),
        supabase
          .from("instructor_reminder_preferences")
          .select("sms_enabled, email_enabled, push_enabled")
          .eq("instructor_id", instructor.id)
          .maybeSingle(),
      ]);

      if (lessonsRes.data) {
        setLessons(
          lessonsRes.data.map((l: any) => ({
            id: l.id,
            pupil_name: l.pupils?.name || "Unknown",
            start_time: l.start_time,
            reminder_24h_sent: !!l.reminder_24h_sent_at,
            reminder_1h_sent: !!l.reminder_1h_sent_at,
          }))
        );
      }

      if (prefsRes.data) {
        setChannels({
          sms: prefsRes.data.sms_enabled ?? false,
          email: prefsRes.data.email_enabled ?? false,
          push: prefsRes.data.push_enabled ?? false,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [instructor?.id]);

  const enabledChannels = [
    channels.sms && { icon: MessageSquare, label: "SMS" },
    channels.email && { icon: Mail, label: "Email" },
    channels.push && { icon: Smartphone, label: "Push" },
  ].filter(Boolean) as { icon: typeof MessageSquare; label: string }[];

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm text-foreground">Reminders</h3>
          </div>
          {enabledChannels.length > 0 && (
            <div className="flex items-center gap-1">
              {enabledChannels.map((ch) => (
                <ch.icon key={ch.label} className="h-3 w-3 text-muted-foreground" />
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        ) : lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No upcoming lessons in the next 24h</p>
        ) : (
          <div className="space-y-2">
            {lessons.slice(0, 4).map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{lesson.pupil_name}</p>
                  <p className="text-[10px] text-muted-foreground">{lesson.start_time}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 ${
                      lesson.reminder_24h_sent
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {lesson.reminder_24h_sent ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                    24h
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 ${
                      lesson.reminder_1h_sent
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {lesson.reminder_1h_sent ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                    1h
                  </Badge>
                </div>
              </div>
            ))}
            {lessons.length > 4 && (
              <p className="text-[10px] text-muted-foreground text-center">+{lessons.length - 4} more</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
