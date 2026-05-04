import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIBookingRequest {
  id: string;
  instructor_id: string;
  source_channel: "phone_in" | "phone_out" | "whatsapp" | "webchat";
  pupil_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  requested_start: string;
  duration_minutes: number;
  notes: string | null;
  status: "pending" | "approved" | "declined" | "expired" | "countered";
  created_at: string;
  resulting_lesson_id: string | null;
}

export function useAIBookingRequests(instructorId?: string) {
  const [rows, setRows] = useState<AIBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("ai_booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (instructorId) q = q.eq("instructor_id", instructorId);
    const { data } = await q;
    setRows((data ?? []) as AIBookingRequest[]);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { load(); }, [load]);

  const decide = async (
    request_id: string,
    action: "approve" | "decline" | "counter",
    extra?: { counter_start?: string; counter_duration_minutes?: number },
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("famulor-booking-decision", {
        body: { request_id, action, ...(extra ?? {}) },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message ?? "Failed");
      toast.success(
        action === "approve" ? "Lesson scheduled"
        : action === "decline" ? "Request declined"
        : "Counter-offer sent",
      );
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't update request");
    }
  };

  return { rows, loading, reload: load, decide };
}
