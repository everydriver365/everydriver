import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    
    // Use last_gpsgate_track_time (actual GPS data) instead of last_seen_at (poller artifact)
    const trackTime = data.last_gpsgate_track_time ? new Date(data.last_gpsgate_track_time) : null;
    const now = new Date();
    // Active if real GPS data received within 60 seconds
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

  const fetchPosition = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_latitude, last_longitude, last_heading, last_speed_kmh, last_road_name, last_seen_at, last_gpsgate_track_time, is_active")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        processData(data);
      }
    } catch (err) {
      console.error("Error fetching instructor position:", err);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId, processData]);

  useEffect(() => {
    fetchPosition();

    if (!instructorId) return;

    // Subscribe to realtime updates for instant tracking
    const channel = supabase
      .channel(`gps-position-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gps_devices",
          filter: `instructor_id=eq.${instructorId}`,
        },
        (payload) => {
          processData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchPosition, processData]);

  return { ...position, isLoading };
}
