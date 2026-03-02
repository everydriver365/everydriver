import { useState, useEffect, useCallback, useRef } from "react";

interface EnRouteETA {
  etaMinutes: number | null;
  etaText: string | null;
  trafficCondition: string | null;
  instructorLat: number | null;
  instructorLng: number | null;
  heading: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useInstructorEnRouteETA(
  pupilId: string | null,
  lessonId: string | null,
  enabled: boolean = true
): EnRouteETA {
  const [state, setState] = useState<EnRouteETA>({
    etaMinutes: null,
    etaText: null,
    trafficCondition: null,
    instructorLat: null,
    instructorLng: null,
    heading: null,
    isLoading: true,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!pupilId || !lessonId || !enabled) return;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const url = `https://${projectId}.supabase.co/functions/v1/get-instructor-location`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ pupil_id: pupilId, lesson_id: lessonId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If 403, instructor no longer en_route
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || "Failed to fetch location",
        }));
        return;
      }

      setState({
        etaMinutes: data.eta_minutes ?? null,
        etaText: data.eta_text ?? null,
        trafficCondition: data.traffic_condition ?? null,
        instructorLat: data.latitude ?? null,
        instructorLng: data.longitude ?? null,
        heading: data.heading ?? null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Network error",
      }));
    }
  }, [pupilId, lessonId, enabled]);

  useEffect(() => {
    if (!enabled || !pupilId || !lessonId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLocation, enabled, pupilId, lessonId]);

  return state;
}
