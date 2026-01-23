import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
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
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/* ------------------------------------------------------------------ */

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (telematicsId: string) => void;
}

type TrackerPhase = 'idle' | 'starting' | 'tracking' | 'stopping' | 'complete';

interface RoadSpeedStat {
  roadName: string;
  maxSpeedMph: number;
}

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
  const [roadStats, setRoadStats] = useState<Record<string, number>>({});

  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  /* ---------------- Hooks ----------------------------------------- */

  const drivingBehavior = useDrivingBehavior({});

  const gpsTracker = useSimpleGPSTracker({
    onSpeedingDetected: () => {},
  });

  const harshBraking = useHarshBrakingDetector({
    onHarshBrake: () => {},
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

  /* ---------------- Track road speeds ----------------------------- */

  useEffect(() => {
    if (phase !== 'tracking' || !gpsTracker.currentPosition) return;

    const road = gpsTracker.speedLimitInfo?.roadName;
    const speedMph = Math.round(gpsTracker.currentPosition.speedKmh * 0.621371);

    if (!road) return;

    setRoadStats((prev) => ({
      ...prev,
      [road]: Math.max(prev[road] ?? 0, speedMph),
    }));
  }, [gpsTracker.currentPosition, gpsTracker.speedLimitInfo, phase]);

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
    setRoadStats({});

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

  const limitMph =
    gpsTracker.speedLimitInfo?.speedLimit !== undefined
      ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
      : undefined;

  const speedMph =
    gpsTracker.currentPosition?.speedKmh !== undefined
      ? Math.round(gpsTracker.currentPosition.speedKmh * 0.621371)
      : undefined;

  const isSpeeding = limitMph !== undefined && speedMph !== undefined && speedMph > limitMph;

  /* ---------------- UI -------------------------------------------- */

  if (phase === 'complete') {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Drive Report</h2>
        <div className="space-y-2">
          {Object.entries(roadStats).map(([road, maxSpeed]) => (
            <div key={road} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{road}</span>
              <span className="font-medium">{maxSpeed} mph</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const mapPosition: [number, number] | null = gpsTracker.currentPosition
    ? [gpsTracker.currentPosition.latitude, gpsTracker.currentPosition.longitude]
    : null;

  return (
    <div className="relative w-full h-[70vh] rounded-xl overflow-hidden border">
      {/* MAP */}
      {mapPosition && (
        <MapContainer center={mapPosition} zoom={17} className="h-full w-full" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater position={mapPosition} />
          <Marker position={mapPosition} icon={currentMarkerIcon} />
        </MapContainer>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3">
        <div className="bg-background/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
          <p className="text-xs text-muted-foreground text-center truncate">{roadName}</p>
          <div className="flex items-center justify-center gap-3">
            <p className={`text-2xl font-bold tabular-nums ${isSpeeding ? 'text-destructive' : 'text-foreground'}`}>
              {speedMph !== undefined && limitMph !== undefined ? `${speedMph} / ${limitMph} mph` : '—'}
            </p>
            {phase === 'tracking' && (
              <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* START BUTTON */}
      {phase === 'idle' && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/50">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg" onClick={handleStart}>
            <Play className="h-5 w-5 mr-2" />
            Start
          </Button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
