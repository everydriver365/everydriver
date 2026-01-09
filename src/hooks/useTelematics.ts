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
  event_type: 'harsh_brake' | 'harsh_acceleration' | 'sharp_turn' | 'speeding' | 'smooth_stop' | 'good_acceleration';
  severity: 'low' | 'medium' | 'high';
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  notes?: string;
}

interface TelematicsSession {
  id: string;
  lesson_id: string | null;
  started_at: string;
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

export const useTelematics = (instructorId: string) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TelematicsSession | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [drivingEvents, setDrivingEvents] = useState<DrivingEvent[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const speedHistoryRef = useRef<number[]>([]);

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

  // Detect driving behavior events
  const detectDrivingEvents = useCallback((currentSpeedKmh: number, previousSpeedKmh: number, position: GeolocationPosition) => {
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
        notes: 'Smooth gradual stop'
      });
    }

    return events;
  }, []);

  // Start tracking session
  const startTracking = useCallback(async (lessonId?: string, pupilId?: string) => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
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
      speedHistoryRef.current = [];

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const speedKmh = position.coords.speed 
            ? position.coords.speed * 3.6 // Convert m/s to km/h
            : 0;

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

          // Save GPS point to database
          await supabase.from('telematics_gps_points').insert({
            telematics_id: session.id,
            ...point
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
            setTotalDistance(prev => prev + distance);
          }

          // Detect driving behavior events
          if (speedHistoryRef.current.length > 0) {
            const previousSpeed = speedHistoryRef.current[speedHistoryRef.current.length - 1];
            const events = detectDrivingEvents(speedKmh, previousSpeed, position);
            
            for (const event of events) {
              await supabase.from('driving_behavior_events').insert({
                telematics_id: session.id,
                ...event
              });
              setDrivingEvents(prev => [...prev, event]);
            }
          }

          speedHistoryRef.current.push(speedKmh);
          lastPositionRef.current = position;
        },
        (error) => {
          setError(`GPS Error: ${error.message}`);
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
  }, [instructorId, detectDrivingEvents]);

  // Stop tracking session
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

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
    lastPositionRef.current = null;
    speedHistoryRef.current = [];
  }, [currentSession, totalDistance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    currentSession,
    gpsPoints,
    drivingEvents,
    currentSpeed,
    totalDistance,
    error,
    startTracking,
    stopTracking
  };
};
