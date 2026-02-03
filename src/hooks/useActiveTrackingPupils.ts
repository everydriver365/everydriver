import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get the set of pupil IDs that are currently being tracked
 * (have active entries in live_pupil_positions)
 */
export function useActiveTrackingPupils(instructorId: string | null) {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveIds = useCallback(async () => {
    if (!instructorId) {
      setActiveIds(new Set());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('live_pupil_positions')
        .select('pupil_id')
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      if (error) throw error;

      const ids = new Set((data || []).map(d => d.pupil_id));
      setActiveIds(ids);
    } catch (err) {
      console.error('Error fetching active tracking pupils:', err);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId]);

  // Initial fetch and polling every 10s
  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    fetchActiveIds();
    const interval = setInterval(fetchActiveIds, 1000); // 1s polling for real-time updates

    return () => clearInterval(interval);
  }, [instructorId, fetchActiveIds]);

  // Real-time subscription for immediate updates
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel('active_tracking_pupils')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_pupil_positions',
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          fetchActiveIds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchActiveIds]);

  return {
    activeIds,
    isLoading,
    isTracking: (pupilId: string) => activeIds.has(pupilId),
    refetch: fetchActiveIds,
  };
}
