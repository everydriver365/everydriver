import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PremiumPlacement {
  instructor_id: string;
  is_active: boolean;
  placement_type: string;
  priority_score: number;
  expires_at: string | null;
}

export function usePremiumPlacements() {
  const [placements, setPlacements] = useState<PremiumPlacement[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("instructor_premium_placements")
        .select("instructor_id, is_active, placement_type, priority_score, expires_at")
        .eq("is_active", true);

      if (data) {
        // Filter out expired placements
        const now = new Date().toISOString();
        setPlacements(
          data.filter((p) => !p.expires_at || p.expires_at > now)
        );
      }
    };
    fetch();
  }, []);

  const getPlacement = (instructorId: string) =>
    placements.find((p) => p.instructor_id === instructorId) || null;

  const isPremium = (instructorId: string) => !!getPlacement(instructorId);

  return { placements, getPlacement, isPremium };
}
