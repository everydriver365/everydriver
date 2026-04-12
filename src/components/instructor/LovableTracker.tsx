import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Bookmark, MapPin, Route, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstructorAuth } from '@/context/InstructorAuthContext';
import { toast } from 'sonner';

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

interface SavedRoute {
  id: string;
  name: string;
  description: string | null;
  start_location: string | null;
  end_location: string | null;
  distance_km: number | null;
  created_at: string;
  route_type: string;
}

interface Pupil {
  id: string;
  name: string;
}

const currentMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="width: 18px; height: 18px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

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

export default function LovableTracker() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'tracking' | 'stopped'>('idle');
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [tripReportVisible, setTripReportVisible] = useState(false);
  
  // Save route dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Load pupils from database
  useEffect(() => {
    const loadPupils = async () => {
      if (!instructorId) return;
      const { data } = await supabase
        .from('pupils')
        .select('id, name')
        .eq('instructor_id', instructorId)
        .order('name');
      if (data) setPupils(data);
    };
    loadPupils();
  }, [instructorId]);

  // Load saved routes from database
  useEffect(() => {
    const loadSavedRoutes = async () => {
      if (!instructorId) return;
      const { data } = await supabase
        .from('saved_routes')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });
      if (data) setSavedRoutes(data);
    };
    loadSavedRoutes();
  }, [instructorId]);

  // Save route to database
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
      const distanceKm = calculateTotalDistance(gpsPoints);

      // Insert route
      const { data: routeData, error: routeError } = await supabase
        .from('saved_routes')
        .insert({
          instructor_id: instructorId,
          name: routeName.trim(),
          description: routeDescription.trim() || null,
          route_type: 'recorded',
          start_location: `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`,
          end_location: `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}`,
          distance_km: distanceKm
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
      
      // Refresh saved routes
      setSavedRoutes(prev => [routeData, ...prev]);
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  // Delete saved route
  const deleteRoute = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from('saved_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      setSavedRoutes(prev => prev.filter(r => r.id !== routeId));
      toast.success('Route deleted');
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    }
  };

  const simulateGPSUpdate = useCallback(() => {
    setGpsPoints(prev => {
      const last = prev[prev.length - 1];
      const lat = last ? last.lat + 0.0001 : 51.5074;
      const lng = last ? last.lng + 0.0001 : -0.1278;
      const speedKmh = Math.random() * 50 + 10;
      const roadName = 'Demo Road';
      const speedLimit = 30;
      const speeding = speedKmh > speedLimit;
      const harshBrake = Math.random() < 0.05;

      if (navigator.vibrate) {
        if (speeding) navigator.vibrate(200);
        if (harshBrake) navigator.vibrate(500);
      }

      const point: GPSPoint = { lat, lng, speedKmh, roadName, speedLimit, timestamp: Date.now(), harshBrake, speeding };
      setCurrentPos([lat, lng]);
      return [...prev, point];
    });
  }, []);

  const startTracking = () => {
    if (!selectedPupil) {
      toast.error('Please select a pupil first');
      return;
    }
    setPhase('tracking');
    setGpsPoints([]);
    setElapsedTime(0);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      simulateGPSUpdate();
    }, 1000);
  };

  const stopTracking = () => {
    setPhase('stopped');
    setTripReportVisible(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetSession = () => {
    setPhase('idle');
    setTripReportVisible(false);
    setGpsPoints([]);
    setCurrentPos(null);
    setElapsedTime(0);
  };

  const lastPoint = gpsPoints[gpsPoints.length - 1];
  const totalDistance = calculateTotalDistance(gpsPoints);

  if (!instructorId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to use the tracker</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Pupil: {selectedPupil ? pupils.find(p => p.id === selectedPupil)?.name : '-'}
          </p>
          <p className="text-sm text-muted-foreground">
            Route: {selectedRoute ? savedRoutes.find(r => r.id === selectedRoute)?.name : 'Free Drive'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className={`text-2xl font-bold ${lastPoint?.speeding ? 'text-destructive' : ''}`}>
            {lastPoint ? kmhToMph(lastPoint.speedKmh) : 0} <span className="text-sm font-normal">mph</span>
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

      {/* Pupil & Route selection overlay when idle */}
      {phase === 'idle' && (
        <div className="absolute inset-0 z-[1000] bg-background/95 flex flex-col items-center justify-center p-4 gap-2 overflow-hidden no-scrollbar">
          <p className="text-base font-semibold">Select Pupil</p>
          <Select value={selectedPupil || ''} onValueChange={setSelectedPupil}>
            <SelectTrigger className="w-56 h-9">
              <SelectValue placeholder="Select a pupil" />
            </SelectTrigger>
            <SelectContent>
              {pupils.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-base font-semibold mt-2">Route (Optional)</p>
          <Select value={selectedRoute || ''} onValueChange={setSelectedRoute}>
            <SelectTrigger className="w-56 h-9">
              <SelectValue placeholder="Free Drive" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Free Drive</SelectItem>
              {savedRoutes.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({r.distance_km ? (r.distance_km * 0.621371).toFixed(1) : '?'} mi)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Saved Routes List - compact */}
          {savedRoutes.length > 0 && (
            <div className="w-full max-w-[240px] mt-2">
              <p className="text-xs font-medium mb-1 flex items-center gap-1">
                <Route className="h-3 w-3" />
                Saved Routes
              </p>
              <div className="space-y-1 max-h-24 overflow-auto no-scrollbar">
                {savedRoutes.slice(0, 3).map(route => (
                  <div key={route.id} className="flex items-center justify-between p-1.5 bg-muted rounded text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{route.name}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {route.distance_km?.toFixed(1) || '?'} km
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteRoute(route.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {savedRoutes.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center">+{savedRoutes.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          <Button className="mt-2 h-10 px-6" onClick={startTracking} disabled={!selectedPupil}>
            Start Tracking
          </Button>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[51.5074, -0.1278]}
        zoom={15}
        className="flex-1 z-0"
        style={{ minHeight: '300px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {currentPos && <Marker position={currentPos} icon={currentMarkerIcon} />}
        {gpsPoints.length > 1 && (
          <Polyline positions={gpsPoints.map(p => [p.lat, p.lng] as [number, number])} color="blue" />
        )}
        <MapUpdater position={currentPos} />
      </MapContainer>

      {/* Trip report */}
      {tripReportVisible && (
        <div className="absolute inset-0 z-[1000] bg-background/95 flex flex-col p-6 overflow-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Trip Report</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetSession}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="ml-2 font-medium">{totalDistance.toFixed(1)} km</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GPS Points:</span>
                  <span className="ml-2 font-medium">{gpsPoints.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Harsh Brakes:</span>
                  <span className="ml-2 font-medium">{gpsPoints.filter(p => p.harshBrake).length}</span>
                </div>
              </div>

              {gpsPoints.length > 0 && (
                <div className="bg-muted/50 rounded-2xl p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="truncate">{gpsPoints[0].lat.toFixed(4)}, {gpsPoints[0].lng.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">End:</span>
                    <span className="truncate">{lastPoint?.lat.toFixed(4)}, {lastPoint?.lng.toFixed(4)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetSession}>
                  New Session
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setShowSaveDialog(true)}>
                  <Bookmark className="h-4 w-4" />
                  Save Route
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              <Label htmlFor="route-description">Description (optional)</Label>
              <Textarea
                id="route-description"
                placeholder="Add notes about this route..."
                value={routeDescription}
                onChange={(e) => setRouteDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-muted/50 rounded-2xl p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Start:</span>
                <span className="truncate">{gpsPoints[0]?.lat.toFixed(4)}, {gpsPoints[0]?.lng.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">End:</span>
                <span className="truncate">{lastPoint?.lat.toFixed(4)}, {lastPoint?.lng.toFixed(4)}</span>
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
