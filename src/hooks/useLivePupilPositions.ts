import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LivePupilPosition {
  id: string;
  pupil_id: string;
  pupilName: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading: number | null;
  accuracy: number | null;
  trip_status: 'idle' | 'driving' | 'stopped' | 'paused';
  updated_at: string;
  telematics_session_id: string | null;
  isStale: boolean;
}

interface UseLivePupilPositionsOptions {
  refreshIntervalMs?: number;
  staleThresholdMs?: number;
}

export function useLivePupilPositions(
  instructorId: string | null,
  options: UseLivePupilPositionsOptions = {}
) {
  const { refreshIntervalMs = 5000, staleThresholdMs = 300000 } = options; // 5s refresh, 5min stale
  
  const [positions, setPositions] = useState<LivePupilPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!instructorId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('live_pupil_positions')
        .select(`
          id, pupil_id, latitude, longitude, speed_kmh, heading, accuracy,
          trip_status, updated_at, telematics_session_id,
          pupils!inner(name)
        `)
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const now = Date.now();
      const formattedPositions: LivePupilPosition[] = (data || []).map((pos: any) => ({
        id: pos.id,
        pupil_id: pos.pupil_id,
        pupilName: pos.pupils?.name || 'Unknown',
        latitude: Number(pos.latitude),
        longitude: Number(pos.longitude),
        speed_kmh: Number(pos.speed_kmh) || 0,
        heading: pos.heading ? Number(pos.heading) : null,
        accuracy: pos.accuracy ? Number(pos.accuracy) : null,
        trip_status: pos.trip_status || 'idle',
        updated_at: pos.updated_at,
        telematics_session_id: pos.telematics_session_id,
        isStale: now - new Date(pos.updated_at).getTime() > staleThresholdMs,
      }));

      // Filter out very stale positions (> 5 minutes old)
      const activePositions = formattedPositions.filter(p => !p.isStale);
      
      setPositions(activePositions);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching live positions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setIsLoading(false);
    }
  }, [instructorId, staleThresholdMs]);

  // Initial fetch and polling
  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    fetchPositions();
    const interval = setInterval(fetchPositions, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [instructorId, fetchPositions, refreshIntervalMs]);

  // Real-time subscription
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel('live_positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_pupil_positions',
          filter: `instructor_id=eq.${instructorId}`,
        },
        (payload) => {
          console.log('[Realtime] Position update:', payload);
          // Refetch on any change for simplicity
          fetchPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchPositions]);

  // Derived stats
  const activeDrivingCount = positions.filter(p => p.trip_status === 'driving').length;
  const totalActiveCount = positions.length;
  const averageSpeed = positions.length > 0
    ? positions.reduce((sum, p) => sum + p.speed_kmh, 0) / positions.length
    : 0;

  return {
    positions,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchPositions,
    stats: {
      activeDrivingCount,
      totalActiveCount,
      averageSpeed: Math.round(averageSpeed),
    },
  };
}
