import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueuedGPSPoint {
  id: string;
  telematics_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  heading: number | null;
  altitude_m: number | null;
  accuracy_m: number | null;
  recorded_at: string;
  queued_at: string;
}

interface QueuedEvent {
  id: string;
  telematics_id: string;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  g_force?: number | null;
  sensor_source?: string | null;
  notes?: string | null;
  queued_at: string;
}

interface OfflineState {
  isOnline: boolean;
  queuedPoints: number;
  queuedEvents: number;
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  syncError: string | null;
}

const STORAGE_KEY_POINTS = 'telematics_offline_points';
const STORAGE_KEY_EVENTS = 'telematics_offline_events';

export function useOfflineTracking() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    queuedPoints: 0,
    queuedEvents: 0,
    isSyncing: false,
    lastSyncAttempt: null,
    syncError: null
  });

  const syncIntervalRef = useRef<number | null>(null);

  // Load queued data from localStorage on mount
  useEffect(() => {
    const points = getQueuedPoints();
    const events = getQueuedEvents();
    setOfflineState(prev => ({
      ...prev,
      queuedPoints: points.length,
      queuedEvents: events.length
    }));
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Connection restored');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      // Attempt to sync when coming back online
      syncQueuedData();
    };

    const handleOffline = () => {
      console.log('[Offline] Connection lost');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic sync attempt (every 30 seconds when online)
  useEffect(() => {
    if (offlineState.isOnline && (offlineState.queuedPoints > 0 || offlineState.queuedEvents > 0)) {
      syncIntervalRef.current = window.setInterval(() => {
        syncQueuedData();
      }, 30000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [offlineState.isOnline, offlineState.queuedPoints, offlineState.queuedEvents]);

  // Get queued points from localStorage
  const getQueuedPoints = (): QueuedGPSPoint[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POINTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Get queued events from localStorage
  const getQueuedEvents = (): QueuedEvent[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Queue a GPS point for later sync
  const queueGPSPoint = useCallback((point: Omit<QueuedGPSPoint, 'id' | 'queued_at'>) => {
    const queuedPoint: QueuedGPSPoint = {
      ...point,
      id: crypto.randomUUID(),
      queued_at: new Date().toISOString()
    };

    const points = getQueuedPoints();
    points.push(queuedPoint);
    localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(points));

    setOfflineState(prev => ({ ...prev, queuedPoints: points.length }));
    console.log('[Offline] GPS point queued', { queuedPoints: points.length });

    return queuedPoint;
  }, []);

  // Queue a driving event for later sync
  const queueDrivingEvent = useCallback((event: Omit<QueuedEvent, 'id' | 'queued_at'>) => {
    const queuedEvent: QueuedEvent = {
      ...event,
      id: crypto.randomUUID(),
      queued_at: new Date().toISOString()
    };

    const events = getQueuedEvents();
    events.push(queuedEvent);
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));

    setOfflineState(prev => ({ ...prev, queuedEvents: events.length }));
    console.log('[Offline] Event queued', { queuedEvents: events.length });

    return queuedEvent;
  }, []);

  // Sync queued data to database
  const syncQueuedData = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('[Offline] Cannot sync - offline');
      return { success: false, error: 'Offline' };
    }

    const points = getQueuedPoints();
    const events = getQueuedEvents();

    if (points.length === 0 && events.length === 0) {
      console.log('[Offline] Nothing to sync');
      return { success: true };
    }

    setOfflineState(prev => ({ 
      ...prev, 
      isSyncing: true, 
      lastSyncAttempt: new Date().toISOString(),
      syncError: null
    }));

    console.log('[Offline] Starting sync', { points: points.length, events: events.length });

    try {
      // Sync GPS points
      if (points.length > 0) {
        const pointsToInsert = points.map(({ id, queued_at, ...rest }) => rest);
        const { error: pointsError } = await supabase
          .from('telematics_gps_points')
          .insert(pointsToInsert);

        if (pointsError) {
          throw new Error(`GPS sync failed: ${pointsError.message}`);
        }

        // Clear synced points
        localStorage.removeItem(STORAGE_KEY_POINTS);
        console.log('[Offline] GPS points synced successfully');
      }

      // Sync driving events
      if (events.length > 0) {
        const eventsToInsert = events.map(({ id, queued_at, ...rest }) => rest);
        const { error: eventsError } = await supabase
          .from('driving_behavior_events')
          .insert(eventsToInsert);

        if (eventsError) {
          throw new Error(`Events sync failed: ${eventsError.message}`);
        }

        // Clear synced events
        localStorage.removeItem(STORAGE_KEY_EVENTS);
        console.log('[Offline] Driving events synced successfully');
      }

      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        queuedPoints: 0,
        queuedEvents: 0,
        syncError: null
      }));

      console.log('[Offline] Sync complete');
      return { success: true };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      console.error('[Offline] Sync error:', errorMsg);

      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: errorMsg
      }));

      return { success: false, error: errorMsg };
    }
  }, []);

  // Clear all queued data (use with caution)
  const clearQueuedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_POINTS);
    localStorage.removeItem(STORAGE_KEY_EVENTS);
    setOfflineState(prev => ({
      ...prev,
      queuedPoints: 0,
      queuedEvents: 0,
      syncError: null
    }));
    console.log('[Offline] Queue cleared');
  }, []);

  // Check if we should use offline mode for a given operation
  const shouldQueueOperation = useCallback((): boolean => {
    return !navigator.onLine;
  }, []);

  return {
    offlineState,
    queueGPSPoint,
    queueDrivingEvent,
    syncQueuedData,
    clearQueuedData,
    shouldQueueOperation,
    isOnline: offlineState.isOnline
  };
}
