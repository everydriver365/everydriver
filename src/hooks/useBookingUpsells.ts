import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookingUpsell {
  id: string;
  name: string;
  short_description: string;
  full_description: string | null;
  price: number;
  refund_policy: string | null;
  icon_name: string | null;
  badge_text: string | null;
  highlight_color: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

export function useBookingUpsells() {
  return useQuery({
    queryKey: ["booking-upsells"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_upsells")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching booking upsells:", error);
        throw error;
      }

      return data as BookingUpsell[];
    },
  });
}

export function useAllBookingUpsells() {
  return useQuery({
    queryKey: ["all-booking-upsells"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_upsells")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching all booking upsells:", error);
        throw error;
      }

      return data as BookingUpsell[];
    },
  });
}
