import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { putItem, getAllItems, deleteItem, isIndexedDBSupported } from '@/lib/offlineStorage';

interface QueuedGPSPoint {
  id: string;
  telematicsId: string;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  speedLimitKmh: number | null;
  heading: number | null;
  altitude: number | null;
  accuracy: number | null;
  roadName: string | null;
  recordedAt: string;
  queuedAt: string;
  synced: boolean;
  error: string | null;
}

interface UseOfflineGPSQueueReturn {
  isSupported: boolean;
  pendingCount: number;
  queueGPSPoint: (point: Omit<QueuedGPSPoint, 'id' | 'queuedAt' | 'synced' | 'error'>) => Promise<void>;
  syncQueue: () => Promise<{ synced: number; failed: number }>;
  clearQueue: () => Promise<void>;
}

export function useOfflineGPSQueue(): UseOfflineGPSQueueReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const isSupported = isIndexedDBSupported();

  // Load pending count on mount
  useEffect(() => {
    if (!isSupported) return;
    
    const loadCount = async () => {
      try {
        const items = await getAllItems<QueuedGPSPoint>('gpsPoints');
        const pending = items.filter(item => !item.synced);
        setPendingCount(pending.length);
      } catch (err) {
        console.error('[OfflineGPSQueue] Error loading count:', err);
      }
    };
    
    loadCount();
  }, [isSupported]);

  const queueGPSPoint = useCallback(async (
    point: Omit<QueuedGPSPoint, 'id' | 'queuedAt' | 'synced' | 'error'>
  ) => {
    if (!isSupported) return;

    const queuedPoint: QueuedGPSPoint = {
      ...point,
      id: crypto.randomUUID(),
      queuedAt: new Date().toISOString(),
      synced: false,
      error: null,
    };

    await putItem('gpsPoints', queuedPoint);
    setPendingCount(prev => prev + 1);
    
    console.log('[OfflineGPSQueue] Point queued:', queuedPoint.id);
  }, [isSupported]);

  const syncQueue = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isSupported) return { synced: 0, failed: 0 };

    const items = await getAllItems<QueuedGPSPoint>('gpsPoints');
    const pending = items.filter(item => !item.synced);
    
    let synced = 0;
    let failed = 0;

    for (const point of pending) {
      try {
        const { error } = await supabase
          .from('telematics_gps_points')
          .insert({
            telematics_id: point.telematicsId,
            latitude: point.latitude,
            longitude: point.longitude,
            speed_kmh: point.speedKmh,
            speed_limit_kmh: point.speedLimitKmh,
            heading: point.heading,
            altitude: point.altitude,
            accuracy: point.accuracy,
            road_name: point.roadName,
            recorded_at: point.recordedAt,
          });

        if (error) throw error;

        // Mark as synced and remove
        await deleteItem('gpsPoints', point.id);
        synced++;
      } catch (err) {
        // Mark error but keep in queue for retry
        point.error = err instanceof Error ? err.message : 'Unknown error';
        await putItem('gpsPoints', point);
        failed++;
      }
    }

    setPendingCount(failed);
    console.log(`[OfflineGPSQueue] Sync complete: ${synced} synced, ${failed} failed`);
    
    return { synced, failed };
  }, [isSupported]);

  const clearQueue = useCallback(async () => {
    if (!isSupported) return;

    const items = await getAllItems<QueuedGPSPoint>('gpsPoints');
    for (const item of items) {
      await deleteItem('gpsPoints', item.id);
    }
    setPendingCount(0);
  }, [isSupported]);

  return {
    isSupported,
    pendingCount,
    queueGPSPoint,
    syncQueue,
    clearQueue,
  };
}
