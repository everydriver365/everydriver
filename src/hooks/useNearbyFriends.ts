import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NearbyFriend {
  id: string;
  name: string;
  profileImageUrl: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speedKmh: number | null;
  lastSeenAt: string;
  distanceKm: number;
}

export function useNearbyFriends(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["nearby-friends", instructorId],
    enabled: !!instructorId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-nearby-instructors", {
        body: { instructorId },
      });
      if (error) throw error;
      return data as {
        friends: NearbyFriend[];
        myPosition: { lat: number; lng: number } | null;
      };
    },
  });
}
