import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTrackingSession } from "@/hooks/useActiveTrackingSession";
import { Pill } from "@/components/instructor/ui";

interface Props {
  instructorId: string | undefined;
  /** Show label "Tracking" next to the dot. When false, dot only. */
  showLabel?: boolean;
}

/**
 * Subtle persistent indicator: a pulsing green dot (+ optional "Tracking" label)
 * shown only when:
 *   - The instructor has `auto_start_tracker = true`, AND
 *   - `useActiveTrackingSession` reports an open lesson_telematics row.
 *
 * Hidden on the live tracking screen itself to avoid redundancy.
 * Tapping navigates to /instructor/tracking.
 */
export function AutoTrackingIndicator({ instructorId, showLabel = true }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const isTrackingPage =
    location.pathname.startsWith("/instructor/tracking") ||
    location.pathname.startsWith("/instructor/traccar");

  const { data: prefs } = useQuery({
    queryKey: ["instructor-auto-start-tracker", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("auto_start_tracker")
        .eq("id", instructorId!)
        .maybeSingle();
      return data as { auto_start_tracker: boolean | null } | null;
    },
  });

  const enabled = !!instructorId && !!prefs?.auto_start_tracker && !isTrackingPage;
  const { data: activeSession } = useActiveTrackingSession(enabled ? instructorId : undefined);

  if (!enabled || !activeSession) return null;

  return (
    <Pill
      color="green"
      dot
      animated
      label={showLabel ? "Tracking" : ""}
      onClick={() => navigate("/instructor/tracking")}
      ariaLabel="GPS tracking active — tap to view live map"
    />
  );
}
