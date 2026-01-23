import { useState, useRef, useCallback, useEffect } from 'react';

export interface HarshBrakingEvent {
  id: string;
  timestamp: number;
  peakDeceleration: number; // m/s²
  duration: number; // ms
  severity: 'low' | 'medium' | 'high';
  location: { lat: number; lon: number } | null;
}

interface UseHarshBrakingDetectorOptions {
  thresholdMs2?: number; // Deceleration threshold (default -3.0 m/s²)
  minDurationMs?: number; // Minimum duration to count as harsh (default 300ms)
  smoothingSamples?: number; // Rolling average samples (default 5)
  onHarshBrake?: (event: HarshBrakingEvent) => void;
}

const DEFAULT_OPTIONS: UseHarshBrakingDetectorOptions = {
  thresholdMs2: -3.0,
  minDurationMs: 300,
  smoothingSamples: 5,
};

export const useHarshBrakingDetector = (options: UseHarshBrakingDetectorOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [events, setEvents] = useState<HarshBrakingEvent[]>([]);
  const [currentDeceleration, setCurrentDeceleration] = useState(0);

  const accelBufferRef = useRef<number[]>([]);
  const brakeStartRef = useRef<number | null>(null);
  const peakDecelRef = useRef<number>(0);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);

  // Request motion permission (iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        const granted = permission === 'granted';
        setHasPermission(granted);
        return granted;
      } else {
        // Android or older iOS - permission not needed
        setHasPermission(true);
        return true;
      }
    } catch (err) {
      console.error('[Harsh Braking] Permission error:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Calculate smoothed Z-acceleration (forward/backward)
  const getSmoothedAccelZ = useCallback((newValue: number): number => {
    accelBufferRef.current.push(newValue);
    if (accelBufferRef.current.length > opts.smoothingSamples!) {
      accelBufferRef.current.shift();
    }
    
    const sum = accelBufferRef.current.reduce((a, b) => a + b, 0);
    return sum / accelBufferRef.current.length;
  }, [opts.smoothingSamples]);

  // Determine severity based on deceleration
  const getSeverity = useCallback((decel: number): 'low' | 'medium' | 'high' => {
    const absDecel = Math.abs(decel);
    if (absDecel >= 6.0) return 'high';
    if (absDecel >= 4.5) return 'medium';
    return 'low';
  }, []);

  // Handle device motion event
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel || accel.z === null) return;

    // Z-axis represents forward/backward in most phone orientations
    // Negative Z = braking/deceleration when phone faces forward
    const rawZ = accel.z;
    const smoothedZ = getSmoothedAccelZ(rawZ);
    
    // Subtract gravity component (~9.81) and invert for deceleration
    // When braking, the phone experiences force in the direction of travel
    const deceleration = -(smoothedZ - 9.81);
    setCurrentDeceleration(deceleration);

    const now = Date.now();

    // Check if this is harsh braking (sustained deceleration)
    if (deceleration <= opts.thresholdMs2!) {
      if (!brakeStartRef.current) {
        brakeStartRef.current = now;
        peakDecelRef.current = deceleration;
      } else {
        // Track peak deceleration during event
        if (deceleration < peakDecelRef.current) {
          peakDecelRef.current = deceleration;
        }
        
        // Check if sustained long enough
        const duration = now - brakeStartRef.current;
        if (duration >= opts.minDurationMs!) {
          // Create event
          const eventId = `brake-${now}`;
          const newEvent: HarshBrakingEvent = {
            id: eventId,
            timestamp: now,
            peakDeceleration: peakDecelRef.current,
            duration,
            severity: getSeverity(peakDecelRef.current),
            location: lastLocationRef.current,
          };

          setEvents(prev => [...prev, newEvent]);
          opts.onHarshBrake?.(newEvent);

          // Reset for next event (with cooldown)
          brakeStartRef.current = null;
          peakDecelRef.current = 0;
        }
      }
    } else {
      // Not braking hard enough - reset
      brakeStartRef.current = null;
      peakDecelRef.current = 0;
    }
  }, [opts, getSmoothedAccelZ, getSeverity]);

  // Update last known location (called from GPS tracker)
  const updateLocation = useCallback((lat: number, lon: number) => {
    lastLocationRef.current = { lat, lon };
  }, []);

  // Start detection
  const startDetection = useCallback(async (): Promise<boolean> => {
    if (!('DeviceMotionEvent' in window)) {
      console.warn('[Harsh Braking] DeviceMotionEvent not supported');
      return false;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return false;
    }

    accelBufferRef.current = [];
    brakeStartRef.current = null;
    peakDecelRef.current = 0;
    setEvents([]);
    setIsDetecting(true);

    window.addEventListener('devicemotion', handleMotion);
    console.log('[Harsh Braking] Detection started');
    return true;
  }, [requestPermission, handleMotion]);

  // Stop detection
  const stopDetection = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsDetecting(false);
    
    const result = {
      eventCount: events.length,
      events: [...events],
    };

    console.log('[Harsh Braking] Detection stopped:', result);
    return result;
  }, [handleMotion, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    isDetecting,
    hasPermission,
    events,
    eventCount: events.length,
    currentDeceleration,
    requestPermission,
    startDetection,
    stopDetection,
    updateLocation,
  };
};
