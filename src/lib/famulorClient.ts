import { supabase } from "@/integrations/supabase/client";

export type FamulorPurpose = "receptionist" | "reminder" | "win_back" | "test" | "custom";

export interface TriggerCallInput {
  pupil_id?: string;
  phone_number?: string;
  purpose: FamulorPurpose;
  custom_prompt?: string;
  lesson_id?: string;
}

export async function triggerFamulorCall(input: TriggerCallInput) {
  const { data, error } = await supabase.functions.invoke("famulor-trigger-call", { body: input });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as { success: true; log_id: string; famulor: any };
}
