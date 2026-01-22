import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PendingSchedulingBadgeProps {
  instructorId?: string;
  className?: string;
}

export function PendingSchedulingBadge({ instructorId, className }: PendingSchedulingBadgeProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!instructorId) return;

    const fetchPendingCount = async () => {
      try {
        // Get pupils with unscheduled hours (prepaid_hours > 0 and need scheduling)
        // We look for active pupils where total scheduled lesson duration < prepaid hours
        const { data: pupils, error: pupilsError } = await supabase
          .from("pupils")
          .select("id, prepaid_hours")
          .eq("instructor_id", instructorId)
          .gt("prepaid_hours", 0);

        if (pupilsError || !pupils || pupils.length === 0) {
          setPendingCount(0);
          return;
        }

        // Get scheduled lessons for these pupils
        const pupilIds = pupils.map(p => p.id);
        const { data: lessons, error: lessonsError } = await supabase
          .from("scheduled_lessons")
          .select("pupil_id, duration_minutes")
          .in("pupil_id", pupilIds);

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
          setPendingCount(0);
          return;
        }

        // Calculate scheduled hours per pupil
        const scheduledMinutesByPupil: Record<string, number> = {};
        (lessons || []).forEach((lesson) => {
          if (lesson.pupil_id) {
            scheduledMinutesByPupil[lesson.pupil_id] = 
              (scheduledMinutesByPupil[lesson.pupil_id] || 0) + (lesson.duration_minutes || 0);
          }
        });

        // Count pupils with unscheduled hours
        let pending = 0;
        pupils.forEach((pupil) => {
          const scheduledMinutes = scheduledMinutesByPupil[pupil.id] || 0;
          const scheduledHours = scheduledMinutes / 60;
          const prepaidHours = pupil.prepaid_hours || 0;
          
          // If scheduled hours < prepaid hours, they need scheduling
          if (scheduledHours < prepaidHours) {
            pending++;
          }
        });

        setPendingCount(pending);
      } catch (error) {
        console.error("Error fetching pending scheduling count:", error);
        setPendingCount(0);
      }
    };

    fetchPendingCount();

    // Subscribe to changes in pupils and scheduled_lessons tables
    const pupilsChannel = supabase
      .channel("pending-scheduling-pupils")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pupils",
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    const lessonsChannel = supabase
      .channel("pending-scheduling-lessons")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_lessons",
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pupilsChannel);
      supabase.removeChannel(lessonsChannel);
    };
  }, [instructorId]);

  if (pendingCount === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-white",
        className
      )}
    >
      {pendingCount > 99 ? "99+" : pendingCount}
    </span>
  );
}
