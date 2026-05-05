import { supabase } from "@/integrations/supabase/client";

export type PhoneTrackingAuditEvent =
  | "permission_changed"
  | "tracking_started"
  | "tracking_stopped";

interface LogArgs {
  instructorId: string | null | undefined;
  pupilId?: string | null;
  event: PhoneTrackingAuditEvent;
  status?: string | null;
  details?: Record<string, any>;
}

/** Best-effort audit logger — never throws. */
export async function logPhoneTrackingEvent({
  instructorId,
  pupilId = null,
  event,
  status = null,
  details = {},
}: LogArgs) {
  if (!instructorId) return;
  try {
    await supabase.from("phone_tracking_audit").insert([
      {
        instructor_id: instructorId,
        pupil_id: pupilId,
        event_type: event,
        status,
        details,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    ] as any);
  } catch {
    // swallow — auditing must not break UX
  }
}
