import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';

/* ------------------------------------------------------------------ */
/* Map updater                                                         */
/* ------------------------------------------------------------------ */
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.panTo(position, { animate: true });
  }, [position, map]);

  return null;
};

/* ------------------------------------------------------------------ */
/* Marker                                                              */
/* ------------------------------------------------------------------ */
const currentMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* ------------------------------------------------------------------ */

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (telematicsId: string) => void;
}

type TrackerPhase = 'idle' | 'starting' | 'tracking' | 'stopping' | 'complete';

/* ------------------------------------------------------------------ */

export const SimpleTracker: React.FC<SimpleTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
  onSessionEnd,
}) => {
  const [phase, setPhase] = useState<TrackerPhase>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  /* ---------------- Hooks ----------------------------------------- */

  const drivingBehavior = useDrivingBehavior({});

  const gpsTracker = useSimpleGPSTracker({
    onSpeedingDetected: (speed, limit, location) => {
      drivingBehavior.checkSpeeding(speed, limit, location, gpsTracker.speedLimitInfo?.roadName);
    },
  });

  const harshBraking = useHarshBrakingDetector({
    onHarshBrake: (event) => {
      drivingBehavior.addHarshBrake(
        event.peakDeceleration,
        event.duration,
        event.location,
        gpsTracker.currentPosition?.speedKmh
      );
    },
  });

  const tripScore = useLocalTripScore();
  const telematicsSession = useTelematicsSession(instructorId);

  /* ---------------- Timer ----------------------------------------- */

  useEffect(() => {
    if (phase !== 'tracking') return;

    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  /* ---------------- Cleanup --------------------------------------- */

  useEffect(() => {
    return () => {
      gpsTracker.stopTracking();
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /* ---------------- Start ----------------------------------------- */

  const handleStart = useCallback(async () => {
    if (phase !== 'idle') return;

    setPhase('starting');
    setError(null);

    try {
      const session = await telematicsSession.createSession(lessonId, pupilId);
      if (!session) throw new Error('Failed to create session');

      const gpsStarted = await gpsTracker.startTracking(session.id);
      if (!gpsStarted) throw new Error(gpsTracker.state.message || 'GPS failed to start');

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
    } catch (err) {
      console.error(err);
    } finally {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhase('complete');
    }
  }, [phase, gpsTracker, harshBraking, drivingBehavior, elapsedTime, telematicsSession, tripScore, onSessionEnd]);

  /* ---------------- Derived values -------------------------------- */

  const roadName = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';

  const limitMph =
    gpsTracker.speedLimitInfo?.speedLimit !== undefined
      ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
      : undefined;

  const speedMph =
    gpsTracker.currentPosition?.speedKmh !== undefined
      ? Math.round(gpsTracker.currentPosition.speedKmh * 0.621371)
      : undefined;

  const isSpeeding = limitMph !== undefined && speedMph !== undefined && speedMph > limitMph;

  const mapPosition: [number, number] | null = gpsTracker.currentPosition
    ? [gpsTracker.currentPosition.latitude, gpsTracker.currentPosition.longitude]
    : null;

  /* ---------------- UI -------------------------------------------- */

  return (
    <Card className="w-full overflow-hidden">
      {/* Apple-style nav header */}
      <div className="bg-muted/80 backdrop-blur-sm border-b px-4 py-3">
        <p className="text-xs text-muted-foreground text-center truncate">
          {roadName}
        </p>
        <p
          className={`text-lg font-semibold text-center tabular-nums ${
            isSpeeding ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {speedMph !== undefined && limitMph !== undefined
            ? `${speedMph} / ${limitMph} mph`
            : '—'}
        </p>
      </div>

      <CardContent className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={handleStart} disabled={phase !== 'idle'} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>

          <Button
            onClick={handleStop}
            disabled={phase !== 'tracking'}
            variant="destructive"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground tabular-nums">
          Elapsed: {Math.floor(elapsedTime / 60)}:
          {(elapsedTime % 60).toString().padStart(2, '0')}
        </p>

        {mapPosition && (
          <div className="h-48 rounded-lg overflow-hidden border">
            <MapContainer
              center={mapPosition}
              zoom={16}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapUpdater position={mapPosition} />
              <Marker position={mapPosition} icon={currentMarkerIcon} />
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
