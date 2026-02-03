import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DrivingAlert {
  type: "weather" | "traffic";
  severity: "low" | "moderate" | "severe";
  title: string;
  description: string;
  temperature?: number;
  windSpeed?: number;
  visibility?: number;
  delay?: number;
  roadName?: string;
  icon: string;
}

export interface CurrentWeather {
  temperature: number | null;
  weatherCode: number | null;
  description: string;
  icon: string;
  windSpeed: number | null;
}

interface UseDrivingAlertsResult {
  alerts: DrivingAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  dismissedAlerts: Set<string>;
  dismissAlert: (alertId: string) => void;
  location: string | null;
  currentWeather: CurrentWeather | null;
}

const CACHE_KEY = "driving_alerts_cache";
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const DISMISSED_KEY = "driving_alerts_dismissed";

interface CachedAlerts {
  alerts: DrivingAlert[];
  timestamp: number;
  instructorId: string;
  location: string | null;
  currentWeather: CurrentWeather | null;
}

function getAlertId(alert: DrivingAlert): string {
  return `${alert.type}-${alert.title}-${alert.description}`.replace(/\s+/g, "_").toLowerCase();
}

function getCachedAlerts(instructorId: string): { alerts: DrivingAlert[]; location: string | null; currentWeather: CurrentWeather | null } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedAlerts = JSON.parse(cached);
    if (parsed.instructorId !== instructorId) return null;
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) return null;
    
    return { alerts: parsed.alerts, location: parsed.location, currentWeather: parsed.currentWeather || null };
  } catch {
    return null;
  }
}

function setCachedAlerts(instructorId: string, alerts: DrivingAlert[], location: string | null, currentWeather: CurrentWeather | null): void {
  try {
    const cache: CachedAlerts = {
      alerts,
      timestamp: Date.now(),
      instructorId,
      location,
      currentWeather,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

function getDismissedAlerts(): Set<string> {
  try {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return new Set();
    
    const parsed = JSON.parse(stored);
    // Reset dismissed alerts each day
    if (parsed.date !== today) {
      localStorage.removeItem(DISMISSED_KEY);
      return new Set();
    }
    
    return new Set(parsed.alerts);
  } catch {
    return new Set();
  }
}

function setDismissedAlert(alertId: string): void {
  try {
    const today = new Date().toDateString();
    const existing = getDismissedAlerts();
    existing.add(alertId);
    
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({
      date: today,
      alerts: Array.from(existing),
    }));
  } catch {
    // Ignore storage errors
  }
}

export function useDrivingAlerts(instructorId: string | undefined): UseDrivingAlertsResult {
  const [alerts, setAlerts] = useState<DrivingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(getDismissedAlerts);
  const [location, setLocation] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!instructorId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedAlerts(instructorId);
    if (cached) {
      setAlerts(cached.alerts);
      setLocation(cached.location);
      setCurrentWeather(cached.currentWeather);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-driving-alerts", {
        body: { instructorId },
      });

      if (fnError) throw fnError;

      const fetchedAlerts = data?.alerts || [];
      const fetchedLocation = data?.location || null;
      const fetchedWeather = data?.currentWeather || null;
      setAlerts(fetchedAlerts);
      setLocation(fetchedLocation);
      setCurrentWeather(fetchedWeather);
      setCachedAlerts(instructorId, fetchedAlerts, fetchedLocation, fetchedWeather);
    } catch (err) {
      console.error("Error fetching driving alerts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlert(alertId);
    setDismissedAlerts(prev => {
      const next = new Set(prev);
      next.add(alertId);
      return next;
    });
  }, []);

  // Fetch on mount and when instructorId changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Refresh every 10 minutes
  useEffect(() => {
    if (!instructorId) return;

    const interval = setInterval(() => {
      // Clear cache to force refresh
      localStorage.removeItem(CACHE_KEY);
      fetchAlerts();
    }, CACHE_DURATION_MS);

    return () => clearInterval(interval);
  }, [instructorId, fetchAlerts]);

  // Filter out dismissed alerts and only show moderate/severe by default
  const visibleAlerts = alerts.filter(alert => {
    const alertId = getAlertId(alert);
    if (dismissedAlerts.has(alertId)) return false;
    // Only show moderate and severe alerts (low severity is informational)
    return alert.severity !== "low";
  });

  return {
    alerts: visibleAlerts,
    loading,
    error,
    refetch: fetchAlerts,
    dismissedAlerts,
    dismissAlert,
    location,
    currentWeather,
  };
}

export { getAlertId };
