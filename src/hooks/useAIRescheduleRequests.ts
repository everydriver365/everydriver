import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIRescheduleRequest {
  id: string;
  instructor_id: string;
  lesson_id: string;
  pupil_id: string | null;
  source_channel: "phone_in" | "phone_out" | "whatsapp" | "webchat";
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  original_start: string;
  original_duration_minutes: number;
  requested_start: string;
  requested_duration_minutes: number;
  notes: string | null;
  status: "pending" | "approved" | "auto_approved" | "declined" | "expired";
  auto_approved: boolean;
  created_at: string;
}

export function useAIRescheduleRequests(instructorId?: string) {
  const [rows, setRows] = useState<AIRescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("ai_reschedule_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (instructorId) q = q.eq("instructor_id", instructorId);
    const { data } = await q;
    setRows((data ?? []) as AIRescheduleRequest[]);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { load(); }, [load]);

  const decide = async (request_id: string, action: "approve" | "decline") => {
    try {
      const { data, error } = await supabase.functions.invoke("famulor-reschedule-decision", {
        body: { request_id, action },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error ?? error?.message ?? "Failed");
      }
      toast.success(action === "approve" ? "Lesson rescheduled" : "Reschedule declined");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't update request");
    }
  };

  return { rows, loading, reload: load, decide };
}
