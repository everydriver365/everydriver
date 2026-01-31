import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GpsPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  heading: number | null;
  road_name: string | null;
  recorded_at: string;
  accuracy_m: number | null;
}

export interface RouteData {
  id: string;
  name: string;
  description: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  start_location: string | null;
  end_location: string | null;
  created_at: string;
  telematics_id: string | null;
  pupil?: {
    name: string;
  } | null;
}

export interface TripReplayState {
  isPlaying: boolean;
  currentIndex: number;
  playbackSpeed: number;
  progress: number;
  currentTime: Date | null;
  elapsedSeconds: number;
  totalSeconds: number;
}

interface UseTripReplayOptions {
  routeId?: string;
  telematicsId?: string;
}

export function useTripReplay({ routeId, telematicsId }: UseTripReplayOptions) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [state, setState] = useState<TripReplayState>({
    isPlaying: false,
    currentIndex: 0,
    playbackSpeed: 1,
    progress: 0,
    currentTime: null,
    elapsedSeconds: 0,
    totalSeconds: 0,
  });

  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Fetch route and GPS data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        let sessionId = telematicsId;

        // If routeId provided, fetch route details first
        if (routeId) {
          const { data: routeData, error: routeError } = await supabase
            .from("saved_routes")
            .select(`
              *,
              pupil:pupil_id (name)
            `)
            .eq("id", routeId)
            .single();

          if (routeError) throw routeError;
          setRoute(routeData as RouteData);
          sessionId = routeData.telematics_id;
        }

        if (!sessionId) {
          throw new Error("No telematics session ID available");
        }

        // Fetch GPS points
        const { data: points, error: pointsError } = await supabase
          .from("telematics_gps_points")
          .select("*")
          .eq("telematics_id", sessionId)
          .order("recorded_at", { ascending: true });

        if (pointsError) throw pointsError;

        if (!points || points.length === 0) {
          throw new Error("No GPS data available for this route");
        }

        setGpsPoints(points as GpsPoint[]);

        // Calculate total duration
        const startTime = new Date(points[0].recorded_at);
        const endTime = new Date(points[points.length - 1].recorded_at);
        const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        setState(prev => ({
          ...prev,
          currentTime: startTime,
          totalSeconds,
        }));

      } catch (err) {
        console.error("Error fetching trip data:", err);
        setError(err instanceof Error ? err.message : "Failed to load trip data");
      } finally {
        setIsLoading(false);
      }
    }

    if (routeId || telematicsId) {
      fetchData();
    }
  }, [routeId, telematicsId]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!state.isPlaying || gpsPoints.length === 0) return;

    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // seconds
    lastFrameTimeRef.current = timestamp;

    setState(prev => {
      const newElapsed = prev.elapsedSeconds + (deltaTime * prev.playbackSpeed);
      const startTime = new Date(gpsPoints[0].recorded_at).getTime();
      const currentTimeMs = startTime + (newElapsed * 1000);

      // Find the current point based on time
      let newIndex = prev.currentIndex;
      for (let i = prev.currentIndex; i < gpsPoints.length; i++) {
        const pointTime = new Date(gpsPoints[i].recorded_at).getTime();
        if (pointTime <= currentTimeMs) {
          newIndex = i;
        } else {
          break;
        }
      }

      const progress = prev.totalSeconds > 0 
        ? Math.min((newElapsed / prev.totalSeconds) * 100, 100)
        : 0;

      // Check if we've reached the end
      if (newIndex >= gpsPoints.length - 1 || newElapsed >= prev.totalSeconds) {
        return {
          ...prev,
          isPlaying: false,
          currentIndex: gpsPoints.length - 1,
          progress: 100,
          elapsedSeconds: prev.totalSeconds,
          currentTime: new Date(gpsPoints[gpsPoints.length - 1].recorded_at),
        };
      }

      return {
        ...prev,
        currentIndex: newIndex,
        progress,
        elapsedSeconds: newElapsed,
        currentTime: new Date(currentTimeMs),
      };
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [state.isPlaying, gpsPoints]);

  // Start/stop animation
  useEffect(() => {
    if (state.isPlaying) {
      lastFrameTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, animate]);

  const play = useCallback(() => {
    if (gpsPoints.length === 0) return;
    
    // If at end, restart from beginning
    if (state.currentIndex >= gpsPoints.length - 1) {
      setState(prev => ({
        ...prev,
        currentIndex: 0,
        elapsedSeconds: 0,
        progress: 0,
        currentTime: new Date(gpsPoints[0].recorded_at),
        isPlaying: true,
      }));
    } else {
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [gpsPoints, state.currentIndex]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const seekToProgress = useCallback((progressPercent: number) => {
    if (gpsPoints.length === 0) return;

    const targetSeconds = (progressPercent / 100) * state.totalSeconds;
    const startTime = new Date(gpsPoints[0].recorded_at).getTime();
    const targetTimeMs = startTime + (targetSeconds * 1000);

    // Find the point closest to target time
    let targetIndex = 0;
    for (let i = 0; i < gpsPoints.length; i++) {
      const pointTime = new Date(gpsPoints[i].recorded_at).getTime();
      if (pointTime <= targetTimeMs) {
        targetIndex = i;
      } else {
        break;
      }
    }

    setState(prev => ({
      ...prev,
      currentIndex: targetIndex,
      elapsedSeconds: targetSeconds,
      progress: progressPercent,
      currentTime: new Date(targetTimeMs),
    }));
  }, [gpsPoints, state.totalSeconds]);

  const seekToIndex = useCallback((index: number) => {
    if (index < 0 || index >= gpsPoints.length) return;

    const startTime = new Date(gpsPoints[0].recorded_at).getTime();
    const pointTime = new Date(gpsPoints[index].recorded_at).getTime();
    const elapsedSeconds = (pointTime - startTime) / 1000;
    const progress = state.totalSeconds > 0 
      ? (elapsedSeconds / state.totalSeconds) * 100 
      : 0;

    setState(prev => ({
      ...prev,
      currentIndex: index,
      elapsedSeconds,
      progress,
      currentTime: new Date(pointTime),
    }));
  }, [gpsPoints, state.totalSeconds]);

  const restart = useCallback(() => {
    if (gpsPoints.length === 0) return;

    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentIndex: 0,
      elapsedSeconds: 0,
      progress: 0,
      currentTime: new Date(gpsPoints[0].recorded_at),
    }));
  }, [gpsPoints]);

  // Current point data
  const currentPoint = gpsPoints[state.currentIndex] || null;

  // Calculate route bounds
  const bounds = gpsPoints.length > 0 ? {
    minLat: Math.min(...gpsPoints.map(p => p.latitude)),
    maxLat: Math.max(...gpsPoints.map(p => p.latitude)),
    minLng: Math.min(...gpsPoints.map(p => p.longitude)),
    maxLng: Math.max(...gpsPoints.map(p => p.longitude)),
  } : null;

  // Speed statistics
  const speedStats = gpsPoints.length > 0 ? {
    avg: route?.avg_speed_kmh || gpsPoints.reduce((sum, p) => sum + (p.speed_kmh || 0), 0) / gpsPoints.length,
    max: route?.max_speed_kmh || Math.max(...gpsPoints.map(p => p.speed_kmh || 0)),
    current: currentPoint?.speed_kmh || 0,
    limit: currentPoint?.speed_limit_kmh || null,
  } : null;

  return {
    route,
    gpsPoints,
    currentPoint,
    bounds,
    speedStats,
    isLoading,
    error,
    state,
    play,
    pause,
    togglePlayPause,
    setPlaybackSpeed,
    seekToProgress,
    seekToIndex,
    restart,
  };
}
