import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { supabase } from '@/integrations/supabase/client';

interface GPSPoint {
  lat: number;
  lng: number;
  speedKmh: number;
  roadName: string;
  speedLimit: number;
  timestamp: number;
  harshBrake?: boolean;
  speeding?: boolean;
}

// Map auto-pan helper
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

// Custom marker icon
const currentMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type TrackerPhase = 'idle' | 'tracking' | 'stopped';

export default function TrackerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<TrackerPhase>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

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
      }
    } catch (err) {
      console.error('WakeLock error:', err);
    }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  };

  /* ---------------- Start Tracking ------------------------- */
  const startTracking = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const started = await gpsTracker.startTracking(sessionId);
      if (!started) throw new Error('Failed to start GPS');

      await harshBraking.startDetection();
      drivingBehavior.startTracking(sessionId);
      await requestWakeLock();

      startTimeRef.current = Date.now();
      setPhase('tracking');
      setGpsPoints([]);
      setElapsedTime(0);
    } catch (err) {
      console.error('Failed to start tracking:', err);
    }
  }, [sessionId, gpsTracker, harshBraking, drivingBehavior]);

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

  /* ---------------- Track GPS Points ---------------------- */
  useEffect(() => {
    if (phase !== 'tracking' || !gpsTracker.currentPosition) return;

    const pos = gpsTracker.currentPosition;
    const roadName = gpsTracker.speedLimitInfo?.roadName ?? 'Unknown road';
    const speedLimit = gpsTracker.speedLimitInfo?.speedLimit ?? 0;
    const speedKmh = pos.speedKmh;
    const speeding = speedLimit > 0 && speedKmh > speedLimit;

    // Haptic feedback
    if (navigator.vibrate) {
      if (speeding) navigator.vibrate(200);
    }

    const point: GPSPoint = {
      lat: pos.latitude,
      lng: pos.longitude,
      speedKmh,
      roadName,
      speedLimit,
      timestamp: Date.now(),
      speeding,
      harshBrake: false,
    };

    setGpsPoints(prev => [...prev, point]);
    setCurrentPos([pos.latitude, pos.longitude]);
  }, [gpsTracker.currentPosition, gpsTracker.speedLimitInfo, phase]);

  /* ---------------- Stop Tracking ------------------------- */
  const stopTracking = useCallback(async () => {
    if (phase !== 'tracking' || !sessionId) return;
    
    releaseWakeLock();
    if (timerRef.current) clearInterval(timerRef.current);

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

      await tripScore.calculateAndSaveScore(sessionId, tripStats);

      await supabase
        .from('lesson_telematics')
        .update({
          end_time: new Date().toISOString(),
          total_distance_km: gpsResult.totalDistance / 1000,
          max_speed_kmh: gpsResult.maxSpeed,
        })
        .eq('id', sessionId);
    } finally {
      setPhase('stopped');
    }
  }, [phase, sessionId, gpsTracker, harshBraking, drivingBehavior, elapsedTime, tripScore]);

  /* ---------------- Derived Values ------------------------ */
  const lastPoint = gpsPoints[gpsPoints.length - 1];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- Auto-start on mount ------------------- */
  useEffect(() => {
    if (sessionId && phase === 'idle') {
      startTracking();
    }
    
    return () => {
      gpsTracker.stopTracking();
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b z-[1000]">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Time: {formatTime(elapsedTime)}</p>
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{lastPoint?.roadName || 'Acquiring GPS...'}</span>
            {lastPoint?.speedLimit > 0 && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-600 bg-white font-bold text-black text-sm">
                {lastPoint.speedLimit}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className={`text-2xl font-bold ${lastPoint?.speeding ? 'text-destructive' : ''}`}>
            {Math.round(lastPoint?.speedKmh || 0)} <span className="text-sm font-normal">km/h</span>
          </p>
          <Button
            variant={phase === 'tracking' ? 'destructive' : 'default'}
            onClick={phase === 'tracking' ? stopTracking : startTracking}
            disabled={phase === 'stopped'}
          >
            {phase === 'tracking' ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={currentPos || [51.5074, -0.1278]}
          zoom={17}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {currentPos && <MapUpdater position={currentPos} />}
          {currentPos && <Marker position={currentPos} icon={currentMarkerIcon} />}
          {gpsPoints.length > 1 && (
            <Polyline positions={gpsPoints.map(p => [p.lat, p.lng] as [number, number])} color="#3b82f6" />
          )}
        </MapContainer>
      </div>

      {/* Trip Report */}
      {phase === 'stopped' && (
        <div className="absolute inset-0 bg-background/95 z-[1001] overflow-auto p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Trip Report</h2>
              <Button variant="outline" onClick={() => navigate('/instructor/track-lesson')}>
                Done
              </Button>
            </div>
            
            <div className="bg-card rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Road</th>
                    <th className="px-3 py-2 text-right">Speed</th>
                    <th className="px-3 py-2 text-right">Limit</th>
                    <th className="px-3 py-2 text-center">Speeding</th>
                    <th className="px-3 py-2 text-center">Harsh Brake</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gpsPoints.map((p, i) => (
                    <tr key={i} className={p.speeding ? 'bg-destructive/10' : ''}>
                      <td className="px-3 py-2">{new Date(p.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 py-2 truncate max-w-[120px]">{p.roadName}</td>
                      <td className="px-3 py-2 text-right">{Math.round(p.speedKmh)}</td>
                      <td className="px-3 py-2 text-right">{p.speedLimit || '-'}</td>
                      <td className="px-3 py-2 text-center">{p.speeding ? '⚠️' : '-'}</td>
                      <td className="px-3 py-2 text-center">{p.harshBrake ? '⚠️' : '-'}</td>
                    </tr>
                  ))}
                  {gpsPoints.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        No GPS points recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
