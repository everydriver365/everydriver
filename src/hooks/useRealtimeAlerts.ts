import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TelematicsAlert {
  id: string;
  telematics_id: string;
  alert_type: 'speeding' | 'harsh_brake' | 'harsh_accel' | 'phone_usage' | 'sharp_turn';
  severity: 'low' | 'medium' | 'high';
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  speed_delta: number | null;
  latitude: number | null;
  longitude: number | null;
  road_name: string | null;
  acknowledged: boolean;
  created_at: string;
}

interface UseRealtimeAlertsOptions {
  onNewAlert?: (alert: TelematicsAlert) => void;
  enableHapticFeedback?: boolean;
}

export const useRealtimeAlerts = (
  sessionId: string | null,
  options: UseRealtimeAlertsOptions = {}
) => {
  const [alerts, setAlerts] = useState<TelematicsAlert[]>([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [latestAlert, setLatestAlert] = useState<TelematicsAlert | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { onNewAlert, enableHapticFeedback = true } = options;

  // Trigger haptic feedback
  const triggerHaptic = useCallback((severity: string) => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    switch (severity) {
      case 'high':
        navigator.vibrate([100, 50, 100, 50, 100]); // Triple vibration
        break;
      case 'medium':
        navigator.vibrate([100, 50, 100]); // Double vibration
        break;
      default:
        navigator.vibrate(100); // Single short vibration
    }
  }, [enableHapticFeedback]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('telematics_alerts')
      .update({ 
        acknowledged: true, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a)
      );
      setUnacknowledgedCount(prev => Math.max(0, prev - 1));
    }

    return !error;
  }, []);

  // Acknowledge all alerts
  const acknowledgeAll = useCallback(async () => {
    if (!sessionId) return false;

    const { error } = await supabase
      .from('telematics_alerts')
      .update({ 
        acknowledged: true, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('telematics_id', sessionId)
      .eq('acknowledged', false);

    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
      setUnacknowledgedCount(0);
    }

    return !error;
  }, [sessionId]);

  // Use ref for callback to avoid infinite loop
  const onNewAlertRef = useRef(onNewAlert);
  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  // Fetch existing alerts for session
  const fetchAlerts = useCallback(async (sid: string) => {
    const { data, error } = await supabase
      .from('telematics_alerts')
      .select('*')
      .eq('telematics_id', sid)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const typedAlerts = data as TelematicsAlert[];
      setAlerts(typedAlerts);
      setUnacknowledgedCount(typedAlerts.filter(a => !a.acknowledged).length);
    }
  }, []);

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!sessionId) {
      // Clean up if session is cleared
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setAlerts([]);
      setUnacknowledgedCount(0);
      setIsSubscribed(false);
      return;
    }

    // Fetch existing alerts first
    fetchAlerts(sessionId);

    // Set up realtime subscription
    const channel = supabase
      .channel(`telematics-alerts-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telematics_alerts',
          filter: `telematics_id=eq.${sessionId}`,
        },
        (payload) => {
          const newAlert = payload.new as TelematicsAlert;
          console.log('[Realtime Alerts] New alert received:', newAlert.alert_type);
          
          setAlerts(prev => [newAlert, ...prev]);
          setUnacknowledgedCount(prev => prev + 1);
          setLatestAlert(newAlert);
          
          // Trigger haptic feedback
          triggerHaptic(newAlert.severity);
          
          // Call callback if provided (use ref to avoid stale closure)
          onNewAlertRef.current?.(newAlert);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime Alerts] Subscription status:', status);
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, fetchAlerts, triggerHaptic]);

  // Get alerts by type
  const getAlertsByType = useCallback((type: TelematicsAlert['alert_type']) => {
    return alerts.filter(a => a.alert_type === type);
  }, [alerts]);

  // Get alert counts by severity
  const alertCounts = {
    total: alerts.length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    unacknowledged: unacknowledgedCount,
  };

  // Clear latest alert after display
  const clearLatestAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  return {
    alerts,
    latestAlert,
    clearLatestAlert,
    alertCounts,
    isSubscribed,
    acknowledgeAlert,
    acknowledgeAll,
    getAlertsByType,
    refetch: fetchAlerts,
  };
};
