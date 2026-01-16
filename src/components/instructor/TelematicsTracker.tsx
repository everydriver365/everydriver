import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  Navigation, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  TrendingUp,
  Maximize2,
  X,
  Wifi,
  WifiOff,
  Smartphone,
  Activity
} from 'lucide-react';
import { useTelematics } from '@/hooks/useTelematics';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DamoovScoresDisplay from './DamoovScoresDisplay';
import PupilGamificationStats from './PupilGamificationStats';

interface TelematicsTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  compact?: boolean;
}

// Component to auto-pan map to latest position
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

const TelematicsTracker: React.FC<TelematicsTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
  compact = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const {
    isTracking,
    currentSpeed,
    totalDistance,
    drivingEvents,
    gpsPoints,
    error,
    gpsQuality,
    motionData,
    hasMotionPermission,
    isScreenAwake,
    damoovScores,
    damoovProcessing,
    coinsEarned,
    startTracking,
    stopTracking
  } = useTelematics(instructorId);

  // Show results when processing completes
  useEffect(() => {
    if (damoovScores && !damoovProcessing) {
      setShowResults(true);
    }
  }, [damoovScores, damoovProcessing]);

  // Reset results when starting new tracking
  const handleStartTracking = () => {
    setShowResults(false);
    startTracking(lessonId, pupilId);
  };

  const goodEvents = drivingEvents.filter(e => 
    e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration' || e.event_type === 'smooth_cornering'
  ).length;
  
  const badEvents = drivingEvents.filter(e => 
    e.event_type === 'harsh_brake' || e.event_type === 'harsh_acceleration' || 
    e.event_type === 'speeding' || e.event_type === 'sharp_turn' || e.event_type === 'hard_impact'
  ).length;

  // Enhanced scoring: weight events and consider distance
  const distanceKm = totalDistance > 0 ? totalDistance : 1;
  const eventsPerKm = (badEvents / distanceKm);
  const baseScore = 100 - (badEvents * 8) + (goodEvents * 3);
  const consistencyBonus = eventsPerKm < 0.5 ? 5 : eventsPerKm < 1 ? 2 : 0;
  const drivingScore = Math.max(0, Math.min(100, baseScore + consistencyBonus));

  // Convert GPS points to route coordinates
  const routeCoordinates: [number, number][] = gpsPoints.map(p => [p.latitude, p.longitude]);
  const currentPosition: [number, number] | null = gpsPoints.length > 0 
    ? [gpsPoints[gpsPoints.length - 1].latitude, gpsPoints[gpsPoints.length - 1].longitude]
    : null;

  // Default center (UK)
  const defaultCenter: [number, number] = [51.5074, -0.1278];

  // GPS Quality indicator
  const getGPSStatusColor = () => {
    switch (gpsQuality.status) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-amber-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-red-500';
    }
  };

  const getGPSIcon = () => {
    if (gpsQuality.status === 'unavailable') return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isTracking ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
                <Navigation className={`h-4 w-4 ${isTracking ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isTracking ? 'Tracking Active' : 'GPS Tracking'}
                </p>
                {isTracking && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {currentSpeed.toFixed(0)} km/h · {totalDistance.toFixed(1)} km
                    </p>
                    <span className={`text-xs ${getGPSStatusColor()}`}>{gpsQuality.status}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={() => isTracking ? stopTracking() : handleStartTracking()}
            >
              {isTracking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            GPS Telematics
          </CardTitle>
          <Button
            size="sm"
            variant={isTracking ? 'destructive' : 'default'}
            onClick={() => isTracking ? stopTracking() : handleStartTracking()}
          >
            {isTracking ? (
              <>
                <Square className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Stop</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Start</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* GPS & Motion Quality Indicators */}
        {isTracking && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {/* GPS Status */}
              <div className={`flex items-center gap-1 ${getGPSStatusColor()}`}>
                {getGPSIcon()}
                <span className="text-xs font-medium">
                  GPS: {gpsQuality.status}
                  {gpsQuality.accuracy_m && ` (±${gpsQuality.accuracy_m.toFixed(0)}m)`}
                </span>
              </div>
              
              {/* Motion Sensor Status */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">
                  {hasMotionPermission === false 
                    ? 'Motion: Denied' 
                    : hasMotionPermission 
                      ? `G: ${motionData.gForce.toFixed(2)}` 
                      : 'Motion: N/A'}
                </span>
              </div>
            </div>
            
            {/* Real-time G-force indicator */}
            {hasMotionPermission && motionData.gForce > 0.1 && (
              <Badge variant={motionData.gForce > 0.5 ? 'destructive' : motionData.gForce > 0.3 ? 'secondary' : 'outline'}>
                <Activity className="h-3 w-3 mr-1" />
                {motionData.gForce.toFixed(2)}g
              </Badge>
            )}
          </div>
        )}

        {/* GPS Quality Warning */}
        {isTracking && gpsQuality.status === 'poor' && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {gpsQuality.message}
          </div>
        )}

        {/* Live Map */}
        {isTracking && (
          <>
            {/* Fullscreen Map Overlay */}
            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-background">
                <MapContainer
                  center={currentPosition || defaultCenter}
                  zoom={16}
                  className="h-full w-full"
                  style={{ zIndex: 0 }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {routeCoordinates.length >= 2 && (
                    <Polyline
                      positions={routeCoordinates}
                      pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.9 }}
                    />
                  )}
                  
                  {currentPosition && (
                    <CircleMarker
                      center={currentPosition}
                      radius={10}
                      pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#ffffff', weight: 3 }}
                    />
                  )}
                  
                  {routeCoordinates.length > 0 && (
                    <CircleMarker
                      center={routeCoordinates[0]}
                      radius={8}
                      pathOptions={{ fillColor: '#f59e0b', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                    />
                  )}
                  
                  <MapUpdater position={currentPosition} />
                </MapContainer>
                
                {/* Fullscreen controls overlay */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                  <div className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium text-sm">Live Route</span>
                    <span className="text-muted-foreground text-sm">|</span>
                    <span className="text-sm">{currentSpeed.toFixed(0)} km/h</span>
                    <span className="text-muted-foreground text-sm">|</span>
                    <span className="text-sm">{totalDistance.toFixed(2)} km</span>
                    <span className="text-muted-foreground text-sm">|</span>
                    <span className={`text-sm ${getGPSStatusColor()}`}>{gpsQuality.status}</span>
                    {hasMotionPermission && motionData.gForce > 0.15 && (
                      <>
                        <span className="text-muted-foreground text-sm">|</span>
                        <span className="text-sm">{motionData.gForce.toFixed(2)}g</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 shadow-lg"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Map */}
            <div className="relative h-48 rounded-lg overflow-hidden border">
              <MapContainer
                center={currentPosition || defaultCenter}
                zoom={15}
                className="h-full w-full"
                style={{ zIndex: 0 }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {routeCoordinates.length >= 2 && (
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
                  />
                )}
                
                {currentPosition && (
                  <CircleMarker
                    center={currentPosition}
                    radius={8}
                    pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#ffffff', weight: 3 }}
                  />
                )}
                
                {routeCoordinates.length > 0 && (
                  <CircleMarker
                    center={routeCoordinates[0]}
                    radius={6}
                    pathOptions={{ fillColor: '#f59e0b', fillOpacity: 1, color: '#ffffff', weight: 2 }}
                  />
                )}
                
                <MapUpdater position={currentPosition} />
              </MapContainer>
              
              {/* Map overlay controls */}
              <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live Route
              </div>
              
              {/* Fullscreen toggle button */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 bg-background/90 hover:bg-background"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Waiting for GPS message when not tracking */}
        {!isTracking && (
          <div className="h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start tracking to see live map</p>
              <p className="text-xs mt-1">Uses GPS + Motion sensors for best results</p>
            </div>
          </div>
        )}

        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Gauge className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{currentSpeed.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">km/h</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalDistance.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">km traveled</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{drivingScore}</p>
            <p className="text-xs text-muted-foreground">score</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="flex justify-center gap-1 mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{goodEvents}/{badEvents}</p>
            <p className="text-xs text-muted-foreground">events</p>
          </div>
        </div>

        {/* Driving Score Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Driving Score</span>
            <span className={drivingScore >= 80 ? 'text-green-500' : drivingScore >= 50 ? 'text-amber-500' : 'text-red-500'}>
              {drivingScore >= 80 ? 'Excellent' : drivingScore >= 50 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
          <Progress value={drivingScore} className="h-2" />
        </div>

        {/* Recent Events */}
        {drivingEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Events</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {drivingEvents.slice(-5).reverse().map((event, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                  {event.event_type === 'smooth_stop' || event.event_type === 'good_acceleration' || event.event_type === 'smooth_cornering' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="flex-1">{event.event_type.replace(/_/g, ' ')}</span>
                  {event.g_force && (
                    <span className="text-xs text-muted-foreground">{event.g_force.toFixed(2)}g</span>
                  )}
                  {event.sensor_source === 'motion' && (
                    <Smartphone className="h-3 w-3 text-muted-foreground" />
                  )}
                  <Badge variant={event.severity === 'high' ? 'destructive' : event.severity === 'medium' ? 'secondary' : 'outline'} className="text-xs">
                    {event.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isTracking && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              GPS tracking active
              {hasMotionPermission && <span className="text-muted-foreground">+ Motion</span>}
            </div>
            {isScreenAwake && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                Screen stays on
              </span>
            )}
          </div>
        )}

        {/* Damoov Scores Display - shown when processing or after completion */}
        {(damoovProcessing || showResults) && (
          <DamoovScoresDisplay
            scores={damoovScores}
            coinsEarned={coinsEarned}
            isProcessing={damoovProcessing}
          />
        )}

        {/* Pupil Gamification Stats - shown after scores are received */}
        {showResults && pupilId && (
          <PupilGamificationStats 
            pupilId={pupilId} 
            refreshTrigger={coinsEarned}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TelematicsTracker;
