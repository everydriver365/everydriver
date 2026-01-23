import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, Square, Navigation, Gauge, AlertTriangle, 
  MapPin, Clock, Route, Loader2, CheckCircle2,
  Vibrate, Volume2, ChevronDown, ChevronUp
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useSimpleGPSTracker } from '@/hooks/useSimpleGPSTracker';
import { useHarshBrakingDetector } from '@/hooks/useHarshBrakingDetector';
import { useDrivingBehavior } from '@/hooks/useDrivingBehavior';
import { useLocalTripScore, TripStats } from '@/hooks/useLocalTripScore';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';
import { cn } from '@/lib/utils';

// Map auto-pan component
const MapUpdater = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

// Current position marker
const currentMarkerIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface SimpleTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  onSessionEnd?: (telematicsId: string) => void;
}

type TrackerPhase = 'idle' | 'starting' | 'tracking' | 'stopping' | 'complete';

export const SimpleTracker: React.FC<SimpleTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
  onSessionEnd,
}) => {
  const [phase, setPhase] = useState<TrackerPhase>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const gpsTracker = useSimpleGPSTracker({
    onSpeedingDetected: (speed, limit, location) => {
      drivingBehavior.checkSpeeding(speed, limit, location, gpsTracker.speedLimitInfo.roadName);
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

  const drivingBehavior = useDrivingBehavior({
    onEvent: (event) => {
      console.log('[Tracker] Driving event:', event.type);
    },
  });

  const tripScore = useLocalTripScore();

  const telematicsSession = useTelematicsSession(instructorId, {
    onSessionStart: (session) => {
      console.log('[Tracker] Session started:', session.id);
    },
  });

  // Update location for harsh braking detector
  useEffect(() => {
    if (gpsTracker.currentPosition) {
      harshBraking.updateLocation(
        gpsTracker.currentPosition.latitude,
        gpsTracker.currentPosition.longitude
      );
    }
  }, [gpsTracker.currentPosition, harshBraking]);

  // Elapsed time timer
  useEffect(() => {
    if (phase === 'tracking') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start tracking
  const handleStart = useCallback(async () => {
    setPhase('starting');
    setError(null);

    try {
      // Create telematics session
      const session = await telematicsSession.createSession(lessonId, pupilId);
      if (!session) {
        throw new Error('Failed to create session');
      }

      // Start GPS tracking
      const gpsStarted = await gpsTracker.startTracking(session.id);
      if (!gpsStarted) {
        throw new Error(gpsTracker.state.message || 'GPS failed to start');
      }

      // Start harsh braking detection (optional - don't fail if unavailable)
      await harshBraking.startDetection();

      // Start behavior tracking
      drivingBehavior.startTracking(session.id);

      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setPhase('tracking');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(message);
      setPhase('idle');
      
      // Cleanup
      telematicsSession.cancelSession();
    }
  }, [telematicsSession, lessonId, pupilId, gpsTracker, harshBraking, drivingBehavior]);

  // Stop tracking
  const handleStop = useCallback(async () => {
    setPhase('stopping');

    try {
      // Stop all trackers
      const gpsResult = gpsTracker.stopTracking();
      harshBraking.stopDetection();
      const behaviorStats = await drivingBehavior.stopTracking();

      // Calculate local score
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
        
        // End telematics session
        await telematicsSession.endSession(
          gpsResult.totalDistance,
          gpsResult.maxSpeed,
          undefined
        );

        onSessionEnd?.(sessionId);
      }

      setPhase('complete');
    } catch (err) {
      console.error('[Tracker] Stop error:', err);
      setPhase('complete');
    }
  }, [gpsTracker, harshBraking, drivingBehavior, elapsedTime, telematicsSession, tripScore, onSessionEnd]);

  // Reset to start new trip
  const handleReset = useCallback(() => {
    setPhase('idle');
    setError(null);
    setElapsedTime(0);
  }, []);

  // Current position for map
  const mapPosition: [number, number] | null = gpsTracker.currentPosition
    ? [gpsTracker.currentPosition.latitude, gpsTracker.currentPosition.longitude]
    : null;

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card>
        <CardContent className="p-4">
          {/* Phase: Idle */}
          {phase === 'idle' && (
            <div className="text-center space-y-4">
              <div className="py-8">
                <Navigation className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Track</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Keep the app open during your lesson
                </p>
                <p className="text-xs text-muted-foreground">
                  GPS + motion sensors will track driving behavior
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                size="lg" 
                className="w-full"
                onClick={handleStart}
              >
                <Play className="h-5 w-5 mr-2" />
                Start Tracking
              </Button>
            </div>
          )}

          {/* Phase: Starting */}
          {phase === 'starting' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                {gpsTracker.state.message}
              </p>
            </div>
          )}

          {/* Phase: Tracking */}
          {phase === 'tracking' && (
            <div className="space-y-4">
              {/* Speed Display with Limit */}
              <div className="flex items-center justify-between">
                {/* Current Speed */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      {Math.round((gpsTracker.currentPosition?.speedKmh || 0) * 0.621371)}
                    </span>
                    <span className="text-lg text-muted-foreground">mph</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {gpsTracker.speedLimitInfo.roadName || 'Detecting road...'}
                  </p>
                </div>

                {/* Speed Limit Circle */}
                <div className={cn(
                  "w-20 h-20 rounded-full border-[6px] flex flex-col items-center justify-center",
                  gpsTracker.speedLimitInfo.isExceeding 
                    ? "border-destructive bg-destructive/10"
                    : "border-red-500 bg-white"
                )}>
                  {gpsTracker.speedLimitInfo.speedLimit ? (
                    <>
                      <span className={cn(
                        "text-2xl font-bold text-black",
                        gpsTracker.speedLimitInfo.isExceeding && "text-destructive"
                      )}>
                        {Math.round(gpsTracker.speedLimitInfo.speedLimit * 0.621371)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">mph</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </div>
              </div>

              {/* Speeding Alert */}
              {gpsTracker.speedLimitInfo.isExceeding && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {Math.round(gpsTracker.speedLimitInfo.excessKmh * 0.621371)} mph over limit!
                  </AlertDescription>
                </Alert>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <Route className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {(gpsTracker.totalDistance / 1609.34).toFixed(1)} mi
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <Gauge className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {Math.round(gpsTracker.maxSpeed * 0.621371)} mph
                  </p>
                </div>
              </div>

              {/* Event Badges */}
              {drivingBehavior.events.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {drivingBehavior.stats.harshBrakeCount > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      {drivingBehavior.stats.harshBrakeCount} Harsh Brakes
                    </Badge>
                  )}
                  {drivingBehavior.stats.speedingEventsCount > 0 && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      {drivingBehavior.stats.speedingEventsCount} Speeding
                    </Badge>
                  )}
                </div>
              )}

              {/* Mini Map */}
              {mapPosition && (
                <div className="h-40 rounded-lg overflow-hidden border">
                  <MapContainer
                    center={mapPosition}
                    zoom={16}
                    className="h-full w-full"
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapUpdater position={mapPosition} />
                    {gpsTracker.routePoints.length > 1 && (
                      <Polyline
                        positions={gpsTracker.routePoints}
                        color="#3b82f6"
                        weight={4}
                      />
                    )}
                    <Marker position={mapPosition} icon={currentMarkerIcon} />
                  </MapContainer>
                </div>
              )}

              {/* Stop Button */}
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full"
                onClick={handleStop}
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Tracking
              </Button>

              {/* Foreground Warning */}
              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Keep app open and screen on for accurate tracking
              </p>
            </div>
          )}

          {/* Phase: Stopping */}
          {phase === 'stopping' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Processing trip data...
              </p>
            </div>
          )}

          {/* Phase: Complete */}
          {phase === 'complete' && tripScore.score && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">Trip Complete</h3>
              </div>

              {/* Score Display */}
              <div className="text-center py-4">
                <div className={cn(
                  "inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold",
                  tripScore.score.grade === 'A' && "bg-green-100 text-green-700",
                  tripScore.score.grade === 'B' && "bg-blue-100 text-blue-700",
                  tripScore.score.grade === 'C' && "bg-amber-100 text-amber-700",
                  tripScore.score.grade === 'D' && "bg-orange-100 text-orange-700",
                  tripScore.score.grade === 'F' && "bg-red-100 text-red-700",
                )}>
                  {tripScore.score.grade}
                </div>
                <p className="mt-2 text-2xl font-bold">{tripScore.score.finalScore}/100</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tripScore.getScoreDescription(tripScore.score.grade)}
                </p>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {(gpsTracker.totalDistance / 1609.34).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">miles travelled</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
                  <p className="text-xs text-muted-foreground">duration</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {drivingBehavior.stats.harshBrakeCount}
                  </p>
                  <p className="text-xs text-muted-foreground">harsh brakes</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">
                    {drivingBehavior.stats.speedingEventsCount}
                  </p>
                  <p className="text-xs text-muted-foreground">speeding events</p>
                </div>
              </div>

              {/* Score Breakdown (Expandable) */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  Score Breakdown
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showDetails && (
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Score</span>
                      <span>{tripScore.score.baseScore}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Harsh Braking Penalty</span>
                      <span>-{tripScore.score.harshBrakingPenalty}</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                      <span>Speeding Penalty</span>
                      <span>-{tripScore.score.speedingPenalty}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Max Speed Penalty</span>
                      <span>-{tripScore.score.maxSpeedPenalty}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Final Score</span>
                      <span>{tripScore.score.finalScore}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* New Trip Button */}
              <Button 
                className="w-full" 
                onClick={handleReset}
              >
                <Play className="h-4 w-4 mr-2" />
                Start New Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && phase === 'tracking' && (
        <Card>
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-xs">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-xs space-y-1">
            <p>GPS Points: {gpsTracker.pointCount}</p>
            <p>Accuracy: {gpsTracker.currentPosition?.accuracy?.toFixed(0)}m</p>
            <p>Harsh Braking: {harshBraking.hasPermission ? 'Active' : 'Off'}</p>
            <p>Decel: {harshBraking.currentDeceleration.toFixed(2)} m/s²</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
