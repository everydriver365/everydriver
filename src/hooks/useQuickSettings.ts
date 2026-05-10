import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface QuickSettings {
  availability_paused: boolean;
  is_active: boolean;                 // public listing visibility
  pupil_self_booking_enabled: boolean;
  ai_call_divert_enabled: boolean;
  auto_start_tracker: boolean;
  tracking_mode: string;              // 'off' | 'phone' | ...
}

const KEYS: (keyof QuickSettings)[] = [
  "availability_paused",
  "is_active",
  "pupil_self_booking_enabled",
  "ai_call_divert_enabled",
  "auto_start_tracker",
  "tracking_mode",
];

export function useQuickSettings(instructorId: string | undefined) {
  const [data, setData] = useState<QuickSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("instructors")
        .select(KEYS.join(","))
        .eq("id", instructorId)
        .single();
      if (!error && row) setData(row as unknown as QuickSettings);
      setLoading(false);
    })();
  }, [instructorId]);

  const update = useCallback(async <K extends keyof QuickSettings>(field: K, value: QuickSettings[K]) => {
    if (!instructorId || !data) return;
    const previous = data[field];
    setData(p => p ? { ...p, [field]: value } : p);
    const { error } = await supabase
      .from("instructors")
      .update({ [field]: value })
      .eq("id", instructorId);
    if (error) {
      setData(p => p ? { ...p, [field]: previous } : p);
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
    }
  }, [instructorId, data]);

  return { data, loading, update };
}
