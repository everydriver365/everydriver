import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, AlertTriangle, MapPin } from 'lucide-react';

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';

interface RoadEvent {
  roadName: string;
  speedLimit: number;      // mph
  maxSpeed: number;        // mph
  speedExceeded: boolean;
  harshBrakes: number;
  harshAccelerations: number;
  turns: number;
}

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (telematicsId: string) => void;
}

type TrackerPhase = 'idle' | 'starting' | 'tracking' | 'stopping' | 'complete';

export const SimpleTracker: React.FC<SimpleTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
  onSessionEnd,
}) => {
  const [phase, setPhase] = useState<TrackerPhase>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roadEvents, setRoadEvents] = useState<Record<string, RoadEvent>>({});

  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  const drivingBehavior = useDrivingBehavior({});
  const gpsTracker = useSimpleGPSTracker({});
  const harshBraking = useHarshBrakingDetector({});
  const tripScore = useLocalTripScore();
  const telematicsSession = useTelematicsSession(instructorId);

  /* ---------------- Timer ----------------------------------------- */
  useEffect(() => {
    if (phase !== 'tracking') return;
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [phase]);

  /* ---------------- Track Road Events ----------------------------- */
  useEffect(() => {
    if (phase !== 'tracking' || !gpsTracker.currentPosition) return;

    const pos = gpsTracker.currentPosition;
    const road = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';
    const speedMph = Math.round(pos.speedKmh * 0.621371);
    const limitMph = gpsTracker.speedLimitInfo?.speedLimit
      ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
      : 0;

    setRoadEvents(prev => {
      const prevEvent = prev[road] ?? {
        roadName: road,
        speedLimit: limitMph,
        maxSpeed: 0,
        speedExceeded: false,
        harshBrakes: 0,
        harshAccelerations: 0,
        turns: 0,
      };

      const updatedEvent = { ...prevEvent };
      updatedEvent.maxSpeed = Math.max(prevEvent.maxSpeed, speedMph);
      if (limitMph > 0 && speedMph > limitMph) updatedEvent.speedExceeded = true;

      // Turns detection based on heading change
      if (pos.heading !== null && lastHeadingRef.current !== null) {
        const headingDiff = Math.abs(pos.heading - lastHeadingRef.current);
        if (headingDiff > 30) updatedEvent.turns = prevEvent.turns + 1;
      }
      lastHeadingRef.current = pos.heading;

      return { ...prev, [road]: updatedEvent };
    });
  }, [gpsTracker.currentPosition, gpsTracker.speedLimitInfo, phase]);

  /* ---------------- Cleanup --------------------------------------- */
  useEffect(() => {
    return () => {
      gpsTracker.stopTracking();
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  /* ---------------- Start ----------------------------------------- */
  const handleStart = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('starting');
    setError(null);
    setRoadEvents({});
    try {
      const session = await telematicsSession.createSession(lessonId, pupilId);
      if (!session) throw new Error('Failed to create session');
      await gpsTracker.startTracking(session.id);
      await harshBraking.startDetection();
      drivingBehavior.startTracking(session.id);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setPhase('tracking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
      telematicsSession.cancelSession();
      setPhase('idle');
    }
  }, [phase, lessonId, pupilId, telematicsSession, gpsTracker, harshBraking, drivingBehavior]);

  /* ---------------- Stop ------------------------------------------ */
  const handleStop = useCallback(async () => {
    if (phase !== 'tracking') return;
    setPhase('stopping');
    try {
      const gpsResult = gpsTracker.stopTracking();
      harshBraking.stopDetection();
      const behaviorStats = await drivingBehavior.stopTracking();

      const tripStats: TripStats = {
        harshBrakeCount: behaviorStats.harshBrakeCount,
        speedingEventsCount: behaviorStats.speedingEventsCount,
        speedingTotalSeconds: behaviorStats.speedingTotalSeconds,
        maxSpeedOverLimitKmh: behaviorStats.maxSpeedOverLimitKmh,
        totalDistanceKm: gpsResult.totalDistance / 1000,
        durationMinutes: elapsedTime / 60,
      };

      const sessionId = telematicsSession.currentSession?.id;
      if (sessionId) {
        await tripScore.calculateAndSaveScore(sessionId, tripStats);
        await telematicsSession.endSession(gpsResult.totalDistance, gpsResult.maxSpeed);
        onSessionEnd?.(sessionId);
      }
    } finally {
      setPhase('complete');
    }
  }, [phase, gpsTracker, harshBraking, drivingBehavior, elapsedTime, telematicsSession, tripScore, onSessionEnd]);

  /* ---------------- Derived --------------------------------------- */
  const roadName = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';
  const limitMph = gpsTracker.speedLimitInfo?.speedLimit
    ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
    : undefined;
  const speedMph = gpsTracker.currentPosition?.speedKmh
    ? Math.round(gpsTracker.currentPosition.speedKmh * 0.621371)
    : undefined;
  const isSpeeding = limitMph !== undefined && speedMph !== undefined && speedMph > limitMph;

  /* ---------------- COMPLETE REPORT -------------------------------- */
  if (phase === 'complete') {
    return (
      <div className="p-6 bg-card rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Drive Report</h2>
        <div className="space-y-4">
          {Object.values(roadEvents).map(event => (
            <div key={event.roadName} className="border-b border-border pb-3 last:border-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-foreground">{event.roadName}</span>
                <span className={`font-medium ${event.speedExceeded ? 'text-destructive' : 'text-foreground'}`}>
                  {event.maxSpeed} / {event.speedLimit} mph {event.speedExceeded ? '⚠️' : ''}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Harsh Brakes: {event.harshBrakes}</span>
                <span>Harsh Accel: {event.harshAccelerations}</span>
                <span>Turns: {event.turns}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- RENDER ---------------------------------------- */
  return (
    <div className="relative w-full min-h-[200px] rounded-xl overflow-hidden border bg-card">
      {/* TOP NAV */}
      <div className="w-full bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="truncate text-lg font-semibold text-foreground">{roadName}</div>
          <div className="flex items-center gap-3">
            {limitMph !== undefined && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-600 bg-white font-bold text-black text-sm">
                {limitMph}
              </div>
            )}
            {speedMph !== undefined && (
              <div className={`font-semibold text-sm ${isSpeeding ? 'text-destructive' : 'text-foreground'}`}>
                {speedMph} mph
              </div>
            )}
            {phase === 'tracking' && (
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
            )}
            {phase === 'tracking' && gpsTracker.currentPosition && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const { latitude, longitude } = gpsTracker.currentPosition!;
                  window.open(`/tracker-map?lat=${latitude}&lng=${longitude}`, '_blank');
                }}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Open Map
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* START BUTTON */}
      {phase === 'idle' && (
        <div className="flex items-center justify-center py-12">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg" onClick={handleStart}>
            <Play className="h-5 w-5 mr-2" />
            Start
          </Button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
