import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  instructorId: string;
  tableName: string;
  recordId: string;
  action: "insert" | "update" | "soft_delete" | "restore";
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

export async function logAudit({
  instructorId,
  tableName,
  recordId,
  action,
  oldValues = null,
  newValues = null,
}: AuditLogParams) {
  try {
    await supabase.from("data_audit_log").insert({
      instructor_id: instructorId,
      table_name: tableName,
      record_id: recordId,
      action,
      old_values: oldValues as any,
      new_values: newValues as any,
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

/** Soft delete a record by setting deleted_at = now() and logging it */
export async function softDelete(
  tableName: "pupils" | "payment_history" | "lesson_history" | "scheduled_lessons" | "instructor_expenses",
  recordId: string,
  instructorId: string,
  oldRecord?: Record<string, unknown> | null,
) {
  const { error } = await supabase
    .from(tableName)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq("id", recordId);

  if (error) throw error;

  await logAudit({
    instructorId,
    tableName,
    recordId,
    action: "soft_delete",
    oldValues: oldRecord,
  });
}
