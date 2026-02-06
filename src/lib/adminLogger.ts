import { supabase } from "@/integrations/supabase/client";

interface LogActionParams {
  actionType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction({
  actionType,
  description,
  entityType,
  entityId,
  metadata,
}: LogActionParams) {
  try {
    await supabase.from("admin_activity_log").insert([{
      action_type: actionType,
      description,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata: (metadata as any) || null,
    }]);
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
