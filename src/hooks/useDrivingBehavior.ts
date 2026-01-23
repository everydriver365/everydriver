import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DrivingEvent {
  id: string;
  type: 'harsh_brake' | 'speeding' | 'harsh_accel' | 'sharp_turn';
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  speedLimitKmh: number | null;
  durationMs?: number;
  accelerationMs2?: number;
  roadName?: string | null;
}

interface UseDrivingBehaviorOptions {
  speedLimitToleranceKmh?: number;
  minSpeedingDurationMs?: number;
  batchSyncIntervalMs?: number;
  onEvent?: (event: DrivingEvent) => void;
}

const DEFAULT_OPTIONS: UseDrivingBehaviorOptions = {
  speedLimitToleranceKmh: 8,
  minSpeedingDurationMs: 3000,
  batchSyncIntervalMs: 30000,
};

export const useDrivingBehavior = (options: UseDrivingBehaviorOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({
    harshBrakeCount: 0,
    speedingEventsCount: 0,
    speedingTotalSeconds: 0,
    maxSpeedOverLimitKmh: 0,
  });

  const sessionIdRef = useRef<string | null>(null);
  const eventQueueRef = useRef<DrivingEvent[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedingStartRef = useRef<number | null>(null);
  const lastSpeedingEventRef = useRef<number>(0);

  // Add event to local state and queue
  const addEvent = useCallback((event: Omit<DrivingEvent, 'id'>) => {
    const fullEvent: DrivingEvent = {
      ...event,
      id: `${event.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    setEvents(prev => [...prev, fullEvent]);
    eventQueueRef.current.push(fullEvent);
    
    // Update stats
    setStats(prev => {
      const newStats = { ...prev };
      
      if (event.type === 'harsh_brake') {
        newStats.harshBrakeCount++;
      }
      
      if (event.type === 'speeding') {
        newStats.speedingEventsCount++;
        if (event.durationMs) {
          newStats.speedingTotalSeconds += Math.round(event.durationMs / 1000);
        }
        const excess = (event.speedKmh || 0) - (event.speedLimitKmh || 0);
        if (excess > newStats.maxSpeedOverLimitKmh) {
          newStats.maxSpeedOverLimitKmh = excess;
        }
      }
      
      return newStats;
    });

    opts.onEvent?.(fullEvent);
    console.log('[Driving Behavior] Event added:', fullEvent.type, fullEvent.severity);
  }, [opts]);

  // Sync queued events to database
  const syncEvents = useCallback(async () => {
    if (!sessionIdRef.current || eventQueueRef.current.length === 0) return;
    
    setIsSyncing(true);
    const eventsToSync = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      const records = eventsToSync.map(e => ({
        telematics_id: sessionIdRef.current!,
        event_type: e.type,
        severity: e.severity,
        latitude: e.latitude,
        longitude: e.longitude,
        speed_kmh: e.speedKmh,
        speed_limit_kmh: e.speedLimitKmh,
        duration_ms: e.durationMs,
        acceleration_ms2: e.accelerationMs2,
        road_name: e.roadName,
        recorded_at: new Date(e.timestamp).toISOString(),
      }));

      const { error } = await supabase
        .from('driving_behavior_events')
        .insert(records);

      if (error) {
        // Re-queue failed events
        eventQueueRef.current = [...eventsToSync, ...eventQueueRef.current];
        console.error('[Driving Behavior] Sync failed:', error);
      } else {
        console.log('[Driving Behavior] Synced', eventsToSync.length, 'events');
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Check for speeding based on current speed and limit
  const checkSpeeding = useCallback((
    speedKmh: number,
    speedLimitKmh: number | null,
    location: { lat: number; lon: number } | null,
    roadName?: string | null
  ) => {
    if (!speedLimitKmh || speedKmh <= 0) {
      speedingStartRef.current = null;
      return;
    }

    const excess = speedKmh - speedLimitKmh;
    const isExceeding = excess > opts.speedLimitToleranceKmh!;
    const now = Date.now();

    if (isExceeding) {
      if (!speedingStartRef.current) {
        speedingStartRef.current = now;
      } else {
        const duration = now - speedingStartRef.current;
        
        // Create event if exceeding for minimum duration
        // And not too soon after last event (5 second cooldown)
        if (duration >= opts.minSpeedingDurationMs! && 
            now - lastSpeedingEventRef.current > 5000) {
          addEvent({
            type: 'speeding',
            severity: excess > 20 ? 'high' : excess > 10 ? 'medium' : 'low',
            timestamp: now,
            latitude: location?.lat ?? null,
            longitude: location?.lon ?? null,
            speedKmh,
            speedLimitKmh,
            durationMs: duration,
            roadName,
          });
          
          lastSpeedingEventRef.current = now;
          speedingStartRef.current = now; // Reset for next event
        }
      }
    } else {
      speedingStartRef.current = null;
    }
  }, [opts.speedLimitToleranceKmh, opts.minSpeedingDurationMs, addEvent]);

  // Add harsh braking event (called from harsh braking detector)
  const addHarshBrake = useCallback((
    peakDeceleration: number,
    durationMs: number,
    location: { lat: number; lon: number } | null,
    currentSpeed?: number
  ) => {
    const severity = 
      Math.abs(peakDeceleration) >= 6.0 ? 'high' :
      Math.abs(peakDeceleration) >= 4.5 ? 'medium' : 'low';

    addEvent({
      type: 'harsh_brake',
      severity,
      timestamp: Date.now(),
      latitude: location?.lat ?? null,
      longitude: location?.lon ?? null,
      speedKmh: currentSpeed ?? null,
      speedLimitKmh: null,
      durationMs,
      accelerationMs2: peakDeceleration,
    });
  }, [addEvent]);

  // Start tracking for a session
  const startTracking = useCallback((telematicsSessionId: string) => {
    sessionIdRef.current = telematicsSessionId;
    eventQueueRef.current = [];
    speedingStartRef.current = null;
    lastSpeedingEventRef.current = 0;
    setEvents([]);
    setStats({
      harshBrakeCount: 0,
      speedingEventsCount: 0,
      speedingTotalSeconds: 0,
      maxSpeedOverLimitKmh: 0,
    });

    // Start periodic sync
    syncIntervalRef.current = setInterval(() => {
      syncEvents();
    }, opts.batchSyncIntervalMs!);

    console.log('[Driving Behavior] Started tracking for session:', telematicsSessionId);
  }, [opts.batchSyncIntervalMs, syncEvents]);

  // Stop tracking and final sync
  const stopTracking = useCallback(async () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Final sync
    await syncEvents();

    const finalStats = { ...stats };
    sessionIdRef.current = null;

    console.log('[Driving Behavior] Stopped tracking. Final stats:', finalStats);
    return finalStats;
  }, [syncEvents, stats]);

  return {
    events,
    stats,
    isSyncing,
    checkSpeeding,
    addHarshBrake,
    addEvent,
    startTracking,
    stopTracking,
    syncEvents,
  };
};
