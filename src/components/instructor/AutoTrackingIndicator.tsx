import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTrackingSession } from "@/hooks/useActiveTrackingSession";

interface Props {
  instructorId: string | undefined;
  /** Show label "Tracking" next to the dot. When false, dot only. */
  showLabel?: boolean;
}

const GREEN = "#2d8a4e";

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
    <button
      onClick={() => navigate("/instructor/tracking")}
      className="flex items-center gap-1.5 transition-transform active:scale-95"
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label="GPS tracking active — tap to view live map"
      title="Tracking active"
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: GREEN,
          animation: "auto-tracking-pulse 1.5s ease-in-out infinite alternate",
        }}
      />
      {showLabel && (
        <span style={{ fontSize: 10, fontWeight: 500, color: GREEN, lineHeight: 1 }}>
          Tracking
        </span>
      )}
      <style>{`
        @keyframes auto-tracking-pulse {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
      `}</style>
    </button>
  );
}
