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

interface SimulationConfig {
  routeId: string;
  playbackSpeed: number; // 1 = realtime, 2 = 2x speed, etc.
  isPaused: boolean;
}

interface RouteSimulationState {
  isSimulating: boolean;
  progress: number;
  currentPointIndex: number;
  totalPoints: number;
}

export function useRouteSimulation(instructorId: string) {
  const [simulationState, setSimulationState] = useState<RouteSimulationState>({
    isSimulating: false,
    progress: 0,
    currentPointIndex: 0,
    totalPoints: 0
  });
  const [simulatedPoints, setSimulatedPoints] = useState<GPSPoint[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const simulationIntervalRef = useRef<number | null>(null);
  const configRef = useRef<SimulationConfig | null>(null);
  const routePointsRef = useRef<GPSPoint[]>([]);
  const pointIndexRef = useRef(0);

  // Calculate distance between two GPS points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Load route data from database
  const loadRouteData = async (routeId: string): Promise<GPSPoint[]> => {
    // First try to load from telematics_gps_points (recorded routes)
    const { data: route } = await supabase
      .from('saved_routes')
      .select('telematics_id, route_type')
      .eq('id', routeId)
      .single();

    if (!route) throw new Error('Route not found');

    if (route.route_type === 'recorded' && route.telematics_id) {
      // Load from GPS points
      const { data: gpsPoints, error } = await supabase
        .from('telematics_gps_points')
        .select('*')
        .eq('telematics_id', route.telematics_id)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      return (gpsPoints || []).map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        speed_kmh: p.speed_kmh,
        heading: p.heading,
        altitude_m: p.altitude_m,
        accuracy_m: p.accuracy_m || p.gps_accuracy_m,
        recorded_at: p.recorded_at
      }));
    } else {
      // Load from saved_route_waypoints (uploaded routes)
      const { data: waypoints, error } = await supabase
        .from('saved_route_waypoints')
        .select('*')
        .eq('route_id', routeId)
        .order('sequence', { ascending: true });

      if (error) throw error;

      // Generate simulated GPS points from waypoints
      return (waypoints || []).map((wp, index, arr) => {
        let speed = 30; // Default speed
        if (index > 0) {
          const dist = calculateDistance(
            arr[index - 1].latitude,
            arr[index - 1].longitude,
            wp.latitude,
            wp.longitude
          );
          // Assume 2 second intervals between points for speed calculation
          speed = (dist / 2) * 3600;
        }

        return {
          latitude: wp.latitude,
          longitude: wp.longitude,
          speed_kmh: Math.min(speed, 70), // Cap at 70 km/h
          heading: null,
          altitude_m: null,
          accuracy_m: 10, // Simulated accuracy
          recorded_at: new Date().toISOString()
        };
      });
    }
  };

  // Start simulation
  const startSimulation = useCallback(async (routeId: string, playbackSpeed: number = 1) => {
    setError(null);
    console.log('[Simulation] Starting route playback', { routeId, playbackSpeed });

    try {
      const points = await loadRouteData(routeId);
      
      if (points.length < 2) {
        throw new Error('Route has insufficient data points for simulation');
      }

      routePointsRef.current = points;
      pointIndexRef.current = 0;
      configRef.current = { routeId, playbackSpeed, isPaused: false };

      setSimulatedPoints([]);
      setTotalDistance(0);
      setCurrentSpeed(0);
      setSimulationState({
        isSimulating: true,
        progress: 0,
        currentPointIndex: 0,
        totalPoints: points.length
      });

      // Start the simulation interval
      const intervalMs = 1000 / playbackSpeed;
      simulationIntervalRef.current = window.setInterval(() => {
        if (configRef.current?.isPaused) return;

        const index = pointIndexRef.current;
        const points = routePointsRef.current;

        if (index >= points.length) {
          // Simulation complete
          stopSimulation();
          return;
        }

        const point = points[index];
        setSimulatedPoints(prev => [...prev, point]);
        setCurrentSpeed(point.speed_kmh || 0);

        // Calculate distance
        if (index > 0) {
          const prevPoint = points[index - 1];
          const dist = calculateDistance(
            prevPoint.latitude,
            prevPoint.longitude,
            point.latitude,
            point.longitude
          );
          setTotalDistance(prev => prev + dist);
        }

        pointIndexRef.current = index + 1;
        setSimulationState(prev => ({
          ...prev,
          progress: ((index + 1) / points.length) * 100,
          currentPointIndex: index + 1
        }));

      }, intervalMs);

      console.log('[Simulation] Playback started');

    } catch (err) {
      console.error('[Simulation] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
      setSimulationState(prev => ({ ...prev, isSimulating: false }));
    }
  }, []);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    configRef.current = null;
    pointIndexRef.current = 0;
    routePointsRef.current = [];
    
    setSimulationState({
      isSimulating: false,
      progress: 100,
      currentPointIndex: 0,
      totalPoints: 0
    });
    
    console.log('[Simulation] Stopped');
  }, []);

  // Pause/Resume simulation
  const togglePause = useCallback(() => {
    if (configRef.current) {
      configRef.current.isPaused = !configRef.current.isPaused;
      console.log('[Simulation]', configRef.current.isPaused ? 'Paused' : 'Resumed');
    }
  }, []);

  // Set playback speed
  const setPlaybackSpeed = useCallback((speed: number) => {
    if (configRef.current && simulationIntervalRef.current) {
      configRef.current.playbackSpeed = speed;
      
      // Restart interval with new speed
      clearInterval(simulationIntervalRef.current);
      const intervalMs = 1000 / speed;
      
      simulationIntervalRef.current = window.setInterval(() => {
        if (configRef.current?.isPaused) return;

        const index = pointIndexRef.current;
        const points = routePointsRef.current;

        if (index >= points.length) {
          stopSimulation();
          return;
        }

        const point = points[index];
        setSimulatedPoints(prev => [...prev, point]);
        setCurrentSpeed(point.speed_kmh || 0);

        if (index > 0) {
          const prevPoint = points[index - 1];
          const dist = calculateDistance(
            prevPoint.latitude,
            prevPoint.longitude,
            point.latitude,
            point.longitude
          );
          setTotalDistance(prev => prev + dist);
        }

        pointIndexRef.current = index + 1;
        setSimulationState(prev => ({
          ...prev,
          progress: ((index + 1) / points.length) * 100,
          currentPointIndex: index + 1
        }));
      }, intervalMs);
    }
  }, [stopSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  return {
    simulationState,
    simulatedPoints,
    currentSpeed,
    totalDistance,
    error,
    startSimulation,
    stopSimulation,
    togglePause,
    setPlaybackSpeed,
    isPaused: configRef.current?.isPaused || false
  };
}
