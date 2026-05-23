import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNewEnquiriesCount(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["new-enquiries-count", instructorId],
    enabled: !!instructorId,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const [booking, course] = await Promise.all([
        supabase
          .from("booking_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("assigned_instructor_id", instructorId!)
          .eq("status", "new"),
        supabase
          .from("course_enquiries")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId!)
          .eq("status", "new"),
      ]);
      if (booking.error) throw booking.error;
      if (course.error) throw course.error;
      return (booking.count ?? 0) + (course.count ?? 0);
    },
  });
}
