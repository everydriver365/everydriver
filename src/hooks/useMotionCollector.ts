import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MotionData {
  acceleration: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  gForce: number;
  timestamp: number;
}

export interface MotionQuality {
  isAvailable: boolean;
  hasPermission: boolean | null;
  sampleRate: number;
  lastUpdate: Date | null;
}

interface UseMotionCollectorOptions {
  sampleInterval?: number; // Minimum time between samples (ms)
  gForceThreshold?: number; // Minimum G-force to record (filters noise)
  batchSize?: number; // Number of samples to batch before sending
  enableRecording?: boolean; // Whether to record to database
}

const DEFAULT_OPTIONS: UseMotionCollectorOptions = {
  sampleInterval: 100, // 10 samples per second max
  gForceThreshold: 0.15, // Only record if G-force > 0.15 (filters stationary noise)
  batchSize: 10, // Send every 10 significant samples
  enableRecording: true,
};

// Calculate G-force from acceleration values
const calculateGForce = (x: number, y: number, z: number): number => {
  // Subtract gravity (approximately 9.8 m/s²) from the magnitude
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  const gForce = Math.abs(magnitude - 9.81) / 9.81;
  return gForce;
};

export const useMotionCollector = (options: UseMotionCollectorOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isCollecting, setIsCollecting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [motionQuality, setMotionQuality] = useState<MotionQuality>({
    isAvailable: false,
    hasPermission: null,
    sampleRate: 0,
    lastUpdate: null,
  });
  const [currentMotion, setCurrentMotion] = useState<MotionData>({
    acceleration: null,
    rotationRate: null,
    gForce: 0,
    timestamp: Date.now(),
  });
  const [peakGForce, setPeakGForce] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lastSampleTimeRef = useRef<number>(0);
  const batchBufferRef = useRef<MotionData[]>([]);
  const sampleCountRef = useRef(0);
  const lastSecondRef = useRef(Date.now());

  // Check if motion sensors are available
  useEffect(() => {
    const isAvailable = 'DeviceMotionEvent' in window;
    setMotionQuality(prev => ({ ...prev, isAvailable }));
  }, []);

  // Request motion permission (required on iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if permission API exists (iOS 13+)
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        const granted = permission === 'granted';
        setMotionQuality(prev => ({ ...prev, hasPermission: granted }));
        
        if (!granted) {
          setError('Motion sensor permission denied');
        }
        return granted;
      } else {
        // No permission needed (Android, older iOS)
        setMotionQuality(prev => ({ ...prev, hasPermission: true }));
        return true;
      }
    } catch (err) {
      console.error('[Motion Collector] Permission error:', err);
      setError('Failed to request motion permission');
      setMotionQuality(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, []);

  // Flush batch buffer to database
  const flushBatch = useCallback(async () => {
    if (!sessionId || batchBufferRef.current.length === 0) return;

    const batch = [...batchBufferRef.current];
    batchBufferRef.current = [];

    try {
      const records = batch.map(data => ({
        telematics_id: sessionId,
        acceleration_x: data.acceleration?.x || null,
        acceleration_y: data.acceleration?.y || null,
        acceleration_z: data.acceleration?.z || null,
        rotation_alpha: data.rotationRate?.alpha || null,
        rotation_beta: data.rotationRate?.beta || null,
        rotation_gamma: data.rotationRate?.gamma || null,
        g_force: data.gForce,
        recorded_at: new Date(data.timestamp).toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('telematics_motion_raw')
        .insert(records);

      if (insertError) {
        console.error('[Motion Collector] Batch insert failed:', insertError);
        // Re-add failed records to buffer for retry
        batchBufferRef.current = [...batch, ...batchBufferRef.current];
      } else {
        setSampleCount(prev => prev + batch.length);
      }
    } catch (err) {
      console.error('[Motion Collector] Batch error:', err);
    }
  }, [sessionId]);

  // Handle device motion event
  const handleMotionEvent = useCallback((event: DeviceMotionEvent) => {
    const now = Date.now();
    
    // Throttle samples
    if (now - lastSampleTimeRef.current < opts.sampleInterval!) {
      return;
    }
    lastSampleTimeRef.current = now;

    // Update sample rate calculation
    sampleCountRef.current++;
    if (now - lastSecondRef.current >= 1000) {
      setMotionQuality(prev => ({
        ...prev,
        sampleRate: sampleCountRef.current,
        lastUpdate: new Date(),
      }));
      sampleCountRef.current = 0;
      lastSecondRef.current = now;
    }

    const accel = event.accelerationIncludingGravity;
    if (!accel || accel.x === null || accel.y === null || accel.z === null) {
      return;
    }

    const gForce = calculateGForce(accel.x, accel.y, accel.z);
    
    const motionData: MotionData = {
      acceleration: {
        x: accel.x,
        y: accel.y,
        z: accel.z,
      },
      rotationRate: event.rotationRate ? {
        alpha: event.rotationRate.alpha || 0,
        beta: event.rotationRate.beta || 0,
        gamma: event.rotationRate.gamma || 0,
      } : null,
      gForce,
      timestamp: now,
    };

    // Update current motion state
    setCurrentMotion(motionData);
    
    // Track peak G-force
    if (gForce > peakGForce) {
      setPeakGForce(gForce);
    }

    // Only record significant motion events
    if (opts.enableRecording && gForce >= opts.gForceThreshold!) {
      batchBufferRef.current.push(motionData);
      
      // Flush when batch is full
      if (batchBufferRef.current.length >= opts.batchSize!) {
        flushBatch();
      }
    }
  }, [opts.sampleInterval, opts.enableRecording, opts.gForceThreshold, opts.batchSize, peakGForce, flushBatch]);

  // Start motion collection
  const startCollection = useCallback(async (telematicsSessionId: string) => {
    if (isCollecting) {
      console.warn('[Motion Collector] Already collecting');
      return false;
    }

    if (!motionQuality.isAvailable) {
      setError('Motion sensors not available on this device');
      return false;
    }

    // Request permission if needed
    const hasPermission = motionQuality.hasPermission ?? await requestPermission();
    if (!hasPermission) {
      return false;
    }

    console.log('[Motion Collector] Starting collection for session:', telematicsSessionId);
    
    setSessionId(telematicsSessionId);
    setIsCollecting(true);
    setError(null);
    setSampleCount(0);
    setPeakGForce(0);
    batchBufferRef.current = [];
    lastSampleTimeRef.current = 0;

    // Start listening to motion events
    window.addEventListener('devicemotion', handleMotionEvent);
    
    return true;
  }, [isCollecting, motionQuality.isAvailable, motionQuality.hasPermission, requestPermission, handleMotionEvent]);

  // Stop motion collection
  const stopCollection = useCallback(async () => {
    console.log('[Motion Collector] Stopping collection');
    
    window.removeEventListener('devicemotion', handleMotionEvent);
    
    // Flush remaining batch
    await flushBatch();
    
    setIsCollecting(false);
    setSessionId(null);
    
    return {
      sampleCount,
      peakGForce,
    };
  }, [handleMotionEvent, flushBatch, sampleCount, peakGForce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotionEvent);
    };
  }, [handleMotionEvent]);

  return {
    isCollecting,
    startCollection,
    stopCollection,
    requestPermission,
    motionQuality,
    currentMotion,
    peakGForce,
    sampleCount,
    error,
  };
};
