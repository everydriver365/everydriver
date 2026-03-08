import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/hooks/useInterpolatedPosition";

interface RecordedCoordinate {
  lat: number;
  lng: number;
  speed_kmh?: number;
  timestamp: string;
}

interface UseLessonRouteRecorderReturn {
  isRecording: boolean;
  coordinates: RecordedCoordinate[];
  distanceKm: number;
  elapsedSeconds: number;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
  error: string | null;
}

export function useLessonRouteRecorder(
  instructorId: string,
  pupilId?: string | null,
  lessonId?: string | null
): UseLessonRouteRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [coordinates, setCoordinates] = useState<RecordedCoordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const coordsRef = useRef<RecordedCoordinate[]>([]);
  const distanceRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("[RouteRecorder] Wake lock acquired");
      }
    } catch (e) {
      console.warn("[RouteRecorder] Wake lock failed:", e);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setError(null);
    setCoordinates([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    coordsRef.current = [];
    distanceRef.current = 0;
    startTimeRef.current = new Date();
    setIsRecording(true);
    acquireWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newCoord: RecordedCoordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed_kmh: position.coords.speed != null ? position.coords.speed * 3.6 : undefined,
          timestamp: new Date().toISOString(),
        };

        const prev = coordsRef.current;
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const d = haversineKm(last.lat, last.lng, newCoord.lat, newCoord.lng);
          // Filter out jitter (< 3m movement)
          if (d < 0.003) return;
          distanceRef.current += d;
          setDistanceKm(distanceRef.current);
        }

        coordsRef.current = [...prev, newCoord];
        setCoordinates(coordsRef.current);
      },
      (err) => {
        console.error("[RouteRecorder] GPS error:", err.message);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
      }
    }, 1000);
  }, []);

  const stopRecording = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    releaseWakeLock();
    setIsRecording(false);
    const finalCoords = coordsRef.current;

    if (finalCoords.length < 2) {
      setError("Not enough GPS points recorded");
      return;
    }

    const startedAt = startTimeRef.current?.toISOString() || finalCoords[0].timestamp;
    const endedAt = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000
    );

    try {
      const { error: dbError } = await (supabase.from("lesson_routes") as any).insert({
        instructor_id: instructorId,
        pupil_id: pupilId || null,
        lesson_id: lessonId || null,
        coordinates: finalCoords as any,
        distance_km: distanceRef.current,
        duration_minutes: durationMinutes,
        started_at: startedAt,
        ended_at: endedAt,
      });

      if (dbError) throw dbError;
    } catch (err) {
      console.error("[RouteRecorder] Save error:", err);
      setError("Failed to save route");
    }
  }, [instructorId, pupilId, lessonId, releaseWakeLock]);

  // Re-acquire wake lock when page becomes visible during recording
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && watchIdRef.current !== null) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      releaseWakeLock();
    };
  }, [acquireWakeLock, releaseWakeLock]);

  return {
    isRecording,
    coordinates,
    distanceKm,
    elapsedSeconds,
    startRecording,
    stopRecording,
    error,
  };
}
