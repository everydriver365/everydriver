import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInHours, differenceInMinutes } from "date-fns";

interface JobPreview {
  id: string;
  courseType: string;
  courseTypeShort: string;
  hours: number;
  estimatedPayment: number;
  createdAt: string;
  expiresInHours: number;
  expiresInMinutes: number;
  urgencyLevel: "normal" | "warning" | "critical";
}

const courseTypeShortLabels: Record<string, string> = {
  "intensive": "Intensive",
  "semi-intensive": "Semi-Int",
  "weekly": "Weekly",
  "refresher": "Refresher",
  "pass-plus": "Pass+",
  "motorway": "Motorway",
  "other": "Custom",
};

const EXPIRY_HOURS = 24; // Jobs expire after 24 hours

export function usePendingJobsPreview(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["pending-jobs-preview", instructorId],
    queryFn: async (): Promise<JobPreview | null> => {
      // Fetch first pending job offer
      const { data: enquiry, error } = await supabase
        .from("course_enquiries")
        .select("id, course_type, requested_hours, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!enquiry) return null;

      // Fetch instructor's hourly rate for payment calculation
      let hourlyRate = 35; // Default
      if (instructorId) {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", instructorId)
          .maybeSingle();
        
        if (instructor?.hourly_rate) {
          hourlyRate = instructor.hourly_rate;
        }
      }

      const hours = enquiry.requested_hours || 10;
      const estimatedPayment = hours * hourlyRate;
      
      // Calculate expiry time
      const createdAt = new Date(enquiry.created_at);
      const expiryTime = new Date(createdAt.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);
      const now = new Date();
      const expiresInMinutes = Math.max(0, differenceInMinutes(expiryTime, now));
      const expiresInHours = Math.max(0, differenceInHours(expiryTime, now));
      
      // Determine urgency level
      let urgencyLevel: "normal" | "warning" | "critical" = "normal";
      if (expiresInHours < 1) {
        urgencyLevel = "critical";
      } else if (expiresInHours < 4) {
        urgencyLevel = "warning";
      }

      return {
        id: enquiry.id,
        courseType: enquiry.course_type,
        courseTypeShort: courseTypeShortLabels[enquiry.course_type] || "Course",
        hours,
        estimatedPayment,
        createdAt: enquiry.created_at,
        expiresInHours,
        expiresInMinutes,
        urgencyLevel,
      };
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute for timer updates
  });
}
