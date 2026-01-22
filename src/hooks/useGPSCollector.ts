import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GPSQuality {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'unavailable';
  accuracy: number | null;
  lastUpdate: Date | null;
}

export interface SpeedLimitData {
  speedLimit: number | null;
  roadName: string | null;
  isExceeding: boolean;
  lastFetched: number;
}

interface UseGPSCollectorOptions {
  minAccuracy?: number; // Maximum acceptable accuracy in meters
  minDistance?: number; // Minimum distance between points to record (meters)
  recordInterval?: number; // Minimum time between recordings (ms)
  enableSpeedLimits?: boolean; // Fetch speed limits from TomTom
}

const DEFAULT_OPTIONS: UseGPSCollectorOptions = {
  minAccuracy: 500, // Accept up to 500m for weak signal areas
  minDistance: 5, // Record if moved at least 5 meters
  recordInterval: 1000, // At least 1 second between recordings
  enableSpeedLimits: true, // Enable speed limit fetching
};

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const evaluateGPSQuality = (accuracy: number | null): GPSQuality['status'] => {
  if (accuracy === null) return 'unavailable';
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
};

export const useGPSCollector = (options: UseGPSCollectorOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isCollecting, setIsCollecting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gpsQuality, setGpsQuality] = useState<GPSQuality>({
    status: 'unavailable',
    accuracy: null,
    lastUpdate: null,
  });
  const [currentPosition, setCurrentPosition] = useState<GPSPoint | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  
  // Speed limit state
  const [speedLimitData, setSpeedLimitData] = useState<SpeedLimitData>({
    speedLimit: null,
    roadName: null,
    isExceeding: false,
    lastFetched: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastRecordedPointRef = useRef<GPSPoint | null>(null);
  const lastRecordTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSpeedLimitFetchRef = useRef<{ lat: number; lon: number; time: number } | null>(null);

  // Request wake lock to keep screen on during tracking
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[GPS Collector] Wake lock acquired');
      } catch (err) {
        console.warn('[GPS Collector] Wake lock failed:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('[GPS Collector] Wake lock released');
    }
  }, []);

  // Fetch speed limit from TomTom via edge function
  const fetchSpeedLimit = useCallback(async (lat: number, lon: number, currentSpeedKmh: number) => {
    const now = Date.now();
    const lastFetch = lastSpeedLimitFetchRef.current;
    
    // Throttle: don't fetch more than once per 3 seconds or if position hasn't changed much
    if (lastFetch) {
      const timeSince = now - lastFetch.time;
      const distance = calculateDistance(lastFetch.lat, lastFetch.lon, lat, lon);
      
      if (timeSince < 3000 && distance < 50) {
        // Just update isExceeding with current speed
        setSpeedLimitData(prev => ({
          ...prev,
          isExceeding: prev.speedLimit !== null && currentSpeedKmh > prev.speedLimit + 5,
        }));
        return speedLimitData;
      }
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('tomtom-speed-limits', {
        body: { lat, lon },
      });

      if (fetchError) {
        console.warn('[GPS Collector] Speed limit fetch failed:', fetchError);
        return null;
      }

      lastSpeedLimitFetchRef.current = { lat, lon, time: now };

      const newData: SpeedLimitData = {
        speedLimit: data?.speedLimit || null,
        roadName: data?.roadName || null,
        isExceeding: data?.speedLimit ? currentSpeedKmh > data.speedLimit + 5 : false,
        lastFetched: now,
      };

      setSpeedLimitData(newData);
      return newData;
    } catch (err) {
      console.error('[GPS Collector] Speed limit error:', err);
      return null;
    }
  }, [speedLimitData]);

  // Record GPS point to database with speed limit
  const recordPoint = useCallback(async (point: GPSPoint, speedLimit: number | null, roadName: string | null) => {
    if (!sessionId) return;

    const speedKmh = point.speed !== null ? point.speed * 3.6 : null;

    try {
      const { error: insertError } = await supabase
        .from('telematics_gps_points')
        .insert({
          telematics_id: sessionId,
          latitude: point.latitude,
          longitude: point.longitude,
          altitude_m: point.altitude,
          accuracy_m: point.accuracy,
          speed_kmh: speedKmh,
          heading: point.heading,
          recorded_at: new Date(point.timestamp).toISOString(),
          speed_limit_kmh: speedLimit,
          road_name: roadName,
        });

      if (insertError) {
        console.error('[GPS Collector] Failed to record point:', insertError);
      } else {
        setPointCount(prev => prev + 1);
        lastRecordedPointRef.current = point;
        lastRecordTimeRef.current = Date.now();
      }
    } catch (err) {
      console.error('[GPS Collector] Error recording point:', err);
    }
  }, [sessionId]);

  // Handle position update from watchPosition
  const handlePositionUpdate = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now();
    const coords = position.coords;

    // Update quality indicator
    setGpsQuality({
      status: evaluateGPSQuality(coords.accuracy),
      accuracy: coords.accuracy,
      lastUpdate: new Date(),
    });

    // Filter by accuracy threshold
    if (coords.accuracy > opts.minAccuracy!) {
      console.log(`[GPS Collector] Skipping low accuracy point: ${coords.accuracy}m`);
      return;
    }

    const point: GPSPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      speed: coords.speed, // Native speed in m/s, can be null
      heading: coords.heading,
      timestamp: position.timestamp,
    };

    setCurrentPosition(point);
    
    // Update current speed (use native speed only, convert to km/h)
    const speedKmh = coords.speed !== null && coords.speed >= 0 ? coords.speed * 3.6 : 0;
    setCurrentSpeed(speedKmh);

    // Fetch speed limit if enabled and moving
    let currentSpeedLimit: number | null = speedLimitData.speedLimit;
    let currentRoadName: string | null = speedLimitData.roadName;
    
    if (opts.enableSpeedLimits && speedKmh > 5) {
      const limitData = await fetchSpeedLimit(point.latitude, point.longitude, speedKmh);
      if (limitData) {
        currentSpeedLimit = limitData.speedLimit;
        currentRoadName = limitData.roadName;
      }
    }

    // Check if we should record this point
    const lastPoint = lastRecordedPointRef.current;
    const timeSinceLastRecord = now - lastRecordTimeRef.current;

    // Must meet minimum time interval
    if (timeSinceLastRecord < opts.recordInterval!) {
      return;
    }

    // Check distance from last recorded point
    if (lastPoint) {
      const distance = calculateDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        point.latitude,
        point.longitude
      );

      // Update total distance
      if (distance > 1) { // Only add if moved more than 1 meter
        setTotalDistance(prev => prev + distance);
      }

      // Skip if haven't moved enough (unless 5+ seconds have passed)
      if (distance < opts.minDistance! && timeSinceLastRecord < 5000) {
        return;
      }
    }

    // Record the point with speed limit data
    recordPoint(point, currentSpeedLimit, currentRoadName);
  }, [opts.minAccuracy, opts.minDistance, opts.recordInterval, opts.enableSpeedLimits, recordPoint, fetchSpeedLimit, speedLimitData]);

  // Handle position error
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('[GPS Collector] Position error:', error.message);
    
    setGpsQuality(prev => ({
      ...prev,
      status: 'unavailable',
    }));

    if (error.code === error.PERMISSION_DENIED) {
      setError('GPS permission denied. Please enable location access.');
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      setError('GPS signal unavailable. Move to an open area.');
    } else if (error.code === error.TIMEOUT) {
      // Don't set error for timeout, just log it
      console.warn('[GPS Collector] Position timeout, will retry');
    }
  }, []);

  // Start GPS collection
  const startCollection = useCallback(async (telematicsSessionId: string) => {
    if (isCollecting) {
      console.warn('[GPS Collector] Already collecting');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    console.log('[GPS Collector] Starting collection for session:', telematicsSessionId);
    
    setSessionId(telematicsSessionId);
    setIsCollecting(true);
    setError(null);
    setTotalDistance(0);
    setPointCount(0);
    setSpeedLimitData({
      speedLimit: null,
      roadName: null,
      isExceeding: false,
      lastFetched: 0,
    });
    lastRecordedPointRef.current = null;
    lastRecordTimeRef.current = 0;
    lastSpeedLimitFetchRef.current = null;

    await requestWakeLock();

    // Start watching position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [isCollecting, handlePositionUpdate, handlePositionError, requestWakeLock]);

  // Stop GPS collection
  const stopCollection = useCallback(() => {
    console.log('[GPS Collector] Stopping collection');
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    releaseWakeLock();
    setIsCollecting(false);
    setSessionId(null);
    
    return {
      totalDistance,
      pointCount,
    };
  }, [totalDistance, pointCount, releaseWakeLock]);

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
    isCollecting,
    startCollection,
    stopCollection,
    gpsQuality,
    currentPosition,
    currentSpeed,
    totalDistance,
    pointCount,
    error,
    speedLimitData,
  };
};
