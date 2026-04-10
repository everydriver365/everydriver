import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    account_balance: number;
  };
}

interface TomorrowScheduleViewProps {
  instructorId: string;
}

export function TomorrowScheduleView({ instructorId }: TomorrowScheduleViewProps) {
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, [instructorId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, "yyyy-MM-dd");
      
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
          pupil:pupils(
            id,
            name,
            phone,
            address,
            postcode,
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
          account_balance: 0
        }
      }));
      
      setLessons(transformedData);
    } catch (error) {
      console.error("Error fetching tomorrow's lessons:", error);
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

  const getPaymentStatusBadge = (lesson: ScheduledLesson) => {
    const balance = lesson.pupil?.account_balance || 0;
    
    if (lesson.payment_status === "paid") {
      return <Badge className="bg-success text-success-foreground text-xs">Paid</Badge>;
    }
    
    if (balance > 0) {
      return (
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
          £{Math.round(balance)} Credit
        </Badge>
      );
    }

    if (balance < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          £{Math.abs(Math.round(balance))} Due
        </Badge>
      );
    }
    
    return <Badge variant="destructive" className="text-xs">Unpaid</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Tomorrow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Tomorrow
            <Badge variant="secondary" className="ml-auto">
            {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lessons.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No lessons scheduled for tomorrow
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-none border bg-card"
              >
                <div className="text-center min-w-[50px]">
                  <div className="font-bold text-sm">{formatTime(lesson.start_time)}</div>
                  <div className="text-xs text-muted-foreground">{lesson.duration_minutes}m</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{lesson.pupil?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {lesson.pickup_location || lesson.pupil?.address}
                  </div>
                </div>
                {getPaymentStatusBadge(lesson)}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
