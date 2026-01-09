import React from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useTelematics } from '@/hooks/useTelematics';

interface TelematicsTrackerProps {
  instructorId: string;
  lessonId?: string;
  pupilId?: string;
  compact?: boolean;
}

const TelematicsTracker: React.FC<TelematicsTrackerProps> = ({
  instructorId,
  lessonId,
  pupilId,
  compact = false
}) => {
  const {
    isTracking,
    currentSpeed,
    totalDistance,
    drivingEvents,
    error,
    startTracking,
    stopTracking
  } = useTelematics(instructorId);

  const goodEvents = drivingEvents.filter(e => 
    e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration'
  ).length;
  
  const badEvents = drivingEvents.filter(e => 
    e.event_type === 'harsh_brake' || e.event_type === 'harsh_acceleration' || 
    e.event_type === 'speeding' || e.event_type === 'sharp_turn'
  ).length;

  const drivingScore = Math.max(0, Math.min(100, 100 - (badEvents * 10) + (goodEvents * 5)));

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
                  <p className="text-xs text-muted-foreground">
                    {currentSpeed.toFixed(0)} km/h · {totalDistance.toFixed(1)} km
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={() => isTracking ? stopTracking() : startTracking(lessonId, pupilId)}
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
            variant={isTracking ? 'destructive' : 'default'}
            onClick={() => isTracking ? stopTracking() : startTracking(lessonId, pupilId)}
          >
            {isTracking ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Tracking
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
                  {event.event_type === 'smooth_stop' || event.event_type === 'good_acceleration' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="flex-1">{event.event_type.replace(/_/g, ' ')}</span>
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
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            GPS tracking active
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelematicsTracker;
