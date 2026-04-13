import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

interface InstructorLastPosition {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  roadName: string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  isLoading: boolean;
}

export function useInstructorLastPosition(instructorId: string | null): InstructorLastPosition {
  const [position, setPosition] = useState<Omit<InstructorLastPosition, "isLoading">>({
    latitude: null,
    longitude: null,
    heading: null,
    speedKmh: null,
    roadName: null,
    lastSeenAt: null,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const processData = useCallback((data: any) => {
    if (!data) return;
    
    const trackTime = data.last_seen_at ? new Date(data.last_seen_at) : null;
    const now = new Date();
    const isRecent = trackTime ? (now.getTime() - trackTime.getTime()) < 60000 : false;

    setPosition({
      latitude: data.last_latitude ? Number(data.last_latitude) : null,
      longitude: data.last_longitude ? Number(data.last_longitude) : null,
      heading: data.last_heading ? Number(data.last_heading) : null,
      speedKmh: data.last_speed_kmh ? Number(data.last_speed_kmh) : null,
      roadName: data.last_road_name || null,
      lastSeenAt: data.last_seen_at || null,
      isActive: isRecent && data.is_active,
    });
  }, []);

  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("gps_devices")
          .select("last_latitude, last_longitude, last_heading, last_speed_kmh, last_road_name, last_seen_at, is_active")
          .eq("instructor_id", instructorId)
          .order("last_seen_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) processData(data);
      } catch (err) {
        console.error("Error fetching instructor position:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [instructorId, processData]);

  useRealtimeSubscription(
    "gps_devices",
    "UPDATE",
    (payload) => {
      processData(payload.new);
    },
    {
      filter: instructorId ? `instructor_id=eq.${instructorId}` : undefined,
      enabled: !!instructorId,
    }
  );

  return { ...position, isLoading };
}
