import { supabase } from "@/integrations/supabase/client";

interface TriggerAutomationsParams {
  triggerType: string;
  instructorId: string;
  pupilId?: string;
  pupilName?: string;
  context?: Record<string, any>;
}

/**
 * Fire-and-forget call to process both automations and workflows
 * for a given trigger event. Uses process-workflows which handles
 * both workflows AND simple automations.
 */
export async function triggerAutomations({
  triggerType,
  instructorId,
  pupilId,
  pupilName,
  context,
}: TriggerAutomationsParams): Promise<void> {
  try {
    // Fetch pupil phone if not provided in context
    let enrichedContext = { ...context };
    if (pupilId && !enrichedContext?.pupil_phone) {
      const { data: pupil } = await supabase
        .from("pupils")
        .select("phone")
        .eq("id", pupilId)
        .single();
      if (pupil?.phone) {
        enrichedContext.pupil_phone = pupil.phone;
      }
    }

    // Call process-workflows (handles both workflows + simple automations)
    await supabase.functions.invoke("process-workflows", {
      body: {
        trigger_type: triggerType,
        instructor_id: instructorId,
        pupil_id: pupilId,
        pupil_name: pupilName,
        context: enrichedContext,
      },
    });
  } catch (e) {
    // Fire-and-forget — don't break the main flow
    console.error("Automation trigger error:", e);
  }
}
