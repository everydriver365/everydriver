import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

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

interface SavedTrip {
  name: string;
  pupilId: string;
  routeName: string;
  gpsPoints: GPSPoint[];
  date: string;
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

export default function LovableTracker() {
  const [pupils, setPupils] = useState<{ id: string; name: string }[]>([]);
  const [testRoutes] = useState<{ id: string; name: string }[]>([
    { id: '1', name: 'Route 1' },
    { id: '2', name: 'Route 2' },
  ]);
  const [selectedPupil, setSelectedPupil] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'tracking' | 'stopped'>('idle');
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [tripReportVisible, setTripReportVisible] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [tripName, setTripName] = useState('');

  const loadSavedTrips = () => {
    const trips = localStorage.getItem('lovableTrips');
    if (trips) setSavedTrips(JSON.parse(trips));
  };

  useEffect(() => {
    setPupils([{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]);
    loadSavedTrips();
  }, []);

  const saveTrip = (name: string) => {
    if (!selectedPupil || !selectedRoute) return;
    const trip: SavedTrip = {
      name,
      pupilId: selectedPupil,
      routeName: selectedRoute,
      gpsPoints,
      date: new Date().toISOString(),
    };
    const updated = [...savedTrips, trip];
    setSavedTrips(updated);
    localStorage.setItem('lovableTrips', JSON.stringify(updated));
    alert('Trip saved!');
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
    if (!selectedPupil || !selectedRoute) {
      alert("Select a pupil and test route first");
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

  const lastPoint = gpsPoints[gpsPoints.length - 1];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Pupil: {selectedPupil ? pupils.find(p => p.id === selectedPupil)?.name : '-'}
          </p>
          <p className="text-sm text-muted-foreground">
            Route: {selectedRoute ? testRoutes.find(r => r.id === selectedRoute)?.name : '-'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className={`text-2xl font-bold ${lastPoint?.speeding ? 'text-destructive' : ''}`}>
            {lastPoint ? kmhToMph(lastPoint.speedKmh) : 0} <span className="text-sm font-normal">mph</span>
          </p>
          <Button
            variant={phase === 'tracking' ? 'destructive' : 'default'}
            onClick={phase === 'tracking' ? stopTracking : startTracking}
          >
            {phase === 'tracking' ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      {/* Pupil & Route selection overlay when idle */}
      {phase === 'idle' && (
        <div className="absolute inset-0 z-[1000] bg-background/95 flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-lg font-semibold">Select Pupil</p>
          <Select value={selectedPupil || ''} onValueChange={setSelectedPupil}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a pupil" />
            </SelectTrigger>
            <SelectContent>
              {pupils.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-lg font-semibold mt-4">Select Test Route</p>
          <Select value={selectedRoute || ''} onValueChange={setSelectedRoute}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {testRoutes.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="mt-4" onClick={startTracking}>Start Tracking</Button>
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
              <Button variant="ghost" size="icon" onClick={() => setTripReportVisible(false)}>
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
                  <span className="text-muted-foreground">Points:</span>
                  <span className="ml-2 font-medium">{gpsPoints.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Save Trip</p>
                <Input
                  placeholder="Trip name"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
                <Select value={selectedRoute || ''} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {testRoutes.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" onClick={() => saveTrip(tripName)}>
                  Save Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
