import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Pupil {
  id: string;
  name: string;
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
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
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

  /* ---------------- Fetch Pupils --------------------------- */
  useEffect(() => {
    const fetchPupils = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: instructorData } = await (supabase as any)
        .from('instructors')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!instructorData) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pupilsData } = await (supabase as any)
        .from('pupils')
        .select('id, name')
        .eq('instructor_id', instructorData.id);

      if (pupilsData) {
        const validPupils = (pupilsData as Array<{ id: string; name: string | null }>)
          .filter(p => p.name !== null)
          .map(p => ({ id: p.id, name: p.name as string }));
        setPupils(validPupils);
      }
    };

    fetchPupils();
  }, []);

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

  /* ---------------- Cleanup ------------------------------- */
  useEffect(() => {
    return () => {
      gpsTracker.stopTracking();
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ---------------- Derived Values ------------------------ */
  const lastPoint = gpsPoints[gpsPoints.length - 1];
  const selectedPupilName = pupils.find(p => p.id === selectedPupil)?.name;
  
  // Convert km/h to mph
  const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b z-[1000]">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            Pupil: {selectedPupilName || '-'} • {formatTime(elapsedTime)}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{lastPoint?.roadName || '-'}</span>
            {lastPoint?.speedLimit > 0 && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-red-600 bg-white font-bold text-black text-sm shrink-0">
                {kmhToMph(lastPoint.speedLimit)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className={`text-2xl font-bold ${lastPoint?.speeding ? 'text-destructive' : ''}`}>
            {kmhToMph(lastPoint?.speedKmh || 0)} <span className="text-sm font-normal">mph</span>
          </p>
          <Button
            variant={phase === 'tracking' ? 'destructive' : 'default'}
            onClick={phase === 'tracking' ? stopTracking : startTracking}
            disabled={phase === 'stopped' || (phase === 'idle' && !selectedPupil)}
          >
            {phase === 'tracking' ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Pupil Selection Overlay */}
      {phase === 'idle' && (
        <div className="absolute inset-0 bg-background/95 z-[1001] flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold text-center">Select Pupil</h2>
            
            <Select value={selectedPupil || ''} onValueChange={setSelectedPupil}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pupil" />
              </SelectTrigger>
              <SelectContent>
                {pupils.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="w-full" 
              onClick={startTracking}
              disabled={!selectedPupil}
            >
              Start Tracking
            </Button>
          </div>
        </div>
      )}

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
                      <td className="px-3 py-2 text-right">{kmhToMph(p.speedKmh)}</td>
                      <td className="px-3 py-2 text-right">{p.speedLimit ? kmhToMph(p.speedLimit) : '-'}</td>
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
