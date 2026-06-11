import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartDateOnlyBookingPanel } from "@/components/booking/StartDateOnlyBookingPanel";

interface Props {
  instructorId: string;
  instructor: any;
  courseId: string;
  courseHours: number;
  ensurePupilId: () => Promise<string | null>;
  onReserved?: (reservationId: string) => void;
  /** The existing "pick exact lesson times" UI (scheduler block). */
  children: ReactNode;
}

/**
 * Wraps the existing lesson scheduler in a Tabs UI when the instructor has
 * enabled "Reserve start date only" booking. Otherwise renders children directly.
 */
export function BookingModeTabs({
  instructorId,
  instructor,
  courseId,
  courseHours,
  ensurePupilId,
  onReserved,
  children,
}: Props) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["booking-settings", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_booking_settings")
        .select("allow_start_date_only_booking, start_date_only_max_hours_per_week")
        .eq("instructor_id", instructorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!instructorId,
  });

  const enabled = !isLoading && settings?.allow_start_date_only_booking === true;

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Tabs defaultValue="exact" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="exact">Pick exact lesson times</TabsTrigger>
        <TabsTrigger value="reserve">Reserve start date only</TabsTrigger>
      </TabsList>
      <TabsContent value="exact" className="mt-0">
        {children}
      </TabsContent>
      <TabsContent value="reserve" className="mt-0">
        <StartDateOnlyBookingPanel
          instructorId={instructorId}
          instructor={instructor}
          courseId={courseId}
          courseHours={courseHours}
          maxHoursPerWeekCap={settings?.start_date_only_max_hours_per_week ?? null}
          pupilId={null}
          ensurePupilId={ensurePupilId}
          onReserved={onReserved}
        />
      </TabsContent>
    </Tabs>
  );
}
