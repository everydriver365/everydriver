import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  isIndexedDBSupported,
  getAllItems,
  putItems,
  clearStore,
  getMetadata,
  setMetadata,
} from '@/lib/offlineStorage';

interface UseOfflineDataOptions<T> {
  storeName: string;
  queryFn: () => Promise<T[]>;
  instructorId?: string;
  staleTimeMs?: number;
  enabled?: boolean;
}

interface UseOfflineDataReturn<T> {
  data: T[];
  isLoading: boolean;
  isFromCache: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useOfflineData<T>({
  storeName,
  queryFn,
  instructorId,
  staleTimeMs = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
}: UseOfflineDataOptions<T>): UseOfflineDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isSupported = isIndexedDBSupported();
  const metadataKey = `${storeName}_lastUpdated`;

  const loadFromCache = useCallback(async (): Promise<T[]> => {
    if (!isSupported) return [];
    
    try {
      const cached = await getAllItems<T>(storeName);
      const timestamp = await getMetadata<string>(metadataKey);
      
      if (timestamp) {
        setLastUpdated(new Date(timestamp));
      }
      
      return cached;
    } catch (err) {
      console.warn(`Failed to load ${storeName} from cache:`, err);
      return [];
    }
  }, [isSupported, storeName, metadataKey]);

  const saveToCache = useCallback(async (items: T[]): Promise<void> => {
    if (!isSupported) return;
    
    try {
      await clearStore(storeName);
      await putItems(storeName, items);
      const now = new Date().toISOString();
      await setMetadata(metadataKey, now);
      setLastUpdated(new Date(now));
    } catch (err) {
      console.warn(`Failed to save ${storeName} to cache:`, err);
    }
  }, [isSupported, storeName, metadataKey]);

  const isDataStale = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return true;
    
    try {
      const timestamp = await getMetadata<string>(metadataKey);
      if (!timestamp) return true;
      
      const lastUpdate = new Date(timestamp).getTime();
      return Date.now() - lastUpdate > staleTimeMs;
    } catch {
      return true;
    }
  }, [isSupported, metadataKey, staleTimeMs]);

  const fetchData = useCallback(async (forceRefresh = false): Promise<void> => {
    if (!enabled || !instructorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh && isSupported) {
        const stale = await isDataStale();
        const cached = await loadFromCache();
        
        if (cached.length > 0 && !stale) {
          setData(cached);
          setIsFromCache(true);
          setIsLoading(false);
          return;
        }
        
        // Show cached data while fetching fresh
        if (cached.length > 0) {
          setData(cached);
          setIsFromCache(true);
        }
      }

      // Fetch fresh data if online
      if (navigator.onLine) {
        const freshData = await queryFn();
        setData(freshData);
        setIsFromCache(false);
        await saveToCache(freshData);
      } else if (isSupported) {
        // Offline - use cache only
        const cached = await loadFromCache();
        setData(cached);
        setIsFromCache(true);
        
        if (cached.length === 0) {
          setError(new Error('No cached data available offline'));
        }
      } else {
        setError(new Error('Offline and no cache available'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      
      // Fall back to cache on error
      if (isSupported) {
        const cached = await loadFromCache();
        if (cached.length > 0) {
          setData(cached);
          setIsFromCache(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, instructorId, isSupported, queryFn, loadFromCache, saveToCache, isDataStale]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for online events to refetch
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && instructorId) {
        fetchData(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, instructorId, fetchData]);

  return {
    data,
    isLoading,
    isFromCache,
    error,
    refetch,
    lastUpdated,
  };
}

export default useOfflineData;
