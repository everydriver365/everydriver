import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square, 
  FastForward,
  RotateCcw,
  Route,
  Gauge,
  MapPin
} from 'lucide-react';
import { useRouteSimulation } from '@/hooks/useRouteSimulation';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getTomTomTileUrl, getTomTomAttribution } from '@/lib/tomtomConfig';

interface SavedRoute {
  id: string;
  name: string;
  description: string | null;
  distance_km: number | null;
  route_type: string;
}

interface RouteSimulatorProps {
  instructorId: string;
  onClose?: () => void;
}

// Component to auto-pan map
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

const RouteSimulator: React.FC<RouteSimulatorProps> = ({ instructorId, onClose }) => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  const {
    simulationState,
    simulatedPoints,
    currentSpeed,
    totalDistance,
    error,
    startSimulation,
    stopSimulation,
    togglePause,
    setPlaybackSpeed: updateSpeed,
    isPaused
  } = useRouteSimulation(instructorId);

  // Fetch available routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_routes')
          .select('id, name, description, distance_km, route_type')
          .eq('instructor_id', instructorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRoutes(data || []);
      } catch (err) {
        console.error('Error fetching routes:', err);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, [instructorId]);

  const handleStart = () => {
    if (selectedRouteId) {
      startSimulation(selectedRouteId, playbackSpeed);
    }
  };

  const handleSpeedChange = (speed: string) => {
    const newSpeed = parseFloat(speed);
    setPlaybackSpeed(newSpeed);
    if (simulationState.isSimulating) {
      updateSpeed(newSpeed);
    }
  };

  const handleReset = () => {
    stopSimulation();
    setSelectedRouteId('');
  };

  // Map coordinates
  const routeCoordinates: [number, number][] = simulatedPoints.map(p => [p.latitude, p.longitude]);
  const currentPosition: [number, number] | null = simulatedPoints.length > 0 
    ? [simulatedPoints[simulatedPoints.length - 1].latitude, simulatedPoints[simulatedPoints.length - 1].longitude]
    : null;
  const defaultCenter: [number, number] = [51.5074, -0.1278];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-5 w-5 text-primary" />
            Route Simulator
          </CardTitle>
          {simulationState.isSimulating && (
            <Badge variant="secondary" className="animate-pulse">
              Simulating
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Route Selection */}
        {!simulationState.isSimulating && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Route</label>
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRoutes ? "Loading routes..." : "Choose a saved route"} />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      <div className="flex items-center gap-2">
                        <span>{route.name}</span>
                        {route.distance_km && (
                          <span className="text-xs text-muted-foreground">
                            ({route.distance_km.toFixed(1)} km)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Playback Speed</label>
              <Select value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x (Slow)</SelectItem>
                  <SelectItem value="1">1x (Realtime)</SelectItem>
                  <SelectItem value="2">2x (Fast)</SelectItem>
                  <SelectItem value="5">5x (Very Fast)</SelectItem>
                  <SelectItem value="10">10x (Ultra Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleStart} 
              disabled={!selectedRouteId}
              className="w-full gap-2"
            >
              <Play className="h-4 w-4" />
              Start Simulation
            </Button>
          </div>
        )}

        {/* Simulation Controls */}
        {simulationState.isSimulating && (
          <>
            {/* Map */}
            <div className="relative h-48 rounded-lg overflow-hidden border">
              <MapContainer
                center={currentPosition || defaultCenter}
                zoom={15}
                className="h-full w-full"
                style={{ zIndex: 0 }}
                zoomControl={false}
              >
                <TileLayer
                  attribution={getTomTomAttribution()}
                  url={getTomTomTileUrl()}
                />
                
                {routeCoordinates.length >= 2 && (
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }}
                  />
                )}
                
                {currentPosition && (
                  <CircleMarker
                    center={currentPosition}
                    radius={8}
                    pathOptions={{ fillColor: '#8b5cf6', fillOpacity: 1, color: '#ffffff', weight: 3 }}
                  />
                )}
                
                {routeCoordinates.length > 0 && (
                  <CircleMarker
                    center={routeCoordinates[0]}
                    radius={6}
                    pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                  />
                )}
                
                <MapUpdater position={currentPosition} />
              </MapContainer>
              
              <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                Simulation
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{simulationState.currentPointIndex} / {simulationState.totalPoints} points</span>
              </div>
              <Progress value={simulationState.progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                <Gauge className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-2xl font-bold tabular-nums">{currentSpeed.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">km/h</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <MapPin className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold tabular-nums">{totalDistance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">km traveled</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePause}
                className="flex-1 gap-1"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Select value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
                <SelectTrigger className="w-24">
                  <FastForward className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="destructive" 
                size="sm"
                onClick={stopSimulation}
                className="gap-1"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </div>

            {/* Speed indicator */}
            <div className="text-center text-xs text-muted-foreground">
              Playback: {playbackSpeed}x speed
            </div>
          </>
        )}

        {/* Reset after completion */}
        {!simulationState.isSimulating && simulationState.progress === 100 && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Simulation complete!</p>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start New Simulation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteSimulator;
