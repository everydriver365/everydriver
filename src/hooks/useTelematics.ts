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

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const lastPositionTimeRef = useRef<number | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  const gForceHistoryRef = useRef<number[]>([]);
  const calculatedSpeedHistoryRef = useRef<number[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const pupilIdRef = useRef<string | null>(null);

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

    // Apply smoothing with moving average (last 3 readings)
    calculatedSpeedHistoryRef.current.push(speedKmh);
    if (calculatedSpeedHistoryRef.current.length > 3) {
      calculatedSpeedHistoryRef.current.shift();
    }
    
    const avgSpeed = calculatedSpeedHistoryRef.current.reduce((a, b) => a + b, 0) / calculatedSpeedHistoryRef.current.length;
    return avgSpeed;
  }, []);

  // Evaluate GPS quality
  const evaluateGPSQuality = useCallback((accuracy: number | null): GPSQuality => {
    if (accuracy === null) {
      return { status: 'unavailable', accuracy_m: null, message: 'GPS accuracy unknown' };
    }
    if (accuracy <= 20) {
      return { status: 'good', accuracy_m: accuracy, message: 'Excellent GPS signal' };
    }
    if (accuracy <= 50) {
      return { status: 'fair', accuracy_m: accuracy, message: 'Good GPS signal' };
    }
    if (accuracy <= 100) {
      return { status: 'poor', accuracy_m: accuracy, message: 'Weak GPS signal - accuracy may be reduced' };
    }
    return { status: 'unavailable', accuracy_m: accuracy, message: 'GPS too inaccurate - recording paused' };
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
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    // Check if DeviceMotionEvent requires permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === 'granted';
      } catch (err) {
        console.error('Motion permission request failed:', err);
        return false;
      }
    }
    // No permission required on Android/other platforms
    return true;
  }, []);

  // Calculate G-force from accelerometer data
  const calculateGForce = useCallback((x: number, y: number, z: number): number => {
    // Remove gravity (approximately 9.81 m/s²) and convert to G
    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
    const gForce = Math.abs(totalAcceleration - 9.81) / 9.81;
    return gForce;
  }, []);

  // Detect motion-based events
  const detectMotionEvents = useCallback((gForce: number, position: GeolocationPosition | null, currentSpeedKmh: number): DrivingEvent[] => {
    const events: DrivingEvent[] = [];
    const lat = position?.coords.latitude ?? null;
    const lon = position?.coords.longitude ?? null;

    // Sharp turn detection (lateral G-force > 0.3g)
    if (gForce > 0.3 && gForce <= 0.5) {
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
    } else if (gForce > 0.5 && gForce <= 0.7) {
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
    } else if (gForce > 0.7) {
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
    }

    // Smooth cornering detection (consistently low G-force during turns)
    if (gForce < 0.15 && currentSpeedKmh > 20) {
      gForceHistoryRef.current.push(gForce);
      if (gForceHistoryRef.current.length > 5) {
        gForceHistoryRef.current.shift();
      }
      const avgGForce = gForceHistoryRef.current.reduce((a, b) => a + b, 0) / gForceHistoryRef.current.length;
      if (avgGForce < 0.1 && gForceHistoryRef.current.length >= 5) {
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
      }
    }

    return events;
  }, []);

  // Detect driving behavior events from GPS
  const detectDrivingEvents = useCallback((currentSpeedKmh: number, previousSpeedKmh: number, position: GeolocationPosition): DrivingEvent[] => {
    const speedDiff = currentSpeedKmh - previousSpeedKmh;
    const events: DrivingEvent[] = [];

    // Harsh braking (deceleration > 15 km/h per second)
    if (speedDiff < -15) {
      events.push({
        event_type: 'harsh_brake',
        severity: speedDiff < -25 ? 'high' : speedDiff < -20 ? 'medium' : 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Deceleration: ${Math.abs(speedDiff).toFixed(1)} km/h`
      });
    }

    // Harsh acceleration (acceleration > 12 km/h per second)
    if (speedDiff > 12) {
      events.push({
        event_type: 'harsh_acceleration',
        severity: speedDiff > 20 ? 'high' : speedDiff > 15 ? 'medium' : 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Acceleration: ${speedDiff.toFixed(1)} km/h`
      });
    }

    // Speeding (over 70 mph / 113 km/h on any road)
    if (currentSpeedKmh > 113) {
      events.push({
        event_type: 'speeding',
        severity: currentSpeedKmh > 130 ? 'high' : currentSpeedKmh > 120 ? 'medium' : 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: `Speed: ${currentSpeedKmh.toFixed(1)} km/h`
      });
    }

    // Good smooth stop (gradual deceleration to stop)
    if (currentSpeedKmh < 2 && previousSpeedKmh > 10 && speedDiff > -8) {
      events.push({
        event_type: 'smooth_stop',
        severity: 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: 'Smooth gradual stop'
      });
    }

    // Good acceleration (smooth start from stop)
    if (previousSpeedKmh < 2 && currentSpeedKmh > 10 && speedDiff < 10) {
      events.push({
        event_type: 'good_acceleration',
        severity: 'low',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed_at_event: currentSpeedKmh,
        sensor_source: 'gps',
        notes: 'Smooth acceleration from stop'
      });
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
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // First check if we have location permission
    try {
      const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      if (permissionStatus?.state === 'denied') {
        setError('Location permission denied. Please enable location access in your browser settings.');
        return;
      }
    } catch (permErr) {
      // permissions API not supported, continue anyway
      console.log('Permissions API not supported, continuing...');
    }

    try {
      // Request wake lock to keep screen on
      await requestWakeLock();

      // Request motion permission on iOS
      const motionGranted = await requestMotionPermission();
      setHasMotionPermission(motionGranted);
      
      if (motionGranted) {
        window.addEventListener('devicemotion', handleDeviceMotion);
      } else {
        console.log('Motion permission not granted - tracking without motion sensors');
      }

      // Create telematics session in database
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

      if (sessionError) throw sessionError;

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
      calculatedSpeedHistoryRef.current = [];
      gForceHistoryRef.current = [];

      // Set initial GPS status
      setGpsQuality({ status: 'fair', accuracy_m: null, message: 'Acquiring GPS signal...' });

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const accuracy = position.coords.accuracy;
          const quality = evaluateGPSQuality(accuracy);
          setGpsQuality(quality);

          // Skip recording if accuracy is too poor
          if (quality.status === 'unavailable' && accuracy && accuracy > 200) {
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

          // Save GPS point to database with accuracy
          await supabase.from('telematics_gps_points').insert({
            telematics_id: session.id,
            latitude: point.latitude,
            longitude: point.longitude,
            speed_kmh: point.speed_kmh,
            heading: point.heading,
            altitude_m: point.altitude_m,
            accuracy_m: point.accuracy_m,
            gps_accuracy_m: point.accuracy_m
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
            case geoError.TIMEOUT:
              errorMessage = 'GPS taking too long. Retrying...';
              statusMessage = 'GPS timeout - waiting for signal';
              break;
          }
          
          setError(errorMessage);
          setGpsQuality({ status: 'unavailable', accuracy_m: null, message: statusMessage });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
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
    calculatedSpeedHistoryRef.current = [];
    gForceHistoryRef.current = [];
    setGpsQuality({ status: 'unavailable', accuracy_m: null, message: 'GPS not active' });
    setMotionData({ acceleration: null, rotationRate: null, gForce: 0 });

    // Process with Damoov if pupil is assigned
    if (sessionId && pupilId) {
      setDamoovProcessing(true);
      try {
        // Step 1: Ensure pupil is registered with Damoov
        const { data: pupil } = await supabase
          .from('pupils')
          .select('damoov_device_token')
          .eq('id', pupilId)
          .single();

        let deviceToken = pupil?.damoov_device_token;

        if (!deviceToken) {
          console.log('Registering pupil with Damoov...');
          const { data: registerResult } = await supabase.functions.invoke('damoov-register', {
            body: { pupilId }
          });
          deviceToken = registerResult?.deviceToken;
        }

        if (deviceToken) {
          // Step 2: Submit trip data to Damoov
          console.log('Submitting trip to Damoov...');
          await supabase.functions.invoke('damoov-submit-trip', {
            body: { telematicsId: sessionId, deviceToken }
          });

          // Step 3: Wait for Damoov processing and fetch scores
          console.log('Waiting for Damoov analysis...');
          await new Promise(resolve => setTimeout(resolve, 4000));

          const { data: scoresResult } = await supabase.functions.invoke('damoov-get-scores', {
            body: { telematicsId: sessionId, deviceToken, pupilId }
          });

          if (scoresResult?.scores) {
            setDamoovScores(scoresResult.scores);
            setCoinsEarned(scoresResult.coinsEarned || 0);
          }
        }
      } catch (damoovError) {
        console.error('Damoov processing error:', damoovError);
        // Don't throw - Damoov processing is supplementary
      } finally {
        setDamoovProcessing(false);
      }
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
    coinsEarned,
    startTracking,
    stopTracking
  };
};
