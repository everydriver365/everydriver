import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  openDatabase,
  putItem,
  putItems,
  getAllItems,
  clearStore,
  getItemsByDateRange,
  setMetadata,
  getMetadata,
  isIndexedDBSupported,
} from '@/lib/offlineStorage';
import { format, addDays, subDays } from 'date-fns';

interface SyncQueueItem {
  id: string;
  instructor_id: string;
  action_type: 'insert' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  synced_at: string | null;
  error: string | null;
}

interface UseOfflineSyncOptions {
  instructorId?: string;
  autoSync?: boolean;
  syncIntervalMs?: number;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSupported: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  queueChange: (change: Omit<SyncQueueItem, 'id' | 'created_at' | 'synced_at' | 'error'>) => Promise<void>;
  cacheSchedules: () => Promise<void>;
  cachePupils: () => Promise<void>;
  getCachedSchedules: (date?: string) => Promise<unknown[]>;
  getCachedPupils: () => Promise<unknown[]>;
}

export function useOfflineSync(options: UseOfflineSyncOptions = {}): UseOfflineSyncReturn {
  const { instructorId, autoSync = true, syncIntervalMs = 30000 } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSupported = isIndexedDBSupported();

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncNow();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && isOnline && instructorId) {
      syncIntervalRef.current = setInterval(() => {
        syncNow();
      }, syncIntervalMs);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [autoSync, isOnline, instructorId, syncIntervalMs]);

  // Load initial pending count
  useEffect(() => {
    if (isSupported) {
      loadPendingCount();
      loadLastSyncTime();
    }
  }, [isSupported]);

  const loadPendingCount = async () => {
    try {
      const items = await getAllItems<SyncQueueItem>('syncQueue');
      const pending = items.filter(item => !item.synced_at);
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const time = await getMetadata<string>('lastSyncTime');
      if (time) {
        setLastSyncTime(new Date(time));
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  };

  const queueChange = useCallback(async (
    change: Omit<SyncQueueItem, 'id' | 'created_at' | 'synced_at' | 'error'>
  ) => {
    if (!isSupported) return;

    const item: SyncQueueItem = {
      ...change,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      synced_at: null,
      error: null,
    };

    await putItem('syncQueue', item);
    await loadPendingCount();

    // Try to sync immediately if online
    if (isOnline) {
      syncNow();
    }
  }, [isSupported, isOnline]);

  const syncNow = useCallback(async () => {
    if (!isSupported || !isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      // Get pending items
      const items = await getAllItems<SyncQueueItem>('syncQueue');
      const pending = items.filter(item => !item.synced_at);

      for (const item of pending) {
        try {
          // Process the sync action - use type assertion for dynamic table access
          const tableName = item.table_name;
          
          switch (item.action_type) {
            case 'insert': {
              // For inserts, we need to handle the payload as a single record
              const { error } = await supabase
                .from(tableName as 'lesson_history')
                .insert(item.payload as never);
              if (error) throw error;
              break;
            }
            case 'update': {
              const { error } = await supabase
                .from(tableName as 'lesson_history')
                .update(item.payload as never)
                .eq('id', item.record_id);
              if (error) throw error;
              break;
            }
            case 'delete': {
              const { error } = await supabase
                .from(tableName as 'lesson_history')
                .delete()
                .eq('id', item.record_id);
              if (error) throw error;
              break;
            }
          }

          // Mark as synced in local queue
          item.synced_at = new Date().toISOString();
          await putItem('syncQueue', item);

          // Also sync to Supabase queue table for audit
          await supabase.from('offline_sync_queue').insert({
            instructor_id: item.instructor_id,
            action_type: item.action_type,
            table_name: item.table_name,
            record_id: item.record_id,
            payload: item.payload as never,
            synced_at: item.synced_at,
          });
        } catch (error) {
          // Record error but continue with other items
          item.error = error instanceof Error ? error.message : 'Unknown error';
          await putItem('syncQueue', item);
        }
      }

      // Update last sync time
      const now = new Date();
      await setMetadata('lastSyncTime', now.toISOString());
      setLastSyncTime(now);

      // Reload pending count
      await loadPendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSupported, isOnline, isSyncing]);

  const cacheSchedules = useCallback(async () => {
    if (!isSupported || !instructorId) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      // Fetch schedules for today, tomorrow, and last 7 days
      const { data, error } = await supabase
        .from('scheduled_lessons')
        .select(`
          *,
          pupil:pupils(id, name, phone, postcode)
        `)
        .eq('instructor_id', instructorId)
        .gte('lesson_date', weekAgo)
        .lte('lesson_date', tomorrow)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        await clearStore('schedules');
        await putItems('schedules', data);
        console.log(`Cached ${data.length} schedules`);
      }
    } catch (error) {
      console.error('Failed to cache schedules:', error);
    }
  }, [isSupported, instructorId]);

  const cachePupils = useCallback(async () => {
    if (!isSupported || !instructorId) return;

    try {
      const { data, error } = await supabase
        .from('pupils')
        .select('id, name, phone, postcode, status, previous_experience')
        .eq('instructor_id', instructorId)
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        await clearStore('pupils');
        await putItems('pupils', data);
        console.log(`Cached ${data.length} pupils`);
      }
    } catch (error) {
      console.error('Failed to cache pupils:', error);
    }
  }, [isSupported, instructorId]);

  const getCachedSchedules = useCallback(async (date?: string) => {
    if (!isSupported) return [];

    try {
      if (date) {
        return await getItemsByDateRange('schedules', 'date', date, date);
      }
      return await getAllItems('schedules');
    } catch (error) {
      console.error('Failed to get cached schedules:', error);
      return [];
    }
  }, [isSupported]);

  const getCachedPupils = useCallback(async () => {
    if (!isSupported) return [];

    try {
      return await getAllItems('pupils');
    } catch (error) {
      console.error('Failed to get cached pupils:', error);
      return [];
    }
  }, [isSupported]);

  return {
    isOnline,
    isSupported,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    queueChange,
    cacheSchedules,
    cachePupils,
    getCachedSchedules,
    getCachedPupils,
  };
}

export default useOfflineSync;
