import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Minimize2,
  X,
  Wifi,
  WifiOff,
  Smartphone,
  Activity,
  Timer,
  Shield,
  Volume2,
  VolumeX,
  Vibrate
} from 'lucide-react';
import { useTelematics } from '@/hooks/useTelematics';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useVoiceAnnouncements } from '@/hooks/useVoiceAnnouncements';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DamoovScoresDisplay from './DamoovScoresDisplay';
import PupilGamificationStats from './PupilGamificationStats';
import SpeedLimitRoundel from './SpeedLimitRoundel';
import { getTomTomTileUrl, getTomTomAttribution } from '@/lib/tomtomConfig';
import { motion, AnimatePresence } from 'framer-motion';

interface TelematicsTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  compact?: boolean;
  onSessionEnd?: (telematicsId: string) => void;
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
  compact = false,
  onSessionEnd
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    distance: number;
    duration: number;
    eventCount: number;
    score: number;
  } | null>(null);
  
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
    damoovStatus,
    coinsEarned,
    currentSession,
    trackingError,
    speedLimitData,
    startTracking,
    stopTracking
  } = useTelematics(instructorId);
  
  // Feedback settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  
  // Feedback hooks
  const haptic = useHapticFeedback();
  const voice = useVoiceAnnouncements({ enabled: voiceEnabled });
  
  // Track last announced event to avoid duplicates
  const lastAnnouncedEventRef = useRef<number>(0);
  
  // Track session start time locally
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Auto-enter fullscreen when tracking starts
  useEffect(() => {
    if (isTracking && !isFullscreen) {
      setIsFullscreen(true);
    }
  }, [isTracking]);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - trackingStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, trackingStartTime]);

  // Show results when processing completes
  useEffect(() => {
    if (damoovScores && !damoovProcessing) {
      setShowResults(true);
    }
  }, [damoovScores, damoovProcessing]);

  // Announce new driving events with voice and haptic feedback
  useEffect(() => {
    if (drivingEvents.length > lastAnnouncedEventRef.current) {
      // Get new events
      const newEvents = drivingEvents.slice(lastAnnouncedEventRef.current);
      
      newEvents.forEach(event => {
        // Haptic feedback
        if (hapticEnabled) {
          haptic.triggerEvent(event.event_type, event.severity);
        }
        
        // Voice announcement
        if (voiceEnabled) {
          voice.announceEvent(event.event_type, event.severity);
        }
      });
      
      lastAnnouncedEventRef.current = drivingEvents.length;
    }
  }, [drivingEvents, hapticEnabled, voiceEnabled, haptic, voice]);

  // Speed limit warning feedback
  const wasExceedingRef = useRef(false);
  useEffect(() => {
    if (speedLimitData.isExceeding && !wasExceedingRef.current) {
      // Just started exceeding - trigger feedback
      if (hapticEnabled) {
        haptic.triggerEvent('speeding', 'medium');
      }
      if (voiceEnabled) {
        voice.announceEvent('speeding', 'medium');
      }
    }
    wasExceedingRef.current = speedLimitData.isExceeding;
  }, [speedLimitData.isExceeding, hapticEnabled, voiceEnabled, haptic, voice]);

  const goodEventsCount = drivingEvents.filter(e => 
    e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration' || e.event_type === 'smooth_cornering'
  ).length;
  
  const badEventsCount = drivingEvents.filter(e => 
    e.event_type === 'harsh_brake' || e.event_type === 'harsh_acceleration' || 
    e.event_type === 'speeding' || e.event_type === 'sharp_turn' || e.event_type === 'hard_impact'
  ).length;

  // Enhanced scoring: weight events and consider distance
  const distanceKm = totalDistance > 0 ? totalDistance : 1;
  const eventsPerKm = (badEventsCount / distanceKm);
  const baseScore = 100 - (badEventsCount * 8) + (goodEventsCount * 3);
  const consistencyBonus = eventsPerKm < 0.5 ? 5 : eventsPerKm < 1 ? 2 : 0;
  const drivingScore = Math.max(0, Math.min(100, baseScore + consistencyBonus));

  // Reset results when starting new tracking
  const handleStartTracking = () => {
    console.log('[TelematicsTracker] handleStartTracking called', { lessonId, pupilId, instructorId });
    setShowResults(false);
    setSessionEnded(false);
    setSessionSummary(null);
    setElapsedTime(0);
    lastAnnouncedEventRef.current = 0;
    setTrackingStartTime(new Date());
    
    // Feedback on start
    if (hapticEnabled) haptic.triggerStart();
    if (voiceEnabled) voice.announceStart();
    
    console.log('[TelematicsTracker] Calling startTracking...');
    startTracking(lessonId, pupilId);
  };

  // Format elapsed time as mm:ss
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle stop tracking and show session summary
  const handleStopTracking = async () => {
    const startTime = trackingStartTime;
    const finalDistance = totalDistance;
    const finalEvents = drivingEvents.length;
    const finalScore = drivingScore;
    
    // Exit fullscreen before stopping
    setIsFullscreen(false);
    
    // Feedback on stop
    if (hapticEnabled) haptic.triggerStop();
    if (voiceEnabled) voice.announceStop(finalScore);
    
    await stopTracking();
    
    // Calculate duration
    const durationMs = startTime ? Date.now() - startTime.getTime() : 0;
    const durationMin = Math.round(durationMs / 60000);
    
    setSessionSummary({
      distance: finalDistance,
      duration: durationMin,
      eventCount: finalEvents,
      score: finalScore
    });
    setSessionEnded(true);
    setElapsedTime(0);
    
    // Notify parent component with session ID
    if (currentSession?.id && onSessionEnd) {
      onSessionEnd(currentSession.id);
    }
  };

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
                      {Math.round(currentSpeed * 0.621371)} mph · {(totalDistance * 0.621371).toFixed(1)} mi
                    </p>
                    <span className={`text-xs ${getGPSStatusColor()}`}>{gpsQuality.status}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={() => isTracking ? handleStopTracking() : handleStartTracking()}
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
            onClick={() => isTracking ? handleStopTracking() : handleStartTracking()}
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
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm space-y-1">
            <p>{error}</p>
            {trackingError?.details && (
              <p className="text-xs opacity-80">{trackingError.details}</p>
            )}
            {trackingError?.type === 'permission' && (
              <p className="text-xs mt-2">💡 Tip: Check your browser settings or try a different browser</p>
            )}
            {trackingError?.type === 'database' && (
              <p className="text-xs mt-2">💡 Tip: Check your internet connection and try again</p>
            )}
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
            {/* Fullscreen Tracking Dashboard */}
            <AnimatePresence>
              {isFullscreen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
                >
                  {/* Top Status Bar */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b z-20"
                  >
                    <div className="flex items-center gap-4">
                      {/* Live indicator */}
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-red-500">LIVE</span>
                      </div>
                      
                      {/* Timer */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span className="text-sm font-mono tabular-nums">{formatElapsedTime(elapsedTime)}</span>
                      </div>
                      
                      {/* GPS Status */}
                      <div className={`flex items-center gap-1.5 ${getGPSStatusColor()}`}>
                        {getGPSIcon()}
                        <span className="text-xs font-medium">
                          {gpsQuality.status}
                          {gpsQuality.accuracy_m && ` ±${gpsQuality.accuracy_m.toFixed(0)}m`}
                        </span>
                      </div>
                      
                      {/* Motion Sensor */}
                      {hasMotionPermission && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          <span className="text-xs font-mono">{motionData.gForce.toFixed(2)}g</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Exit Fullscreen Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => setIsFullscreen(false)}
                    >
                      <Minimize2 className="h-5 w-5" />
                    </Button>
                  </motion.div>

                  {/* Speed Limit Warning Banner */}
                  <AnimatePresence>
                    {speedLimitData.isExceeding && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 z-20"
                      >
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">
                          SPEED LIMIT {speedLimitData.speedLimit ? Math.round(speedLimitData.speedLimit * 0.621371) : '--'} mph — Current: {Math.round(currentSpeed * 0.621371)} mph
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Map Area */}
                  <div className="flex-1 relative">
                    <MapContainer
                      center={currentPosition || defaultCenter}
                      zoom={16}
                      className="h-full w-full"
                      style={{ zIndex: 0 }}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution={getTomTomAttribution()}
                        url={getTomTomTileUrl()}
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
                          radius={12}
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
                    
                    {/* Screen Wake Lock indicator */}
                    {isScreenAwake && (
                      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                        <Shield className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-muted-foreground">Screen awake</span>
                      </div>
                    )}
                    
                    {/* GPS Points Counter */}
                    <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="tabular-nums">{gpsPoints.length} pts</span>
                    </div>
                  </div>

                  {/* Bottom Stats Panel */}
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-background/95 backdrop-blur-sm border-t px-4 py-4 z-20"
                  >
                    {/* Road Name & Speed Limit Roundel Display */}
                    <div className="mb-3 p-2.5 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Navigation className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {speedLimitData.roadType || 'Fetching road...'}
                        </span>
                      </div>
                      <SpeedLimitRoundel 
                        speedLimit={speedLimitData.speedLimit}
                        isExceeding={speedLimitData.isExceeding}
                        size="md"
                      />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {/* Speed */}
                      <div className={`rounded-xl p-3 text-center ${
                        speedLimitData.isExceeding 
                          ? 'bg-destructive/20 ring-2 ring-destructive' 
                          : 'bg-muted/50'
                      }`}>
                        <Gauge className={`h-5 w-5 mx-auto mb-1 ${speedLimitData.isExceeding ? 'text-destructive' : 'text-primary'}`} />
                        <p className={`text-2xl font-bold tabular-nums ${
                          speedLimitData.isExceeding ? 'text-destructive' : ''
                        }`}>{Math.round(currentSpeed * 0.621371)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">mph</p>
                      </div>
                      
                      {/* Distance - in miles */}
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold tabular-nums">{(totalDistance * 0.621371).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">miles</p>
                      </div>
                      
                      {/* Score */}
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className={`text-2xl font-bold tabular-nums ${
                          drivingScore >= 80 ? 'text-green-600' : drivingScore >= 50 ? 'text-amber-600' : 'text-destructive'
                        }`}>{drivingScore}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">score</p>
                      </div>
                      
                      {/* Events */}
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <div className="flex justify-center gap-0.5 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold tabular-nums">{drivingEvents.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">events</p>
                      </div>
                    </div>
                    
                    {/* Feedback Toggles & Stop Button */}
                    <div className="flex items-center gap-3">
                      {/* Voice Toggle */}
                      <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`p-2.5 rounded-lg transition-colors ${voiceEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                        aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                      >
                        {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                      </button>
                      
                      {/* Haptic Toggle */}
                      {haptic.isSupported && (
                        <button
                          onClick={() => setHapticEnabled(!hapticEnabled)}
                          className={`p-2.5 rounded-lg transition-colors ${hapticEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                          aria-label={hapticEnabled ? 'Disable haptic' : 'Enable haptic'}
                        >
                          <Vibrate className="h-5 w-5" />
                        </button>
                      )}
                      
                      {/* Stop Button */}
                      <Button
                        size="lg"
                        variant="destructive"
                        className="flex-1 h-12 text-lg font-semibold"
                        onClick={handleStopTracking}
                      >
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  attribution={getTomTomAttribution()}
                  url={getTomTomTileUrl()}
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

        {/* Session Summary - shown when tracking ends */}
        {!isTracking && sessionEnded && sessionSummary && (
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Session Complete!</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-background/60 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{sessionSummary.distance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">km traveled</p>
              </div>
              <div className="text-center p-2 bg-background/60 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{sessionSummary.duration}</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>
              <div className="text-center p-2 bg-background/60 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{sessionSummary.score}</p>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
              <div className="text-center p-2 bg-background/60 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{sessionSummary.eventCount}</p>
                <p className="text-xs text-muted-foreground">events</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              {damoovProcessing ? 'Analyzing driving behavior...' : 'Session data recorded successfully'}
            </p>
          </div>
        )}

        {/* Waiting for GPS message when not tracking and no session ended */}
        {!isTracking && !sessionEnded && (
          <div className="h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start tracking to see live map</p>
              <p className="text-xs mt-1">Uses GPS + Motion sensors for best results</p>
            </div>
          </div>
        )}

        {/* Live Stats - Enhanced with animation when tracking */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${isTracking ? 'ring-2 ring-green-500/20 rounded-lg p-2' : ''}`}>
          <div className={`p-3 rounded-lg text-center transition-all ${isTracking ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50'}`}>
            <Gauge className={`h-5 w-5 mx-auto mb-1 ${isTracking ? 'text-green-500' : 'text-primary'}`} />
            <p className={`text-2xl font-bold tabular-nums ${isTracking && currentSpeed > 0 ? 'text-green-600' : ''}`}>
              {currentSpeed.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">km/h</p>
          </div>
          <div className={`p-3 rounded-lg text-center transition-all ${isTracking ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/50'}`}>
            <MapPin className={`h-5 w-5 mx-auto mb-1 ${isTracking ? 'text-blue-500' : 'text-primary'}`} />
            <p className="text-2xl font-bold tabular-nums">{totalDistance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">km traveled</p>
          </div>
          <div className={`p-3 rounded-lg text-center transition-all ${isTracking ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-muted/50'}`}>
            <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${isTracking ? 'text-purple-500' : 'text-primary'}`} />
            <p className="text-2xl font-bold tabular-nums">{drivingScore}</p>
            <p className="text-xs text-muted-foreground">score</p>
          </div>
          <div className={`p-3 rounded-lg text-center transition-all ${isTracking ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/50'}`}>
            <div className="flex justify-center gap-1 mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{goodEventsCount}/{badEventsCount}</p>
            <p className="text-xs text-muted-foreground">events</p>
          </div>
        </div>

        {/* GPS Points Count - Live indicator */}
        {isTracking && (
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">Recording GPS points</span>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {gpsPoints.length} points
            </Badge>
          </div>
        )}

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
