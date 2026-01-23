import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Square, AlertTriangle, Star, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { supabase } from '@/integrations/supabase/client';
import { saveFavoriteRoute } from '@/lib/favoriteRoutes';

// Map auto-pan helper
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true });
  }, [position, map]);
  return null;
};

interface RoadEvent {
  roadName: string;
  speedLimit: number;
  maxSpeed: number;
  speedExceeded: boolean;
  harshBrakes: number;
  harshAccelerations: number;
  turns: number;
}

// Custom marker icon
const currentMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type TrackerPhase = 'initializing' | 'tracking' | 'stopping' | 'complete' | 'error';

export default function TrackerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<TrackerPhase>('initializing');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roadEventsState, setRoadEventsState] = useState<Record<string, RoadEvent>>({});
  const [pathForRender, setPathForRender] = useState<[number, number][]>([]);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fullPathRef = useRef<[number, number][]>([]);
  const roadEventsRef = useRef<Record<string, RoadEvent>>({});

  // Hooks
  const gpsTracker = useSimpleGPSTracker({});
  const harshBraking = useHarshBrakingDetector({});
  const drivingBehavior = useDrivingBehavior({});
  const tripScore = useLocalTripScore();

  /* ---------------- Wake Lock ------------------------------ */
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('WakeLock acquired');
      }
    } catch (err) {
      console.error('WakeLock error:', err);
    }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  };

  /* ---------------- Initialize Tracking -------------------- */
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setPhase('error');
      return;
    }

    const initTracking = async () => {
      try {
        // Start GPS tracking
        const started = await gpsTracker.startTracking(sessionId);
        if (!started) {
          throw new Error('Failed to start GPS tracking');
        }

        // Start motion detection
        await harshBraking.startDetection();
        drivingBehavior.startTracking(sessionId);

        // Request wake lock
        await requestWakeLock();

        startTimeRef.current = Date.now();
        setPhase('tracking');
      } catch (err) {
        console.error('Failed to initialize tracking:', err);
        setError(err instanceof Error ? err.message : 'Failed to start tracking');
        setPhase('error');
      }
    };

    initTracking();

    return () => {
      gpsTracker.stopTracking();
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  /* ---------------- Timer --------------------------------- */
  useEffect(() => {
    if (phase !== 'tracking') return;
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  /* ---------------- Track Road Events -------------------- */
  useEffect(() => {
    if (phase !== 'tracking' || !gpsTracker.currentPosition) return;

    const pos = gpsTracker.currentPosition;
    const road = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';
    const speedMph = Math.round(pos.speedKmh * 0.621371);
    const limitMph = gpsTracker.speedLimitInfo?.speedLimit
      ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
      : 0;

    // Track full path
    fullPathRef.current.push([pos.latitude, pos.longitude]);
    setPathForRender([...fullPathRef.current]);

    const prevEvent = roadEventsRef.current[road] ?? {
      roadName: road,
      speedLimit: limitMph,
      maxSpeed: 0,
      speedExceeded: false,
      harshBrakes: 0,
      harshAccelerations: 0,
      turns: 0,
    };

    prevEvent.maxSpeed = Math.max(prevEvent.maxSpeed, speedMph);
    if (limitMph > 0 && speedMph > limitMph) prevEvent.speedExceeded = true;

    // Turns detection based on heading change
    if (pos.heading !== null && lastHeadingRef.current !== null) {
      const headingDiff = Math.abs(pos.heading - lastHeadingRef.current);
      if (headingDiff > 30) prevEvent.turns += 1;
    }
    lastHeadingRef.current = pos.heading;

    roadEventsRef.current = { ...roadEventsRef.current, [road]: prevEvent };
    setRoadEventsState({ ...roadEventsRef.current });
  }, [gpsTracker.currentPosition, gpsTracker.speedLimitInfo, phase]);

  /* ---------------- Stop Tracking ------------------------- */
  const handleStop = useCallback(async () => {
    if (phase !== 'tracking' || !sessionId) return;
    setPhase('stopping');
    releaseWakeLock();

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

      // Calculate and save score
      await tripScore.calculateAndSaveScore(sessionId, tripStats);

      // Update session in database
      await supabase
        .from('lesson_telematics')
        .update({
          end_time: new Date().toISOString(),
          total_distance_km: gpsResult.totalDistance / 1000,
          max_speed_kmh: gpsResult.maxSpeed,
        })
        .eq('id', sessionId);

    } finally {
      setPhase('complete');
    }
  }, [phase, sessionId, gpsTracker, harshBraking, drivingBehavior, elapsedTime, tripScore]);

  /* ---------------- Save Favorite ------------------------ */
  const handleSaveFavorite = () => {
    const name = prompt('Enter a name for this route:', `Route ${new Date().toLocaleString()}`);
    if (!name) return;
    saveFavoriteRoute({
      name,
      path: fullPathRef.current,
      roadEvents: roadEventsRef.current,
      createdAt: new Date().toISOString(),
    });
    alert(`Route "${name}" saved!`);
  };

  /* ---------------- Derived -------------------------------- */
  const roadName = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';
  const limitMph = gpsTracker.speedLimitInfo?.speedLimit
    ? Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)
    : undefined;
  const speedMph = gpsTracker.currentPosition?.speedKmh
    ? Math.round(gpsTracker.currentPosition.speedKmh * 0.621371)
    : undefined;
  const isSpeeding = limitMph !== undefined && speedMph !== undefined && speedMph > limitMph;

  const mapPosition: [number, number] | null = gpsTracker.currentPosition
    ? [gpsTracker.currentPosition.latitude, gpsTracker.currentPosition.longitude]
    : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- Error State --------------------------- */
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Tracking Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- Complete Report ----------------------- */
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Drive Report</h1>
            <Button variant="outline" size="sm" onClick={() => navigate('/instructor/track-lesson')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="bg-card rounded-xl border p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{fullPathRef.current.length}</div>
                <div className="text-sm text-muted-foreground">GPS Points</div>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full mb-4" onClick={handleSaveFavorite}>
            <Star className="h-4 w-4 mr-2" />
            Save as Favorite Route
          </Button>

          <div className="bg-card rounded-xl border">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Road Summary</h2>
            </div>
            <div className="divide-y">
              {Object.values(roadEventsRef.current).map(event => (
                <div key={event.roadName} className="p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{event.roadName}</span>
                    <span className={event.speedExceeded ? 'text-destructive font-medium' : 'text-foreground'}>
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
              {Object.keys(roadEventsRef.current).length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No road data recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Tracking UI --------------------------- */
  return (
    <div className="fixed inset-0 bg-background">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-background/90 backdrop-blur-md border-b safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="truncate text-lg font-semibold">{roadName}</div>
            <div className="text-sm text-muted-foreground">{formatTime(elapsedTime)}</div>
          </div>
          <div className="flex items-center gap-3">
            {limitMph !== undefined && (
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-red-600 bg-white font-bold text-black text-lg">
                {limitMph}
              </div>
            )}
            {speedMph !== undefined && (
              <div className={`text-2xl font-bold ${isSpeeding ? 'text-destructive' : 'text-foreground'}`}>
                {speedMph}
                <span className="text-sm font-normal ml-1">mph</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      {mapPosition ? (
        <MapContainer
          center={mapPosition}
          zoom={17}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater position={mapPosition} />
          <Marker position={mapPosition} icon={currentMarkerIcon} />
          {pathForRender.length > 1 && (
            <Polyline positions={pathForRender} color="#3b82f6" weight={4} />
          )}
        </MapContainer>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-4xl mb-2">📍</div>
            <div className="text-muted-foreground">Acquiring GPS...</div>
          </div>
        </div>
      )}

      {/* Stop Button */}
      <div className="absolute bottom-8 left-0 right-0 z-[1000] flex justify-center safe-area-inset-bottom">
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full px-8 py-6 text-lg shadow-lg"
          onClick={handleStop}
          disabled={phase !== 'tracking'}
        >
          <Square className="h-5 w-5 mr-2" />
          Stop Tracking
        </Button>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-[1000]">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
