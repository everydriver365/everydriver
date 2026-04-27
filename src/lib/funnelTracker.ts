import { supabase } from "@/integrations/supabase/client";

/**
 * Append-only funnel tracker. Fire-and-forget; never blocks UX.
 * Each call inserts a row in `funnel_events` for the current instructor.
 *
 * For one-shot lifecycle events (first_pupil_added, first_lesson_scheduled,
 * first_payment_received) the database triggers handle insertion, so callers
 * here should focus on UI/onboarding step events.
 */
export type FunnelEvent =
  | "signup_started"
  | "onboarding_personal_details"
  | "onboarding_listing_preference"
  | "onboarding_location"
  | "onboarding_vehicle"
  | "onboarding_qualifications"
  | "onboarding_services"
  | "onboarding_plan_selected"
  | "onboarding_website"
  | "onboarding_domain_hosting"
  | "onboarding_payment"
  | "onboarding_completed"
  | "save_offer_shown"
  | "save_offer_accepted"
  | "save_offer_declined"
  | "reengagement_sent"
  | "reengagement_replied"
  | "reengagement_booked";

interface TrackOptions {
  instructorId?: string | null;
  data?: Record<string, unknown>;
}

export async function trackFunnelEvent(
  event: FunnelEvent,
  options: TrackOptions = {}
): Promise<void> {
  try {
    let instructorId = options.instructorId ?? null;

    if (!instructorId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        instructorId = instructor?.id ?? null;
      }
    }

    await supabase.from("funnel_events").insert({
      instructor_id: instructorId,
      event_name: event,
      event_data: (options.data ?? {}) as never,
    });
  } catch (err) {
    // Silent — telemetry must never break flows.
    console.warn("[funnel] tracking failed", event, err);
  }
}
