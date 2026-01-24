import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null; // m/s from GPS
  speedKmh: number; // Converted to km/h
  heading: number | null;
  timestamp: number;
}

export interface TrackerState {
  status: 'idle' | 'checking' | 'ready' | 'tracking' | 'error';
  message: string;
  hasPermission: boolean | null;
}

export interface SpeedLimitInfo {
  speedLimit: number | null;
  roadName: string | null;
  isExceeding: boolean;
  excessKmh: number;
}

interface UseSimpleGPSTrackerOptions {
  recordIntervalMs?: number; // How often to record to DB (ms)
  speedLimitToleranceKmh?: number; // Tolerance before flagging speeding
  onSpeedingDetected?: (speedKmh: number, limitKmh: number, location: { lat: number; lon: number }) => void;
}

const DEFAULT_OPTIONS: UseSimpleGPSTrackerOptions = {
  recordIntervalMs: 2000, // Record every 2 seconds
  speedLimitToleranceKmh: 8, // 8 km/h tolerance
};

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const useSimpleGPSTracker = (options: UseSimpleGPSTrackerOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<TrackerState>({
    status: 'idle',
    message: 'Ready to track',
    hasPermission: null,
  });
  
  const [currentPosition, setCurrentPosition] = useState<GPSPoint | null>(null);
  const [speedLimitInfo, setSpeedLimitInfo] = useState<SpeedLimitInfo>({
    speedLimit: null,
    roadName: null,
    isExceeding: false,
    excessKmh: 0,
  });
  const [totalDistance, setTotalDistance] = useState(0);
  const [pointCount, setPointCount] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  
  const sessionIdRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastRecordTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<GPSPoint | null>(null);
  const speedLimitCacheRef = useRef<{ lat: number; lon: number; limit: number | null; road: string | null; time: number } | null>(null);
  const speedingStartRef = useRef<number | null>(null);

  // Check GPS availability
  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        message: 'GPS not available on this device',
        hasPermission: false,
      });
    }
  }, []);

  // Request wake lock to keep screen on
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[GPS Tracker] Wake lock acquired');
      } catch (err) {
        console.warn('[GPS Tracker] Wake lock failed:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('[GPS Tracker] Wake lock released');
    }
  }, []);

  // Check permission status
  const checkPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, status: 'checking', message: 'Checking GPS permission...' }));
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setState(prev => ({ ...prev, hasPermission: true, status: 'ready', message: 'GPS ready' }));
          resolve(true);
        },
        (error) => {
          const message = error.code === 1 
            ? 'GPS permission denied. Please enable location access.' 
            : 'GPS unavailable. Please try again.';
          setState({ status: 'error', message, hasPermission: error.code === 1 ? false : null });
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  // Fetch speed limit from Google Maps (with caching)
  const fetchSpeedLimit = useCallback(async (lat: number, lon: number): Promise<void> => {
    // Use cache if position hasn't changed much (within ~50m) and cache is fresh (<30s)
    const cache = speedLimitCacheRef.current;
    if (cache) {
      const dist = calculateDistance(lat, lon, cache.lat, cache.lon);
      const age = Date.now() - cache.time;
      if (dist < 50 && age < 30000) {
        return; // Use existing cached values
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-speed-limits', {
        body: { lat, lon },
      });

      if (!error && data) {
        speedLimitCacheRef.current = {
          lat,
          lon,
          limit: data.speedLimit,
          road: data.roadName,
          time: Date.now(),
        };

        setSpeedLimitInfo(prev => ({
          ...prev,
          speedLimit: data.speedLimit,
          roadName: data.roadName,
        }));
        
        console.log(`[GPS] Road: ${data.roadName}, Limit: ${data.speedLimit} km/h (${data.confidence})`);
      }
    } catch (err) {
      console.warn('[GPS Tracker] Speed limit fetch failed:', err);
    }
  }, []);

  // Record GPS point to database
  const recordPoint = useCallback(async (point: GPSPoint) => {
    if (!sessionIdRef.current) return;

    try {
      await supabase.from('telematics_gps_points').insert({
        telematics_id: sessionIdRef.current,
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude,
        accuracy: point.accuracy,
        speed_kmh: point.speedKmh,
        heading: point.heading,
        speed_limit_kmh: speedLimitCacheRef.current?.limit,
        road_name: speedLimitCacheRef.current?.road,
        recorded_at: new Date(point.timestamp).toISOString(),
      });

      setPointCount(prev => prev + 1);
    } catch (err) {
      console.error('[GPS Tracker] Failed to record point:', err);
    }
  }, []);

  // Handle position update
  const handlePosition = useCallback(async (position: GeolocationPosition) => {
    const coords = position.coords;
    const now = Date.now();

    const point: GPSPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      speed: coords.speed,
      speedKmh: coords.speed ? coords.speed * 3.6 : 0,
      heading: coords.heading,
      timestamp: now,
    };

    // Always update current position for UI display (even with poor accuracy)
    setCurrentPosition(point);

    // Calculate distance from last position (filter GPS jumps)
    const lastPos = lastPositionRef.current;
    if (lastPos && coords.accuracy <= 100) {
      const dist = calculateDistance(
        lastPos.latitude, lastPos.longitude,
        point.latitude, point.longitude
      );
      
      // Only count distance if points are reasonably close (< 500m) to avoid GPS jumps
      if (dist < 500 && dist > 1) {
        setTotalDistance(prev => prev + (dist / 1000));
      }
    }
    lastPositionRef.current = point;

    // Add to route points (filter poor accuracy for cleaner route line)
    if (coords.accuracy <= 50) {
      setRoutePoints(prev => [...prev, [point.latitude, point.longitude]]);
    }

    // Update max speed
    if (point.speedKmh > maxSpeed) {
      setMaxSpeed(point.speedKmh);
    }

    // Always fetch speed limit - even with poor GPS accuracy, road lookup still works
    fetchSpeedLimit(point.latitude, point.longitude);

    // Check speeding
    const cache = speedLimitCacheRef.current;
    if (cache?.limit && point.speedKmh > 5) { // Only check if moving
      const excess = point.speedKmh - cache.limit - opts.speedLimitToleranceKmh!;
      const isExceeding = excess > 0;

      setSpeedLimitInfo(prev => ({
        ...prev,
        isExceeding,
        excessKmh: Math.max(0, excess),
      }));

      // Track speeding duration for events
      if (isExceeding) {
        if (!speedingStartRef.current) {
          speedingStartRef.current = now;
        } else if (now - speedingStartRef.current > 3000) {
          // Speeding for 3+ seconds, trigger callback
          opts.onSpeedingDetected?.(point.speedKmh, cache.limit, {
            lat: point.latitude,
            lon: point.longitude,
          });
          speedingStartRef.current = now; // Reset to avoid repeated triggers
        }
      } else {
        speedingStartRef.current = null;
      }
    }

    // Record to database at interval (use moderate accuracy threshold)
    if (now - lastRecordTimeRef.current >= opts.recordIntervalMs! && coords.accuracy <= 50) {
      lastRecordTimeRef.current = now;
      recordPoint(point);
    }
  }, [maxSpeed, opts, fetchSpeedLimit, recordPoint]);

  // Handle position error
  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('[GPS Tracker] Position error:', error);
    
    const messages: Record<number, string> = {
      1: 'GPS permission denied',
      2: 'GPS unavailable - try going outside',
      3: 'GPS timeout - retrying...',
    };

    setState(prev => ({
      ...prev,
      status: error.code === 3 ? prev.status : 'error',
      message: messages[error.code] || 'GPS error',
    }));
  }, []);

  // Start tracking
  const startTracking = useCallback(async (telematicsSessionId: string): Promise<boolean> => {
    // Check permission first
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      return false;
    }

    // Request wake lock
    await requestWakeLock();

    // Reset state
    sessionIdRef.current = telematicsSessionId;
    lastRecordTimeRef.current = 0;
    lastPositionRef.current = null;
    speedLimitCacheRef.current = null;
    speedingStartRef.current = null;
    setTotalDistance(0);
    setPointCount(0);
    setMaxSpeed(0);
    setRoutePoints([]);
    setSpeedLimitInfo({
      speedLimit: null,
      roadName: null,
      isExceeding: false,
      excessKmh: 0,
    });

    setState({ status: 'tracking', message: 'Tracking active', hasPermission: true });

    // Start watching position with high accuracy settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always get fresh position, no cached data
      }
    );

    console.log('[GPS Tracker] Started tracking for session:', telematicsSessionId);
    return true;
  }, [checkPermission, requestWakeLock, handlePosition, handleError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    releaseWakeLock();

    const result = {
      totalDistance,
      pointCount,
      maxSpeed,
      routePoints,
    };

    sessionIdRef.current = null;
    setState({ status: 'idle', message: 'Tracking stopped', hasPermission: true });

    console.log('[GPS Tracker] Stopped tracking:', result);
    return result;
  }, [totalDistance, pointCount, maxSpeed, routePoints, releaseWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    state,
    currentPosition,
    speedLimitInfo,
    totalDistance,
    pointCount,
    maxSpeed,
    routePoints,
    checkPermission,
    startTracking,
    stopTracking,
  };
};
