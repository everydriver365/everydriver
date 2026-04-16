import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActiveSession {
  sessionId: string;
  lessonId: string | null;
  pupilId: string | null;
  pupilName: string | null;
  pupilAvatar: string | null;
  startedAt: Date;
  elapsedMinutes: number;
  currentSpeed: number | null;
  distanceKm: number | null;
  isLive: boolean;
}

export function useActiveSession(instructorId: string | null | undefined) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["active-session", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;

      // Get active GPS device session
      const { data: device, error } = await supabase
        .from("gps_devices")
        .select(`
          id,
          current_session_id,
          current_pupil_id,
          last_speed_kmh,
          last_seen_at
        `)
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .not("current_session_id", "is", null)
        .maybeSingle();

      if (error || !device || !device.current_session_id) {
        return null;
      }

      // Fetch telematics session — only if manually started and not ended
      const { data: telematics } = await supabase
        .from("lesson_telematics")
        .select("id, lesson_id, started_at, total_distance_km, pupil_id, ended_at, manually_started")
        .eq("id", device.current_session_id)
        .is("ended_at", null)
        .eq("manually_started", true)
        .maybeSingle();

      if (!telematics) return null;

      // Fetch pupil info if available
      let pupilName: string | null = null;
      let pupilAvatar: string | null = null;
      const pupilId = telematics.pupil_id || device.current_pupil_id;
      if (pupilId) {
        const { data: pupil } = await supabase
          .from("pupils")
          .select("id, name, profile_image_url")
          .eq("id", pupilId)
          .maybeSingle();
        if (pupil) {
          pupilName = pupil.name;
          pupilAvatar = pupil.profile_image_url;
        }
      }

      const startTime = new Date(telematics.started_at);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);

      const lastSeen = device.last_seen_at ? new Date(device.last_seen_at) : null;
      const isLive = lastSeen 
        ? (now.getTime() - lastSeen.getTime()) < 60 * 1000 
        : false;

      // Don't show the bar if device data is stale (> 60s since last seen)
      if (!isLive) return null;

      return {
        sessionId: telematics.id,
        lessonId: telematics.lesson_id,
        pupilId: pupilId,
        pupilName,
        pupilAvatar,
        startedAt: startTime,
        elapsedMinutes: elapsed,
        currentSpeed: device.last_speed_kmh,
        distanceKm: telematics.total_distance_km,
        isLive,
      } as ActiveSession;
    },
    enabled: !!instructorId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update elapsed time every minute
  useEffect(() => {
    if (!sessionData?.startedAt) return;

    const updateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - sessionData.startedAt.getTime()) / 60000
      );
      setElapsedMinutes(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [sessionData?.startedAt]);

  const activeSession = useMemo(() => {
    if (!sessionData) return null;
    return {
      ...sessionData,
      elapsedMinutes,
    };
  }, [sessionData, elapsedMinutes]);

  return {
    activeSession,
    isLoading,
    hasActiveSession: !!activeSession,
  };
}
