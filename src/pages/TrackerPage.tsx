import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bookmark, MapPin, FileText, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SessionRouteReport from '@/components/instructor/SessionRouteReport';
import { toast } from 'sonner';

// Leaflet marker icon
const currentMarkerIcon = L.divIcon({
  className: 'current-position-marker',
  html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// MapUpdater component to pan map when position changes
function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { supabase } from '@/integrations/supabase/client';
import { useInstructorAuth } from '@/context/InstructorAuthContext';

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

type TrackerPhase = 'idle' | 'tracking' | 'stopped';

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate total route distance
const calculateTotalDistance = (points: GPSPoint[]): number => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total * 10) / 10;
};

export default function TrackerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [phase, setPhase] = useState<TrackerPhase>('idle');
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);

  // Save route dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [routeCategory, setRouteCategory] = useState('test_routes');
  const [saving, setSaving] = useState(false);
  
  // Route report sheet state
  const [showReportSheet, setShowReportSheet] = useState(false);

  // Category options
  const categoryOptions = [
    { value: 'test_routes', label: 'Test Routes' },
    { value: 'training', label: 'Training Routes' },
    { value: 'manoeuvres', label: 'Manoeuvres Practice' },
    { value: 'motorway', label: 'Motorway Driving' },
    { value: 'night', label: 'Night Driving' },
  ];

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Hooks
  const gpsTracker = useSimpleGPSTracker({ pupilId: selectedPupil });
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
      // Update session with selected pupil if one was chosen
      if (selectedPupil) {
        await supabase
          .from('lesson_telematics')
          .update({ pupil_id: selectedPupil })
          .eq('id', sessionId);
      }

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
  }, [sessionId, selectedPupil, gpsTracker, harshBraking, drivingBehavior]);

  /* ---------------- Auto-Start removed - user must select pupil first -- */

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
      const gpsResult = await gpsTracker.stopTracking(selectedPupil);
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

      // Update session with final stats
      await supabase
        .from('lesson_telematics')
        .update({
          ended_at: new Date().toISOString(),
          total_distance_km: gpsResult.totalDistance / 1000,
          max_speed_kmh: gpsResult.maxSpeed,
          avg_speed_kmh: null,
        })
        .eq('id', sessionId);

      // Process with Damoov if a pupil was selected
      if (selectedPupil) {
        console.log('[TrackerPage] Processing with Damoov for pupil:', selectedPupil);
        
        try {
          // Register pupil with Damoov
          const { data: registerData } = await supabase.functions.invoke('damoov-register', {
            body: { pupilId: selectedPupil },
          });
          
          const deviceToken = registerData?.deviceToken;
          console.log('[TrackerPage] Damoov device token:', deviceToken);
          
          if (deviceToken) {
            // Submit trip data to Damoov
            await supabase.functions.invoke('damoov-submit-trip', {
              body: { telematicsId: sessionId, deviceToken },
            });
            
            console.log('[TrackerPage] Trip submitted to Damoov, waiting for processing...');
            
            // Wait for Damoov to process
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            // Get scores from Damoov
            const { data: scoresData } = await supabase.functions.invoke('damoov-get-scores', {
              body: { telematicsId: sessionId, deviceToken, pupilId: selectedPupil },
            });
            
            if (scoresData?.scores) {
              console.log('[TrackerPage] Damoov scores received:', scoresData.scores);
              toast.success(`Damoov Score: ${scoresData.scores.overallScore || 'Processing...'}`);
            }
          }
        } catch (damoovErr) {
          console.warn('[TrackerPage] Damoov processing failed:', damoovErr);
          // Don't fail the whole stop - Damoov is optional enrichment
        }
      }
    } finally {
      setPhase('stopped');
    }
  }, [phase, sessionId, selectedPupil, gpsTracker, harshBraking, drivingBehavior, elapsedTime, tripScore]);

  /* ---------------- Cleanup ------------------------------- */
  useEffect(() => {
    return () => {
      gpsTracker.stopTracking(selectedPupil);
      harshBraking.stopDetection();
      drivingBehavior.stopTracking();
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedPupil]);

  /* ---------------- Derived Values ------------------------ */
  const lastPoint = gpsPoints[gpsPoints.length - 1];
  const selectedPupilName = pupils.find(p => p.id === selectedPupil)?.name;
  const totalDistance = calculateTotalDistance(gpsPoints);
  
  // Convert km/h to mph
  const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- Save Route ----------------------------- */
  const saveRoute = async () => {
    if (!instructorId || !routeName.trim()) {
      toast.error('Please enter a route name');
      return;
    }

    if (gpsPoints.length < 2) {
      toast.error('Not enough GPS points to save route');
      return;
    }

    setSaving(true);
    try {
      const startPoint = gpsPoints[0];
      const endPoint = gpsPoints[gpsPoints.length - 1];

      // Determine category - use pupil name if selected, otherwise use selected category
      const finalCategory = selectedPupil 
        ? `pupil_${selectedPupilName}` 
        : routeCategory;

      // Insert route
      const { data: routeData, error: routeError } = await supabase
        .from('saved_routes')
        .insert({
          instructor_id: instructorId,
          telematics_id: sessionId,
          pupil_id: selectedPupil || null,
          name: routeName.trim(),
          description: routeDescription.trim() || null,
          route_type: 'recorded',
          category: finalCategory,
          start_location: `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`,
          end_location: `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}`,
          distance_km: totalDistance
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Insert waypoints
      const waypoints = gpsPoints.map((point, index) => ({
        route_id: routeData.id,
        sequence: index,
        latitude: point.lat,
        longitude: point.lng,
        name: point.roadName || null
      }));

      const { error: waypointsError } = await supabase
        .from('saved_route_waypoints')
        .insert(waypoints);

      if (waypointsError) throw waypointsError;

      toast.success('Route saved successfully!');
      setShowSaveDialog(false);
      setRouteName('');
      setRouteDescription('');
      setRouteCategory('test_routes');
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b z-[1000]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Pupil: {selectedPupilName || '-'} • {formatTime(elapsedTime)}</span>
            {/* GPS Quality Indicator */}
            {gpsTracker.currentPosition && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                gpsTracker.currentPosition.accuracy <= 20 
                  ? 'bg-green-500/20 text-green-600' 
                  : gpsTracker.currentPosition.accuracy <= 50 
                    ? 'bg-yellow-500/20 text-yellow-600' 
                    : 'bg-red-500/20 text-red-600'
              }`}>
                GPS ±{Math.round(gpsTracker.currentPosition.accuracy)}m
              </span>
            )}
          </div>
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
              <SelectContent className="z-[1100] bg-popover">
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

      {/* Leaflet Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={currentPos || [51.5074, -0.1278]}
          zoom={16}
          className="h-full w-full"
          style={{ minHeight: '300px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentPos && (
            <Marker position={currentPos} icon={currentMarkerIcon} />
          )}
          {gpsPoints.length > 1 && (
            <Polyline
              positions={gpsPoints.map(p => [p.lat, p.lng] as [number, number])}
              color="#3b82f6"
              weight={4}
            />
          )}
          <MapUpdater position={currentPos} />
        </MapContainer>
      </div>

      {/* Trip Report */}
      {phase === 'stopped' && (
        <div className="absolute inset-0 bg-background z-[1001] flex flex-col">
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-3 border-b bg-card shrink-0">
            <h2 className="text-lg font-bold">Trip Report</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowReportSheet(true)}>
                <FileText className="h-4 w-4" />
                Full Report
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSaveDialog(true)}>
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
              <Button size="sm" onClick={() => navigate('/instructor/track-lesson')}>
                Done
              </Button>
            </div>
          </div>

          {/* Summary Stats - Compact */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-muted/50 text-center text-xs shrink-0">
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-semibold">{formatTime(elapsedTime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-semibold">{totalDistance.toFixed(1)}km</p>
            </div>
            <div>
              <p className="text-muted-foreground">Points</p>
              <p className="font-semibold">{gpsPoints.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alerts</p>
              <p className="font-semibold text-destructive">{gpsPoints.filter(p => p.speeding || p.harshBrake).length}</p>
            </div>
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left">Time</th>
                  <th className="px-2 py-1.5 text-left">Road</th>
                  <th className="px-2 py-1.5 text-right">mph</th>
                  <th className="px-2 py-1.5 text-right">Limit</th>
                  <th className="px-2 py-1.5 text-center w-8">⚠️</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gpsPoints.map((p, i) => (
                  <tr key={i} className={p.speeding || p.harshBrake ? 'bg-destructive/10' : ''}>
                    <td className="px-2 py-1">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td className="px-2 py-1 truncate max-w-[60px]">{p.roadName}</td>
                    <td className="px-2 py-1 text-right font-mono">{kmhToMph(p.speedKmh)}</td>
                    <td className="px-2 py-1 text-right font-mono">{p.speedLimit ? kmhToMph(p.speedLimit) : '-'}</td>
                    <td className="px-2 py-1 text-center">
                      {p.speeding ? '🚗' : p.harshBrake ? '🛑' : ''}
                    </td>
                  </tr>
                ))}
                {gpsPoints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No GPS points recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Route Report Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side="bottom" className="h-[90vh] p-0 overflow-hidden">
          <SheetHeader className="p-4 border-b bg-card">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detailed Route Report
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowReportSheet(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-4 h-[calc(90vh-60px)]">
            {sessionId && (
              <SessionRouteReport 
                telematicsId={sessionId} 
                onClose={() => setShowReportSheet(false)} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Save Route Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Save Route
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Route Name *</Label>
              <Input
                id="route-name"
                placeholder="e.g., Test Centre Route A"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={routeCategory} onValueChange={setRouteCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                  {selectedPupilName && (
                    <SelectItem value={`pupil_${selectedPupilName}`}>
                      {selectedPupilName}'s Routes
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="route-description">Description (optional)</Label>
              <Textarea
                id="route-description"
                placeholder="Add notes about this route..."
                value={routeDescription}
                onChange={(e) => setRouteDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Start:</span>
                <span>{gpsPoints[0]?.lat.toFixed(4)}, {gpsPoints[0]?.lng.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">End:</span>
                <span>{lastPoint?.lat.toFixed(4)}, {lastPoint?.lng.toFixed(4)}</span>
              </div>
              <div className="text-muted-foreground">
                Distance: {totalDistance.toFixed(1)} km • {gpsPoints.length} points
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveRoute} disabled={saving}>
              {saving ? 'Saving...' : 'Save Route'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
