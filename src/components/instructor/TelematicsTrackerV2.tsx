import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Navigation, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  MapPin,
  TrendingUp,
  Minimize2,
  Wifi,
  WifiOff,
  Timer,
  Shield,
  Volume2,
  VolumeX,
  Vibrate
} from 'lucide-react';
import { useGPSCollector } from '@/hooks/useGPSCollector';
import { useMotionCollector } from '@/hooks/useMotionCollector';
import { useRealtimeAlerts, TelematicsAlert } from '@/hooks/useRealtimeAlerts';
import { useTelematicsSession } from '@/hooks/useTelematicsSession';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useVoiceAnnouncements } from '@/hooks/useVoiceAnnouncements';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DamoovScoresDisplay from './DamoovScoresDisplay';
import PupilGamificationStats from './PupilGamificationStats';
import SpeedLimitRoundel from './SpeedLimitRoundel';
import SpeedComplianceReport from './SpeedComplianceReport';
import { RealtimeAlertDisplay, AlertBadge } from './RealtimeAlertDisplay';
import { GPSPermissionHelper } from './GPSPermissionHelper';
import { getTomTomTileUrl, getTomTomAttribution } from '@/lib/tomtomConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [maxSpeedRecorded, setMaxSpeedRecorded] = useState(0);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  
  // Feedback settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  
  // New focused hooks
  const gpsCollector = useGPSCollector();
  const motionCollector = useMotionCollector();
  const session = useTelematicsSession(instructorId);
  const alerts = useRealtimeAlerts(session.currentSession?.id || null, {
    onNewAlert: handleNewAlert,
    enableHapticFeedback: hapticEnabled,
  });
  
  // Feedback hooks
  const haptic = useHapticFeedback();
  const voice = useVoiceAnnouncements({ enabled: voiceEnabled });

  // Handle new alerts from server
  function handleNewAlert(alert: TelematicsAlert) {
    if (voiceEnabled) {
      voice.announceEvent(alert.alert_type as any, alert.severity);
    }
  }

  // Update route coordinates when position changes
  useEffect(() => {
    if (gpsCollector.currentPosition && gpsCollector.isCollecting) {
      const newCoord: [number, number] = [
        gpsCollector.currentPosition.latitude,
        gpsCollector.currentPosition.longitude
      ];
      setRouteCoordinates(prev => [...prev, newCoord]);
      
      // Track max speed
      if (gpsCollector.currentSpeed > maxSpeedRecorded) {
        setMaxSpeedRecorded(gpsCollector.currentSpeed);
      }
    }
  }, [gpsCollector.currentPosition, gpsCollector.isCollecting, gpsCollector.currentSpeed, maxSpeedRecorded]);

  // Auto-enter fullscreen when tracking starts
  useEffect(() => {
    if (gpsCollector.isCollecting && !isFullscreen) {
      setIsFullscreen(true);
    }
  }, [gpsCollector.isCollecting, isFullscreen]);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gpsCollector.isCollecting && trackingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - trackingStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gpsCollector.isCollecting, trackingStartTime]);

  // Show results when processing completes
  useEffect(() => {
    if (session.damoovScores && !session.isProcessing) {
      setShowResults(true);
    }
  }, [session.damoovScores, session.isProcessing]);

  // Start tracking
  const handleStartTracking = useCallback(async () => {
    console.log('[TelematicsTracker] Starting tracking...', { lessonId, pupilId });
    setShowResults(false);
    setSessionEnded(false);
    setElapsedTime(0);
    setRouteCoordinates([]);
    setMaxSpeedRecorded(0);
    setTrackingStartTime(new Date());
    
    // Create session first
    const newSession = await session.createSession(lessonId, pupilId);
    if (!newSession) {
      console.error('[TelematicsTracker] Failed to create session');
      return;
    }
    
    // Start GPS collection
    gpsCollector.startCollection(newSession.id);
    
    // Start motion collection
    motionCollector.startCollection(newSession.id);
    
    // Feedback on start
    if (hapticEnabled) haptic.triggerStart();
    if (voiceEnabled) voice.announceStart();
  }, [lessonId, pupilId, session, gpsCollector, motionCollector, hapticEnabled, haptic, voiceEnabled, voice]);

  // Stop tracking
  const handleStopTracking = useCallback(async () => {
    console.log('[TelematicsTracker] Stopping tracking...');
    setIsFullscreen(false);
    
    // Stop GPS collection and get final stats
    const { totalDistance, pointCount } = gpsCollector.stopCollection();
    
    // Stop motion collection
    const { peakGForce, sampleCount: motionSamples } = await motionCollector.stopCollection();
    console.log(`[TelematicsTracker] Motion stopped: ${motionSamples} samples, peak G: ${peakGForce.toFixed(2)}`);
    
    // Calculate average speed
    const durationSeconds = trackingStartTime ? (Date.now() - trackingStartTime.getTime()) / 1000 : 0;
    const avgSpeedKmh = durationSeconds > 0 ? (totalDistance / 1000) / (durationSeconds / 3600) : 0;
    
    // Feedback on stop
    if (hapticEnabled) haptic.triggerStop();
    
    // End session and trigger Damoov processing
    const finalSession = await session.endSession(totalDistance, maxSpeedRecorded, avgSpeedKmh);
    
    if (finalSession) {
      // Save session ID for compliance report
      setLastSessionId(finalSession.id);
      
      if (voiceEnabled) {
        const score = session.damoovScores?.overallScore || 75;
        voice.announceStop(score);
      }
      
      setSessionEnded(true);
      
      // Notify parent component
      if (onSessionEnd) {
        onSessionEnd(finalSession.id);
      }
    }
  }, [gpsCollector, trackingStartTime, maxSpeedRecorded, session, hapticEnabled, haptic, voiceEnabled, voice, onSessionEnd]);

  // Format elapsed time as mm:ss
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Current position for map
  const currentPosition: [number, number] | null = gpsCollector.currentPosition
    ? [gpsCollector.currentPosition.latitude, gpsCollector.currentPosition.longitude]
    : null;

  // Default center (UK)
  const defaultCenter: [number, number] = [51.5074, -0.1278];

  // GPS Quality indicator
  const getGPSStatusColor = () => {
    switch (gpsCollector.gpsQuality.status) {
      case 'excellent':
      case 'good': return 'text-green-500';
      case 'fair': return 'text-amber-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-red-500';
    }
  };

  const getGPSIcon = () => {
    if (gpsCollector.gpsQuality.status === 'unavailable') return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  // Compact mode
  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${gpsCollector.isCollecting ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
                <Navigation className={`h-4 w-4 ${gpsCollector.isCollecting ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {gpsCollector.isCollecting ? 'Tracking Active' : 'GPS Tracking'}
                </p>
                {gpsCollector.isCollecting && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {Math.round(gpsCollector.currentSpeed * 0.621371)} mph · {(gpsCollector.totalDistance / 1000 * 0.621371).toFixed(1)} mi
                    </p>
                    <span className={`text-xs ${getGPSStatusColor()}`}>
                      {gpsCollector.gpsQuality.status}
                    </span>
                    {alerts.alertCounts.unacknowledged > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5">
                        {alerts.alertCounts.unacknowledged}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={gpsCollector.isCollecting ? 'destructive' : 'default'}
              onClick={() => gpsCollector.isCollecting ? handleStopTracking() : handleStartTracking()}
            >
              {gpsCollector.isCollecting ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Real-time alert popup */}
      <RealtimeAlertDisplay 
        alert={alerts.latestAlert}
        onDismiss={alerts.clearLatestAlert}
        voiceEnabled={voiceEnabled}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              GPS Telematics
            </CardTitle>
            <div className="flex items-center gap-2">
              {!gpsCollector.isCollecting && <GPSPermissionHelper />}
              <AlertBadge alertCounts={alerts.alertCounts} />
              <Button
                size="sm"
                variant={gpsCollector.isCollecting ? 'destructive' : 'default'}
                onClick={() => gpsCollector.isCollecting ? handleStopTracking() : handleStartTracking()}
              >
                {gpsCollector.isCollecting ? (
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error display */}
          {(gpsCollector.error || session.error) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <p>{gpsCollector.error || session.error}</p>
            </div>
          )}

          {/* GPS Quality Indicator */}
          {gpsCollector.isCollecting && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1 ${getGPSStatusColor()}`}>
                  {getGPSIcon()}
                  <span className="text-xs font-medium">
                    GPS: {gpsCollector.gpsQuality.status}
                    {gpsCollector.gpsQuality.accuracy && ` (±${gpsCollector.gpsQuality.accuracy.toFixed(0)}m)`}
                  </span>
                </div>
                
                {/* Motion sensor status */}
                {motionCollector.motionQuality.hasPermission && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">
                      {motionCollector.currentMotion.gForce.toFixed(2)}g
                    </span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {gpsCollector.pointCount} pts
                </div>
              </div>
              
              {/* Alert count badge */}
              {alerts.alertCounts.total > 0 && (
                <Badge variant={alerts.alertCounts.high > 0 ? 'destructive' : 'secondary'}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alerts.alertCounts.total}
                </Badge>
              )}
            </div>
          )}

          {/* Fullscreen Tracking Dashboard */}
          <AnimatePresence>
            {isFullscreen && gpsCollector.isCollecting && (
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
                        {gpsCollector.gpsQuality.status}
                        {gpsCollector.gpsQuality.accuracy && ` ±${gpsCollector.gpsQuality.accuracy.toFixed(0)}m`}
                      </span>
                    </div>
                    
                    {/* Realtime subscription status */}
                    {alerts.isSubscribed && (
                      <div className="flex items-center gap-1 text-green-500">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-xs">Live alerts</span>
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
                  {gpsCollector.speedLimitData.isExceeding && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 z-20"
                    >
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">
                        SPEED LIMIT {gpsCollector.speedLimitData.speedLimit ? Math.round(gpsCollector.speedLimitData.speedLimit * 0.621371) : '--'} mph — Current: {Math.round(gpsCollector.currentSpeed * 0.621371)} mph
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
                  
                  {/* Speed Limit Roundel overlay */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <SpeedLimitRoundel 
                      speedLimit={gpsCollector.speedLimitData.speedLimit}
                      isExceeding={gpsCollector.speedLimitData.isExceeding}
                      size="lg"
                    />
                  </div>
                  
                  {/* Road name display */}
                  {gpsCollector.speedLimitData.roadName && (
                    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm z-10 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {gpsCollector.speedLimitData.roadName}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* GPS Points Counter */}
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="tabular-nums">{gpsCollector.pointCount} pts</span>
                  </div>
                  
                  {/* Alert badge */}
                  {alerts.alertCounts.unacknowledged > 0 && (
                    <div className="absolute top-3 left-3">
                      <AlertBadge alertCounts={alerts.alertCounts} />
                    </div>
                  )}
                </div>

                {/* Bottom Stats Panel */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-background/95 backdrop-blur-sm border-t px-4 py-4 z-20"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {/* Speed with limit indicator */}
                    <div className={`rounded-xl p-3 text-center ${
                      gpsCollector.speedLimitData.isExceeding 
                        ? 'bg-destructive/20 ring-2 ring-destructive' 
                        : 'bg-muted/50'
                    }`}>
                      <Gauge className={`h-5 w-5 mx-auto mb-1 ${
                        gpsCollector.speedLimitData.isExceeding ? 'text-destructive' : 'text-primary'
                      }`} />
                      <p className={`text-2xl font-bold tabular-nums ${
                        gpsCollector.speedLimitData.isExceeding ? 'text-destructive' : ''
                      }`}>
                        {Math.round(gpsCollector.currentSpeed * 0.621371)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        mph {gpsCollector.speedLimitData.speedLimit && `/ ${Math.round(gpsCollector.speedLimitData.speedLimit * 0.621371)}`}
                      </p>
                    </div>
                    
                    {/* Distance - in miles */}
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold tabular-nums">
                        {(gpsCollector.totalDistance / 1000 * 0.621371).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">miles</p>
                    </div>
                    
                    {/* Good Events */}
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-2xl font-bold tabular-nums text-green-600">
                        {alerts.alertCounts.low}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">minor</p>
                    </div>
                    
                    {/* Alerts */}
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                      <p className={`text-2xl font-bold tabular-nums ${
                        alerts.alertCounts.high > 0 ? 'text-destructive' : 'text-amber-600'
                      }`}>
                        {alerts.alertCounts.high + alerts.alertCounts.medium}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">alerts</p>
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

          {/* Inline Map when tracking */}
          {gpsCollector.isCollecting && !isFullscreen && (
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
                
                <MapUpdater position={currentPosition} />
              </MapContainer>
            </div>
          )}

          {/* Real-time stats when tracking */}
          {gpsCollector.isCollecting && !isFullscreen && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{Math.round(gpsCollector.currentSpeed * 0.621371)}</p>
                <p className="text-xs text-muted-foreground">mph</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{(gpsCollector.totalDistance / 1000 * 0.621371).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">miles</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold">{formatElapsedTime(elapsedTime)}</p>
                <p className="text-xs text-muted-foreground">time</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className={`text-lg font-bold ${alerts.alertCounts.high > 0 ? 'text-destructive' : ''}`}>
                  {alerts.alertCounts.total}
                </p>
                <p className="text-xs text-muted-foreground">alerts</p>
              </div>
            </div>
          )}

          {/* Session Results */}
          {sessionEnded && (
            <div className="space-y-4">
              {/* Processing indicator */}
              {session.isProcessing && (
                <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyzing driving data with AI...</span>
                </div>
              )}
              
              {/* Speed Compliance Report */}
              {session.currentSession?.id || lastSessionId ? (
                <SpeedComplianceReport 
                  telematicsId={session.currentSession?.id || lastSessionId || ''} 
                />
              ) : null}
              
              {/* Damoov Scores Display */}
              <DamoovScoresDisplay
                scores={session.damoovScores}
                coinsEarned={session.coinsEarned}
                isProcessing={session.isProcessing}
              />
              
              {/* Pupil Gamification Stats */}
              {pupilId && showResults && (
                <PupilGamificationStats pupilId={pupilId} />
              )}
              
              {/* Session Summary */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-lg font-bold">{(gpsCollector.totalDistance / 1000 * 0.621371).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">miles</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{Math.round(maxSpeedRecorded * 0.621371)}</p>
                  <p className="text-xs text-muted-foreground">max mph</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{motionCollector.peakGForce.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">peak G</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{alerts.alertCounts.total}</p>
                  <p className="text-xs text-muted-foreground">events</p>
                </div>
              </div>
            </div>
          )}

          {/* Idle state */}
          {!gpsCollector.isCollecting && !sessionEnded && (
            <div className="text-center py-6 text-muted-foreground">
              <Navigation className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Press Start to begin tracking the driving lesson</p>
              <p className="text-xs mt-1">Real-time alerts powered by server-side analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default TelematicsTracker;
