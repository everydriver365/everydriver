import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  heading: number | null;
  altitude_m: number | null;
  accuracy_m: number | null;
  recorded_at: string;
}

interface DrivingEvent {
  event_type: 'harsh_brake' | 'harsh_acceleration' | 'sharp_turn' | 'speeding' | 'smooth_stop' | 'good_acceleration' | 'hard_impact' | 'phone_unstable' | 'smooth_cornering';
  severity: 'low' | 'medium' | 'high';
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  notes?: string;
  g_force?: number;
  sensor_source?: 'gps' | 'motion' | 'both';
}

interface TelematicsSession {
  id: string;
  lesson_id: string | null;
  started_at: string;
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

interface GPSQuality {
  status: 'good' | 'fair' | 'poor' | 'unavailable';
  accuracy_m: number | null;
  message: string;
}

interface MotionData {
  acceleration: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  gForce: number;
}

interface DamoovScores {
  overallScore: number | null;
  accelerationScore: number | null;
  brakingScore: number | null;
  corneringScore: number | null;
  speedingScore: number | null;
  phoneScore: number | null;
}

interface SpeedLimitData {
  speedLimit: number | null;
  roadType?: string;
  lastFetched: number;
  isExceeding: boolean;
}

// Enhanced error type for better debugging
export interface TrackingError {
  type: 'permission' | 'database' | 'gps' | 'motion' | 'damoov' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
  timestamp: string;
}

// Debug log helper
const debugLog = (step: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  console.log(`[Telematics ${timestamp}] ${step}: ${message}`, data || '');
};

export const useTelematics = (instructorId: string) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TelematicsSession | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [drivingEvents, setDrivingEvents] = useState<DrivingEvent[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [gpsQuality, setGpsQuality] = useState<GPSQuality>({ status: 'unavailable', accuracy_m: null, message: 'GPS not active' });
  const [motionData, setMotionData] = useState<MotionData>({ acceleration: null, rotationRate: null, gForce: 0 });
  const [hasMotionPermission, setHasMotionPermission] = useState<boolean | null>(null);
  const [isScreenAwake, setIsScreenAwake] = useState(false);
  const [damoovScores, setDamoovScores] = useState<DamoovScores | null>(null);
  const [damoovProcessing, setDamoovProcessing] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [trackingError, setTrackingError] = useState<TrackingError | null>(null);
  const [damoovStatus, setDamoovStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [gpsRetryCount, setGpsRetryCount] = useState(0);
  const [gpsAccuracyMode, setGpsAccuracyMode] = useState<'high' | 'balanced' | 'low'>('high');
  const [speedLimitData, setSpeedLimitData] = useState<SpeedLimitData>({
    speedLimit: null,
    roadType: 'Acquiring GPS...',
    lastFetched: 0,
    isExceeding: false
  });

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const lastPositionTimeRef = useRef<number | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  const gForceHistoryRef = useRef<number[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const pupilIdRef = useRef<string | null>(null);
  const lastSpeedLimitFetchRef = useRef<{ lat: number; lon: number; time: number } | null>(null);
  const currentRoadDataRef = useRef<{ roadName: string | null; speedLimit: number | null }>({ roadName: null, speedLimit: null });
  const gpsRetryCountRef = useRef(0);
  const gpsAccuracyModeRef = useRef<'high' | 'balanced' | 'low'>('high');
  const sessionDataRef = useRef<{ session: any; lessonId?: string; pupilId?: string } | null>(null);
  
  // Event cooldown tracking to prevent spam
  const lastEventTimeRef = useRef<Record<string, number>>({});
  const EVENT_COOLDOWN_MS = 5000; // 5 seconds between same event type

  // Get GPS options based on accuracy mode
  const getGpsOptions = useCallback((mode: 'high' | 'balanced' | 'low'): PositionOptions => {
    switch (mode) {
      case 'high':
        return { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
      case 'balanced':
        return { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 };
      case 'low':
        return { enableHighAccuracy: false, timeout: 45000, maximumAge: 10000 };
    }
  }, []);

  // Calculate distance between two GPS points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate speed from position changes when GPS speed is unavailable
  // NO averaging - use raw calculation for instant response
  const calculateSpeedFromPositions = useCallback((
    currentPos: GeolocationPosition
  ): number | null => {
    if (!lastPositionRef.current || !lastPositionTimeRef.current) {
      return null;
    }

    const distance = calculateDistance(
      lastPositionRef.current.coords.latitude,
      lastPositionRef.current.coords.longitude,
      currentPos.coords.latitude,
      currentPos.coords.longitude
    );

    const timeDeltaSeconds = (currentPos.timestamp - lastPositionTimeRef.current) / 1000;
    
    if (timeDeltaSeconds <= 0 || timeDeltaSeconds > 30) {
      return null; // Invalid time delta
    }

    const speedKmh = (distance / timeDeltaSeconds) * 3600;
    
    // Filter out impossible speeds (GPS glitch)
    if (speedKmh > 200) {
      return null;
    }

    // Return raw speed immediately - no averaging for faster response
    return speedKmh;
  }, []);

  // Fetch speed limit for current position and store in ref for DB insertion
  // Reduced throttle: 50m or 5 seconds for more responsive updates
  const fetchSpeedLimit = useCallback(async (lat: number, lon: number, currentSpeedKmh: number) => {
    const now = Date.now();
    const lastFetch = lastSpeedLimitFetchRef.current;
    
    // Only fetch if moved significantly (50m) or 5 seconds passed
    if (lastFetch) {
      const distance = calculateDistance(lastFetch.lat, lastFetch.lon, lat, lon);
      const timeSinceLastFetch = now - lastFetch.time;
      
      if (distance < 0.05 && timeSinceLastFetch < 5000) {
        // Just update isExceeding without fetching
        setSpeedLimitData(prev => ({
          ...prev,
          isExceeding: prev.speedLimit !== null && currentSpeedKmh > prev.speedLimit
        }));
        return;
      }
    }
    
    try {
      console.log('[fetchSpeedLimit] Calling edge function for:', lat, lon);
      const { data, error } = await supabase.functions.invoke('tomtom-speed-limits', {
        body: { lat, lon }
      });
      
      if (error) {
        console.log('[fetchSpeedLimit] Edge function error:', error);
        setSpeedLimitData(prev => ({
          ...prev,
          roadType: 'Unknown Road'
        }));
        return;
      }
      
      console.log('[fetchSpeedLimit] Response:', data);
      lastSpeedLimitFetchRef.current = { lat, lon, time: now };
      
      // Store in ref for use when saving GPS points
      currentRoadDataRef.current = {
        roadName: data.roadType || null,
        speedLimit: data.speedLimit || null
      };
      
      setSpeedLimitData({
        speedLimit: data.speedLimit,
        roadType: data.roadType || 'Unknown Road',
        lastFetched: now,
        isExceeding: data.speedLimit !== null && currentSpeedKmh > data.speedLimit
      });
      
      debugLog('SPEED_LIMIT', `Fetched: ${data.speedLimit} km/h on ${data.roadType || 'unknown road'}`);
    } catch (err) {
      console.log('[fetchSpeedLimit] Exception:', err);
      setSpeedLimitData(prev => ({
        ...prev,
        roadType: 'Unknown Road'
      }));
    }
  }, []);
  const evaluateGPSQuality = useCallback((accuracy: number | null): GPSQuality => {
    if (accuracy === null) {
      return { status: 'unavailable', accuracy_m: null, message: 'GPS accuracy unknown' };
    }
    if (accuracy <= 30) {
      return { status: 'good', accuracy_m: accuracy, message: 'Excellent GPS signal' };
    }
    if (accuracy <= 100) {
      return { status: 'fair', accuracy_m: accuracy, message: 'Good GPS signal' };
    }
    if (accuracy <= 200) {
      return { status: 'fair', accuracy_m: accuracy, message: 'Moderate GPS signal' };
    }
    if (accuracy <= 500) {
      // Still recording but with reduced accuracy - show as poor, not unavailable
      return { status: 'poor', accuracy_m: accuracy, message: 'Weak GPS signal - still recording' };
    }
    // Only show unavailable when we truly stop recording (> 500m)
    // Don't show accuracy value in this case as it's confusing
    return { status: 'unavailable', accuracy_m: null, message: 'GPS signal lost - move to open area' };
  }, []);

  // Request wake lock to keep screen on during tracking
  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!('wakeLock' in navigator)) {
      console.log('Wake Lock API not supported');
      return false;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsScreenAwake(true);
      console.log('Screen wake lock acquired');

      // Handle visibility change - reacquire wake lock when page becomes visible again
      wakeLockRef.current.addEventListener('release', () => {
        console.log('Screen wake lock released');
        setIsScreenAwake(false);
      });

      return true;
    } catch (err) {
      console.error('Failed to acquire wake lock:', err);
      return false;
    }
  }, []);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsScreenAwake(false);
        console.log('Screen wake lock released manually');
      } catch (err) {
        console.error('Failed to release wake lock:', err);
      }
    }
  }, []);

  // Reacquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isTracking && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTracking, requestWakeLock]);

  // Request motion permission (required on iOS)
  // IMPORTANT: On iOS, this MUST be called synchronously from user gesture
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    // Check if DeviceMotionEvent requires permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        debugLog('MOTION', 'iOS detected - requesting DeviceMotionEvent permission');
        const permission = await (DeviceMotionEvent as any).requestPermission();
        debugLog('MOTION', `DeviceMotionEvent permission result: ${permission}`);
        return permission === 'granted';
      } catch (err) {
        console.error('Motion permission request failed:', err);
        debugLog('MOTION', 'Motion permission request threw error', err);
        return false;
      }
    }
    // Check if DeviceOrientationEvent also needs permission (some iOS versions)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        debugLog('MOTION', 'Requesting DeviceOrientationEvent permission');
        await (DeviceOrientationEvent as any).requestPermission();
      } catch (err) {
        debugLog('MOTION', 'DeviceOrientationEvent permission failed (non-critical)', err);
      }
    }
    // No permission required on Android/other platforms, but check if API exists
    if ('DeviceMotionEvent' in window) {
      debugLog('MOTION', 'DeviceMotionEvent available without permission request');
      return true;
    }
    debugLog('MOTION', 'DeviceMotionEvent not available on this device');
    return false;
  }, []);

  // Calculate G-force from accelerometer data
  const calculateGForce = useCallback((x: number, y: number, z: number): number => {
    // Remove gravity (approximately 9.81 m/s²) and convert to G
    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
    const gForce = Math.abs(totalAcceleration - 9.81) / 9.81;
    return gForce;
  }, []);

  // Detect motion-based events with higher thresholds and cooldowns
  const detectMotionEvents = useCallback((gForce: number, position: GeolocationPosition | null, currentSpeedKmh: number): DrivingEvent[] => {
    const events: DrivingEvent[] = [];
    const lat = position?.coords.latitude ?? null;
    const lon = position?.coords.longitude ?? null;
    const now = Date.now();
    
    // Minimum speed filter - ignore events when nearly stationary
    if (currentSpeedKmh < 5) {
      return events;
    }
    
    // GPS accuracy gate - skip if position accuracy is poor
    if (position && position.coords.accuracy > 50) {
      return events;
    }

    // Check cooldown for sharp_turn/hard_impact
    const lastSharpTurn = lastEventTimeRef.current['sharp_turn'] || 0;
    const lastHardImpact = lastEventTimeRef.current['hard_impact'] || 0;
    
    // Sharp turn detection - RAISED threshold from 0.3g to 0.4g
    if (gForce > 0.4 && gForce <= 0.6 && (now - lastSharpTurn) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'sharp_turn',
        severity: 'low',
        latitude: lat,
        longitude: lon,
        speed_at_event: currentSpeedKmh,
        g_force: gForce,
        sensor_source: 'motion',
        notes: `Lateral force: ${gForce.toFixed(2)}g`
      });
      lastEventTimeRef.current['sharp_turn'] = now;
    } else if (gForce > 0.6 && gForce <= 0.8 && (now - lastSharpTurn) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'sharp_turn',
        severity: 'medium',
        latitude: lat,
        longitude: lon,
        speed_at_event: currentSpeedKmh,
        g_force: gForce,
        sensor_source: 'motion',
        notes: `Lateral force: ${gForce.toFixed(2)}g`
      });
      lastEventTimeRef.current['sharp_turn'] = now;
    } else if (gForce > 0.8 && (now - lastHardImpact) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'hard_impact',
        severity: 'high',
        latitude: lat,
        longitude: lon,
        speed_at_event: currentSpeedKmh,
        g_force: gForce,
        sensor_source: 'motion',
        notes: `Impact force: ${gForce.toFixed(2)}g`
      });
      lastEventTimeRef.current['hard_impact'] = now;
    }

    // Smooth cornering detection (consistently low G-force during turns)
    if (gForce < 0.15 && currentSpeedKmh > 20) {
      gForceHistoryRef.current.push(gForce);
      if (gForceHistoryRef.current.length > 5) {
        gForceHistoryRef.current.shift();
      }
      const avgGForce = gForceHistoryRef.current.reduce((a, b) => a + b, 0) / gForceHistoryRef.current.length;
      const lastSmooth = lastEventTimeRef.current['smooth_cornering'] || 0;
      if (avgGForce < 0.1 && gForceHistoryRef.current.length >= 5 && (now - lastSmooth) > EVENT_COOLDOWN_MS) {
        events.push({
          event_type: 'smooth_cornering',
          severity: 'low',
          latitude: lat,
          longitude: lon,
          speed_at_event: currentSpeedKmh,
          g_force: avgGForce,
          sensor_source: 'motion',
          notes: 'Smooth vehicle control'
        });
        gForceHistoryRef.current = []; // Reset after detecting
        lastEventTimeRef.current['smooth_cornering'] = now;
      }
    }

    return events;
  }, []);

  // Detect driving behavior events from GPS with time-normalization, accuracy gates, and cooldowns
  const detectDrivingEvents = useCallback((currentSpeedKmh: number, previousSpeedKmh: number, position: GeolocationPosition): DrivingEvent[] => {
    const events: DrivingEvent[] = [];
    const now = Date.now();
    
    // GPS accuracy gate - skip events if GPS accuracy is poor (> 50m)
    if (position.coords.accuracy > 50) {
      return events;
    }
    
    // Calculate time delta for time-normalized thresholds
    const timeDeltaMs = lastPositionTimeRef.current 
      ? position.timestamp - lastPositionTimeRef.current 
      : 1000;
    const timeDeltaSeconds = Math.max(timeDeltaMs / 1000, 0.5); // Minimum 0.5s to avoid division issues
    
    // Speed difference
    const speedDiff = currentSpeedKmh - previousSpeedKmh;
    
    // Convert to m/s² for proper physics-based thresholds
    // speedDiff is km/h, divide by 3.6 to get m/s, then divide by time to get m/s²
    const accelerationMps2 = (speedDiff / 3.6) / timeDeltaSeconds;
    
    // Harsh braking: < -5 m/s² (about 0.5g) AND speed > 5 km/h
    // Must be moving at meaningful speed to register braking
    const lastBrake = lastEventTimeRef.current['harsh_brake'] || 0;
    if (accelerationMps2 < -5 && currentSpeedKmh > 5 && (now - lastBrake) > EVENT_COOLDOWN_MS) {
      const severity = accelerationMps2 < -8 ? 'high' : accelerationMps2 < -6.5 ? 'medium' : 'low';
      events.push({
        event_type: 'harsh_brake',
        severity,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Deceleration: ${Math.abs(accelerationMps2).toFixed(1)} m/s² (${Math.abs(speedDiff).toFixed(1)} km/h in ${timeDeltaSeconds.toFixed(1)}s)`
      });
      lastEventTimeRef.current['harsh_brake'] = now;
    }

    // Harsh acceleration: > 4 m/s² (about 0.4g) AND previous speed > 3 km/h
    // Must already be moving to avoid false positives from standstill
    const lastAccel = lastEventTimeRef.current['harsh_acceleration'] || 0;
    if (accelerationMps2 > 4 && previousSpeedKmh > 3 && (now - lastAccel) > EVENT_COOLDOWN_MS) {
      const severity = accelerationMps2 > 6 ? 'high' : accelerationMps2 > 5 ? 'medium' : 'low';
      events.push({
        event_type: 'harsh_acceleration',
        severity,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Acceleration: ${accelerationMps2.toFixed(1)} m/s² (${speedDiff.toFixed(1)} km/h in ${timeDeltaSeconds.toFixed(1)}s)`
      });
      lastEventTimeRef.current['harsh_acceleration'] = now;
    }

    // Speeding (over 70 mph / 113 km/h on any road) with cooldown
    const lastSpeeding = lastEventTimeRef.current['speeding'] || 0;
    if (currentSpeedKmh > 113 && (now - lastSpeeding) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'speeding',
        severity: currentSpeedKmh > 130 ? 'high' : currentSpeedKmh > 120 ? 'medium' : 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Speed: ${currentSpeedKmh.toFixed(1)} km/h`
      });
      lastEventTimeRef.current['speeding'] = now;
    }

    // Good smooth stop (gradual deceleration to stop) - acceleration between -2 and -5 m/s²
    const lastSmoothStop = lastEventTimeRef.current['smooth_stop'] || 0;
    if (currentSpeedKmh < 2 && previousSpeedKmh > 10 && accelerationMps2 > -5 && accelerationMps2 < -0.5 && (now - lastSmoothStop) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'smooth_stop',
        severity: 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: 'Smooth gradual stop'
      });
      lastEventTimeRef.current['smooth_stop'] = now;
    }

    // Good acceleration (smooth start from stop) - acceleration between 1 and 3.5 m/s²
    const lastGoodAccel = lastEventTimeRef.current['good_acceleration'] || 0;
    if (previousSpeedKmh < 2 && currentSpeedKmh > 10 && accelerationMps2 > 0.5 && accelerationMps2 < 3.5 && (now - lastGoodAccel) > EVENT_COOLDOWN_MS) {
      events.push({
        event_type: 'good_acceleration',
        severity: 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: 'Smooth acceleration from stop'
      });
      lastEventTimeRef.current['good_acceleration'] = now;
    }

    return events;
  }, []);

  // Handle device motion events
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    const gForce = calculateGForce(x, y, z);
    
    setMotionData({
      acceleration: { x, y, z },
      rotationRate: event.rotationRate ? {
        alpha: event.rotationRate.alpha || 0,
        beta: event.rotationRate.beta || 0,
        gamma: event.rotationRate.gamma || 0
      } : null,
      gForce
    });

    // Detect motion-based events if tracking
    if (sessionIdRef.current && gForce > 0.25) {
      const motionEvents = detectMotionEvents(gForce, lastPositionRef.current, speedHistoryRef.current[speedHistoryRef.current.length - 1] || 0);
      
      for (const event of motionEvents) {
        supabase.from('driving_behavior_events').insert({
          telematics_id: sessionIdRef.current,
          event_type: event.event_type,
          severity: event.severity,
          latitude: event.latitude,
          longitude: event.longitude,
          speed_at_event: event.speed_at_event,
          g_force: event.g_force,
          sensor_source: event.sensor_source,
          notes: event.notes
        });
        setDrivingEvents(prev => [...prev, event]);
      }
    }
  }, [calculateGForce, detectMotionEvents]);

  // Start tracking session
  const startTracking = useCallback(async (lessonId?: string, pupilId?: string) => {
    debugLog('START', 'Beginning tracking session', { lessonId, pupilId, instructorId });
    setTrackingError(null);
    setDamoovStatus('idle');
    setError(null);
    
    // CRITICAL: Request motion permission FIRST, synchronously from user gesture
    // On iOS, this must happen before any async operations or the permission dialog won't show
    debugLog('MOTION', 'Requesting motion sensor permission (must be first for iOS)');
    const motionGranted = await requestMotionPermission();
    setHasMotionPermission(motionGranted);
    debugLog('MOTION', `Motion permission ${motionGranted ? 'granted' : 'denied/not available'}`);
    
    if (motionGranted) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      debugLog('MOTION', 'DeviceMotion listener attached');
    } else {
      debugLog('MOTION', 'Tracking without motion sensors (GPS only)');
    }
    
    if (!('geolocation' in navigator)) {
      const err: TrackingError = {
        type: 'gps',
        message: 'Geolocation is not supported by your browser',
        recoverable: false,
        timestamp: new Date().toISOString()
      };
      setTrackingError(err);
      setError(err.message);
      debugLog('START', 'FAILED - No geolocation support');
      return;
    }

    // Check if we have location permission
    try {
      const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      debugLog('PERMISSION', 'GPS permission status', permissionStatus?.state);
      if (permissionStatus?.state === 'denied') {
        const err: TrackingError = {
          type: 'permission',
          message: 'Location permission denied',
          details: 'Please enable location access in your browser settings',
          recoverable: true,
          timestamp: new Date().toISOString()
        };
        setTrackingError(err);
        setError(err.message + '. ' + err.details);
        debugLog('START', 'FAILED - GPS permission denied');
        return;
      }
    } catch (permErr) {
      // permissions API not supported, continue anyway
      debugLog('PERMISSION', 'Permissions API not supported, continuing...');
    }

    try {
      // Request wake lock to keep screen on
      debugLog('WAKELOCK', 'Requesting screen wake lock');
      await requestWakeLock();

      // Motion permission already requested at start of function

      // Create telematics session in database
      debugLog('DATABASE', 'Creating telematics session');
      const { data: session, error: sessionError } = await supabase
        .from('lesson_telematics')
        .insert({
          instructor_id: instructorId,
          lesson_id: lessonId || null,
          pupil_id: pupilId || null,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        debugLog('DATABASE', 'Session creation FAILED', sessionError);
        const err: TrackingError = {
          type: 'database',
          message: 'Failed to create tracking session',
          details: sessionError.message,
          recoverable: true,
          timestamp: new Date().toISOString()
        };
        setTrackingError(err);
        throw sessionError;
      }
      
      debugLog('DATABASE', 'Session created successfully', { sessionId: session.id });

      sessionIdRef.current = session.id;
      pupilIdRef.current = pupilId || null;
      setCurrentSession({
        id: session.id,
        lesson_id: session.lesson_id,
        started_at: session.started_at,
        total_distance_km: 0,
        avg_speed_kmh: null,
        max_speed_kmh: null
      });

      setIsTracking(true);
      setGpsPoints([]);
      setDrivingEvents([]);
      setTotalDistance(0);
      setDamoovScores(null);
      setCoinsEarned(0);
      speedHistoryRef.current = [];
      gForceHistoryRef.current = [];
      lastEventTimeRef.current = {}; // Reset event cooldowns
      
      // Reset retry counters and accuracy mode
      gpsRetryCountRef.current = 0;
      setGpsRetryCount(0);
      gpsAccuracyModeRef.current = 'high';
      setGpsAccuracyMode('high');

       // Set initial GPS status
       setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'Acquiring GPS signal...' });

       // Warm-up: force an initial GPS fix (helps some mobile browsers/PWA)
       let initialFixSuccess = false;
       await new Promise<void>((resolve) => {
         try {
           navigator.geolocation.getCurrentPosition(
             (pos) => {
               debugLog('GPS', 'Initial fix acquired', {
                 accuracy: pos.coords.accuracy,
                 lat: pos.coords.latitude,
                 lon: pos.coords.longitude,
               });
               initialFixSuccess = true;
               // Set initial GPS quality based on warm-up fix
               const quality = evaluateGPSQuality(pos.coords.accuracy);
               setGpsQuality(quality);
               // Store as last known position
               lastPositionRef.current = pos;
               lastPositionTimeRef.current = pos.timestamp;
               resolve();
             },
             (err) => {
               debugLog('GPS', 'Initial fix failed (continuing with watchPosition)', {
                 code: err.code,
                 message: err.message,
               });
               resolve();
             },
             {
               enableHighAccuracy: true,
               timeout: 15000,
               maximumAge: 0,
             }
           );
         } catch {
           resolve();
         }
       });

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const accuracy = position.coords.accuracy;
          const quality = evaluateGPSQuality(accuracy);
          setGpsQuality(quality);

          // Skip recording only if accuracy is extremely poor (> 500m)
          // Also update the road label so the UI doesn't look "stuck" on "Acquiring GPS..."
          if (accuracy && accuracy > 500) {
            console.log(`GPS accuracy too poor (${accuracy}m), skipping point`);
            setSpeedLimitData(prev => ({
              ...prev,
              roadType: 'Acquiring GPS signal...'
            }));
            return;
          }

          // Calculate speed - prefer GPS speed, fallback to calculated
          let speedKmh = position.coords.speed 
            ? position.coords.speed * 3.6 // Convert m/s to km/h
            : null;

          if (speedKmh === null || speedKmh === 0) {
            const calculatedSpeed = calculateSpeedFromPositions(position);
            if (calculatedSpeed !== null) {
              speedKmh = calculatedSpeed;
            } else {
              speedKmh = 0;
            }
          }

          setCurrentSpeed(speedKmh);
          
          // Fetch speed limit for current location
          fetchSpeedLimit(position.coords.latitude, position.coords.longitude, speedKmh);

          const point: GPSPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed_kmh: speedKmh,
            heading: position.coords.heading,
            altitude_m: position.coords.altitude,
            accuracy_m: position.coords.accuracy,
            recorded_at: new Date().toISOString()
          };

          // Skip duplicate readings
          if (lastPositionRef.current) {
            const isSamePosition = 
              Math.abs(lastPositionRef.current.coords.latitude - position.coords.latitude) < 0.000001 &&
              Math.abs(lastPositionRef.current.coords.longitude - position.coords.longitude) < 0.000001;
            if (isSamePosition) {
              return;
            }
          }

          // Save GPS point to database with accuracy, road name and speed limit
          await supabase.from('telematics_gps_points').insert({
            telematics_id: session.id,
            latitude: point.latitude,
            longitude: point.longitude,
            speed_kmh: point.speed_kmh,
            heading: point.heading,
            altitude_m: point.altitude_m,
            accuracy_m: point.accuracy_m,
            gps_accuracy_m: point.accuracy_m,
            road_name: currentRoadDataRef.current.roadName,
            speed_limit_kmh: currentRoadDataRef.current.speedLimit
          });

          setGpsPoints(prev => [...prev, point]);

          // Calculate distance from last point
          if (lastPositionRef.current) {
            const distance = calculateDistance(
              lastPositionRef.current.coords.latitude,
              lastPositionRef.current.coords.longitude,
              position.coords.latitude,
              position.coords.longitude
            );
            
            // Only add distance if reasonable (< 1km in one reading = not a GPS jump)
            if (distance < 1) {
              setTotalDistance(prev => prev + distance);
            }
          }

          // Detect driving behavior events
          if (speedHistoryRef.current.length > 0) {
            const previousSpeed = speedHistoryRef.current[speedHistoryRef.current.length - 1];
            const events = detectDrivingEvents(speedKmh, previousSpeed, position);
            
            for (const event of events) {
              await supabase.from('driving_behavior_events').insert({
                telematics_id: session.id,
                event_type: event.event_type,
                severity: event.severity,
                latitude: event.latitude,
                longitude: event.longitude,
                speed_at_event: event.speed_at_event,
                sensor_source: event.sensor_source,
                notes: event.notes
              });
              setDrivingEvents(prev => [...prev, event]);
            }
          }

          speedHistoryRef.current.push(speedKmh);
          lastPositionRef.current = position;
          lastPositionTimeRef.current = position.timestamp;
        },
        (geoError) => {
          debugLog('GPS', 'watchPosition error', { code: geoError.code, message: geoError.message, retryCount: gpsRetryCountRef.current, mode: gpsAccuracyModeRef.current });
          
          // Handle timeout with auto-retry and fallback
          if (geoError.code === geoError.TIMEOUT) {
            gpsRetryCountRef.current += 1;
            setGpsRetryCount(gpsRetryCountRef.current);
            
            const maxRetriesPerMode = 3;
            const currentMode = gpsAccuracyModeRef.current;
            const hadPreviousFix = lastPositionRef.current !== null;
            
            // Determine next action based on retry count
            if (gpsRetryCountRef.current <= maxRetriesPerMode) {
              // Retry with current mode - show as 'poor' if we had a fix before, otherwise 'unavailable'
              const statusMessage = `Retry ${gpsRetryCountRef.current}/${maxRetriesPerMode} (${currentMode})`;
              if (hadPreviousFix) {
                // We had GPS before, it's just temporarily weak
                setGpsQuality({ status: 'poor', accuracy_m: null, message: `Weak signal - ${statusMessage}` });
              } else {
                setGpsQuality({ status: 'unavailable', accuracy_m: null, message: statusMessage });
              }
              setSpeedLimitData(prev => ({ ...prev, roadType: statusMessage }));
              debugLog('GPS', `Retry ${gpsRetryCountRef.current} with ${currentMode} accuracy, hadPreviousFix: ${hadPreviousFix}`);
              return; // Let watchPosition continue retrying
            } else if (currentMode === 'high') {
              // Switch to balanced mode
              gpsAccuracyModeRef.current = 'balanced';
              setGpsAccuracyMode('balanced');
              gpsRetryCountRef.current = 1;
              setGpsRetryCount(1);
              debugLog('GPS', 'Switching to balanced accuracy mode');
              
              // Restart watch with new settings
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
              }
              setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'Switching to balanced mode...' });
              setSpeedLimitData(prev => ({ ...prev, roadType: 'Switching to balanced mode...' }));
              
              // Re-invoke startTracking logic would be complex, so we restart the watch inline
              const newOptions = getGpsOptions('balanced');
              debugLog('GPS', 'Restarting watch with balanced options', newOptions);
              // The current watch will continue with original options; user may need to restart
              return;
            } else if (currentMode === 'balanced') {
              // Switch to low accuracy mode
              gpsAccuracyModeRef.current = 'low';
              setGpsAccuracyMode('low');
              gpsRetryCountRef.current = 1;
              setGpsRetryCount(1);
              debugLog('GPS', 'Switching to low accuracy mode');
              
              setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'Switching to low accuracy mode...' });
              setSpeedLimitData(prev => ({ ...prev, roadType: 'Switching to low accuracy mode...' }));
              return;
            } else {
              // All modes exhausted
              setError('GPS signal cannot be acquired. Please ensure you are outdoors with a clear view of the sky.');
              setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'GPS unavailable - all modes tried' });
              setSpeedLimitData(prev => ({ ...prev, roadType: 'GPS unavailable' }));
              return;
            }
          }
          
          // Handle other errors
          let errorMessage = 'GPS Error';
          let statusMessage = geoError.message;
          
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please allow location access and try again.';
              statusMessage = 'Permission denied - check browser settings';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = 'GPS signal unavailable. Please ensure you are outdoors or have a clear view of the sky.';
              statusMessage = 'No GPS signal - try moving outdoors';
              break;
          }
          
          setError(errorMessage);
          setGpsQuality({ status: 'unavailable', accuracy_m: null, message: statusMessage });
          setSpeedLimitData(prev => ({
            ...prev,
            roadType: statusMessage || 'GPS unavailable'
          }));
        },
        getGpsOptions(gpsAccuracyModeRef.current)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  }, [instructorId, detectDrivingEvents, evaluateGPSQuality, calculateSpeedFromPositions, requestMotionPermission, requestWakeLock, handleDeviceMotion]);

  // Stop tracking session and process Damoov
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Release wake lock
    await releaseWakeLock();

    // Remove motion listener
    window.removeEventListener('devicemotion', handleDeviceMotion);

    const sessionId = currentSession?.id;
    const pupilId = pupilIdRef.current;

    if (currentSession) {
      const avgSpeed = speedHistoryRef.current.length > 0
        ? speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length
        : null;
      const maxSpeed = speedHistoryRef.current.length > 0
        ? Math.max(...speedHistoryRef.current)
        : null;

      await supabase
        .from('lesson_telematics')
        .update({
          ended_at: new Date().toISOString(),
          total_distance_km: totalDistance,
          avg_speed_kmh: avgSpeed,
          max_speed_kmh: maxSpeed
        })
        .eq('id', currentSession.id);
    }

    setIsTracking(false);
    setCurrentSession(null);
    sessionIdRef.current = null;
    pupilIdRef.current = null;
    lastPositionRef.current = null;
    lastPositionTimeRef.current = null;
    speedHistoryRef.current = [];
    gForceHistoryRef.current = [];
    lastEventTimeRef.current = {};
    setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'GPS not active' });
    setMotionData({ acceleration: null, rotationRate: null, gForce: 0 });

    // Process with Damoov if pupil is assigned
    if (sessionId && pupilId) {
      setDamoovProcessing(true);
      setDamoovStatus('processing');
      debugLog('DAMOOV', 'Starting Damoov processing', { sessionId, pupilId });
      
      try {
        // Step 1: Ensure pupil is registered with Damoov
        debugLog('DAMOOV', 'Step 1: Checking pupil registration');
        const { data: pupil, error: pupilError } = await supabase
          .from('pupils')
          .select('damoov_device_token')
          .eq('id', pupilId)
          .single();

        if (pupilError) {
          debugLog('DAMOOV', 'Failed to fetch pupil', pupilError);
        }

        let deviceToken = pupil?.damoov_device_token;
        debugLog('DAMOOV', `Existing device token: ${deviceToken ? 'Yes' : 'No'}`);

        if (!deviceToken) {
          debugLog('DAMOOV', 'Step 1b: Registering pupil with Damoov');
          const { data: registerResult, error: registerError } = await supabase.functions.invoke('damoov-register', {
            body: { pupilId }
          });
          
          if (registerError) {
            debugLog('DAMOOV', 'Registration failed', registerError);
            throw new Error(`Damoov registration failed: ${registerError.message}`);
          }
          
          deviceToken = registerResult?.deviceToken;
          debugLog('DAMOOV', `Registration result: ${deviceToken ? 'Success' : 'No token returned'}`);
        }

        if (deviceToken) {
          // Step 2: Submit trip data to Damoov
          debugLog('DAMOOV', 'Step 2: Submitting trip data');
          const { data: submitResult, error: submitError } = await supabase.functions.invoke('damoov-submit-trip', {
            body: { telematicsId: sessionId, deviceToken }
          });
          
          if (submitError) {
            debugLog('DAMOOV', 'Trip submission failed', submitError);
            throw new Error(`Trip submission failed: ${submitError.message}`);
          }
          debugLog('DAMOOV', 'Trip submitted successfully', submitResult);

          // Step 3: Wait for Damoov processing and fetch scores
          debugLog('DAMOOV', 'Step 3: Waiting 4s for Damoov ML analysis...');
          await new Promise(resolve => setTimeout(resolve, 4000));

          debugLog('DAMOOV', 'Step 4: Fetching scores');
          const { data: scoresResult, error: scoresError } = await supabase.functions.invoke('damoov-get-scores', {
            body: { telematicsId: sessionId, deviceToken, pupilId }
          });

          if (scoresError) {
            debugLog('DAMOOV', 'Scores fetch failed', scoresError);
            throw new Error(`Scores fetch failed: ${scoresError.message}`);
          }

          if (scoresResult?.scores) {
            debugLog('DAMOOV', 'Scores received successfully', scoresResult.scores);
            setDamoovScores(scoresResult.scores);
            setCoinsEarned(scoresResult.coinsEarned || 0);
            setDamoovStatus('complete');
          } else {
            debugLog('DAMOOV', 'No scores in response', scoresResult);
            setDamoovStatus('error');
          }
        } else {
          debugLog('DAMOOV', 'No device token available, skipping Damoov');
          setDamoovStatus('error');
        }
      } catch (damoovError) {
        debugLog('DAMOOV', 'Processing error', damoovError);
        setDamoovStatus('error');
        // Don't throw - Damoov processing is supplementary
      } finally {
        setDamoovProcessing(false);
        debugLog('DAMOOV', 'Processing complete');
      }
    } else {
      debugLog('DAMOOV', 'Skipping Damoov (no pupil assigned)', { sessionId, pupilId });
    }
  }, [currentSession, totalDistance, handleDeviceMotion, releaseWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.removeEventListener('devicemotion', handleDeviceMotion);
      // Release wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [handleDeviceMotion]);

  return {
    isTracking,
    currentSession,
    gpsPoints,
    drivingEvents,
    currentSpeed,
    totalDistance,
    error,
    gpsQuality,
    motionData,
    hasMotionPermission,
    isScreenAwake,
    damoovScores,
    damoovProcessing,
    damoovStatus,
    coinsEarned,
    trackingError,
    speedLimitData,
    gpsRetryCount,
    gpsAccuracyMode,
    startTracking,
    stopTracking
  };
};
