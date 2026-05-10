import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type RoutingMode = "ai" | "mobile" | "schedule";
export type PhoneProvider = "twilio_provisioned" | "byo_forwarded";
export type PhoneStatus = "active" | "releasing" | "released";

export interface InstructorPhoneNumber {
  id: string;
  instructor_id: string;
  phone_number: string;
  provider: PhoneProvider;
  twilio_sid: string | null;
  routing_mode: RoutingMode;
  forward_to_mobile: string | null;
  monthly_cost_pence: number | null;
  status: PhoneStatus;
}

export function useInstructorPhoneNumber(instructorId: string | undefined) {
  const [data, setData] = useState<InstructorPhoneNumber | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    const { data: row } = await supabase
      .from("instructor_phone_numbers")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("status", "active")
      .maybeSingle();
    setData(row as InstructorPhoneNumber | null);
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const update = useCallback(
    async <K extends keyof InstructorPhoneNumber>(field: K, value: InstructorPhoneNumber[K]) => {
      if (!data) return;
      const previous = data[field];
      setData(p => p ? { ...p, [field]: value } : p);
      const { error } = await supabase
        .from("instructor_phone_numbers")
        .update({ [field]: value })
        .eq("id", data.id);
      if (error) {
        setData(p => p ? { ...p, [field]: previous } : p);
        toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Saved" });
      }
    },
    [data],
  );

  const searchNumbers = useCallback(async (areaCode: string) => {
    setBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("phone-number-search", {
        body: { areaCode },
      });
      if (error) throw error;
      return (res?.numbers ?? []) as { phoneNumber: string; friendlyName: string; locality?: string }[];
    } finally { setBusy(false); }
  }, []);

  const provision = useCallback(async (phoneNumber: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("phone-number-provision", {
        body: { phoneNumber },
      });
      if (error) throw error;
      await refresh();
      toast({ title: "Number active", description: phoneNumber });
    } catch (e: any) {
      toast({ title: "Couldn't provision", description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }, [refresh]);

  const addByo = useCallback(async (landline: string, mobile: string) => {
    if (!instructorId) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("instructor_phone_numbers")
        .insert({
          instructor_id: instructorId,
          phone_number: landline,
          provider: "byo_forwarded",
          forward_to_mobile: mobile,
          routing_mode: "schedule",
        });
      if (error) throw error;
      await refresh();
      toast({ title: "Landline saved" });
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }, [instructorId, refresh]);

  const release = useCallback(async () => {
    if (!data) return;
    setBusy(true);
    try {
      if (data.provider === "twilio_provisioned") {
        const { error } = await supabase.functions.invoke("phone-number-release", {
          body: { id: data.id },
        });
        if (error) throw error;
      } else {
        await supabase
          .from("instructor_phone_numbers")
          .update({ status: "released" as const })
          .eq("id", data.id);
      }
      setData(null);
      toast({ title: "Number released" });
    } catch (e: any) {
      toast({ title: "Couldn't release", description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }, [data]);

  return { data, loading, busy, refresh, update, searchNumbers, provision, addByo, release };
}
