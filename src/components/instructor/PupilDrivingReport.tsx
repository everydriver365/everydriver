import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Gauge,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  Car,
  ChevronRight,
  Download,
  Map,
  Settings2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RouteMapView from './RouteMapView';
import DrivingSkillsHeatmap from './DrivingSkillsHeatmap';
import PupilBrakeGearAnalysis from './PupilBrakeGearAnalysis';

interface TelematicsSession {
  id: string;
  lesson_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface DrivingEvent {
  id: string;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  recorded_at: string;
  notes: string | null;
}

interface PupilDrivingReportProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
}

const PupilDrivingReport: React.FC<PupilDrivingReportProps> = ({
  pupilId,
  pupilName,
  instructorId
}) => {
  const [sessions, setSessions] = useState<TelematicsSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TelematicsSession | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [allEvents, setAllEvents] = useState<DrivingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTelematicsData();
  }, [pupilId, instructorId]);

  const fetchTelematicsData = async () => {
    setIsLoading(true);
    try {
      // Fetch all telematics sessions for this pupil
      const { data: sessionsData } = await supabase
        .from('lesson_telematics')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('pupil_id', pupilId)
        .order('started_at', { ascending: false });

      setSessions(sessionsData || []);

      // Fetch all driving events for summary
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.id);
        const { data: eventsData } = await supabase
          .from('driving_behavior_events')
          .select('*')
          .in('telematics_id', sessionIds)
          .order('recorded_at', { ascending: false });

        setAllEvents(eventsData || []);

        // Auto-select first session
        if (sessionsData.length > 0) {
          await loadSessionDetails(sessionsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching telematics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetails = async (session: TelematicsSession) => {
    setSelectedSession(session);

    // Fetch GPS points for this session
    const { data: gpsData } = await supabase
      .from('telematics_gps_points')
      .select('latitude, longitude, speed_kmh, recorded_at')
      .eq('telematics_id', session.id)
      .order('recorded_at', { ascending: true });

    setGpsPoints(gpsData || []);

    // Fetch events for this session
    const { data: eventsData } = await supabase
      .from('driving_behavior_events')
      .select('*')
      .eq('telematics_id', session.id)
      .order('recorded_at', { ascending: false });

    setEvents(eventsData || []);
  };

  // Calculate summary stats
  const totalDistance = sessions.reduce((acc, s) => acc + (Number(s.total_distance_km) || 0), 0);
  const totalSessions = sessions.length;
  const avgSpeed = sessions.filter(s => s.avg_speed_kmh).length > 0
    ? sessions.reduce((acc, s) => acc + (Number(s.avg_speed_kmh) || 0), 0) / sessions.filter(s => s.avg_speed_kmh).length
    : 0;

  const goodEvents = allEvents.filter(e => 
    e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration'
  );
  const badEvents = allEvents.filter(e => 
    e.event_type === 'harsh_brake' || e.event_type === 'harsh_acceleration' || 
    e.event_type === 'speeding' || e.event_type === 'sharp_turn'
  );

  const overallScore = Math.max(0, Math.min(100, 
    100 - (badEvents.length * 5) + (goodEvents.length * 2)
  ));

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'harsh_brake':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'harsh_acceleration':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case 'speeding':
        return <Gauge className="h-4 w-4 text-red-500" />;
      case 'sharp_turn':
        return <Navigation className="h-4 w-4 text-amber-500" />;
      case 'smooth_stop':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good_acceleration':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Navigation className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Driving Data Yet</h3>
          <p className="text-muted-foreground max-w-md">
            GPS tracking data will appear here once you start recording lessons with {pupilName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">Driving Report: {pupilName}</span>
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0 self-start sm:self-auto">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-none">
              <p className="text-xl sm:text-2xl font-bold text-primary">{overallScore}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-none">
              <p className="text-xl sm:text-2xl font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-none">
              <p className="text-xl sm:text-2xl font-bold">{totalDistance.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">km</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-none">
              <p className="text-xl sm:text-2xl font-bold text-green-500">{goodEvents.length}</p>
              <p className="text-xs text-muted-foreground">Good</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-none">
              <p className="text-xl sm:text-2xl font-bold text-amber-500">{badEvents.length}</p>
              <p className="text-xs text-muted-foreground">Needs Work</p>
            </div>
          </div>

          {/* Score Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Driving Performance</span>
              <span className={overallScore >= 80 ? 'text-green-500' : overallScore >= 50 ? 'text-amber-500' : 'text-red-500'}>
                {overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Developing' : 'Needs Practice'}
              </span>
            </div>
            <Progress value={overallScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Sessions, Heatmap, and Events */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="w-full overflow-x-auto grid grid-cols-4">
          <TabsTrigger value="sessions" className="text-xs sm:text-sm">Sessions</TabsTrigger>
          <TabsTrigger value="brake-gear" className="text-xs sm:text-sm">
            <Settings2 className="h-4 w-4 mr-1" />
            Brake & Gear
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs sm:text-sm">
            <Map className="h-4 w-4 mr-1" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs sm:text-sm">Events ({allEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Session List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recorded Lessons</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px] lg:h-[400px]">
                  <div className="p-4 space-y-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => loadSessionDetails(session)}
                        className={`w-full text-left p-3 rounded-none border transition-colors ${
                          selectedSession?.id === session.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {format(new Date(session.started_at), 'd MMM yyyy')}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {(Number(session.total_distance_km) * 0.621371).toFixed(1)} mi
                          </span>
                          {session.avg_speed_kmh && (
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              {Math.round(Number(session.avg_speed_kmh) * 0.621371)} mph avg
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Map and Session Details */}
            <div className="lg:col-span-2 space-y-4">
              {selectedSession && (
                <>
                  <RouteMapView 
                    gpsPoints={gpsPoints} 
                    title={`Route - ${format(new Date(selectedSession.started_at), 'd MMM yyyy')}`}
                    height="180px"
                  />

                  {/* Session Stats */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold">{(Number(selectedSession.total_distance_km) * 0.621371).toFixed(1)} mi</p>
                          <p className="text-xs text-muted-foreground">Distance</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{selectedSession.avg_speed_kmh ? Math.round(Number(selectedSession.avg_speed_kmh) * 0.621371) : '--'} mph</p>
                          <p className="text-xs text-muted-foreground">Avg Speed</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{selectedSession.max_speed_kmh ? Math.round(Number(selectedSession.max_speed_kmh) * 0.621371) : '--'} mph</p>
                          <p className="text-xs text-muted-foreground">Max Speed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Session Events */}
                  {events.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Events This Lesson</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {events.map((event) => (
                            <div key={event.id} className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 bg-muted/30 rounded-none">
                              {getEventIcon(event.event_type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{formatEventType(event.event_type)}</p>
                                {event.notes && (
                                  <p className="text-xs text-muted-foreground truncate">{event.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                <Badge 
                                  variant={event.severity === 'high' ? 'destructive' : event.severity === 'medium' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  {event.severity}
                                </Badge>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(event.recorded_at), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="brake-gear">
          {selectedSession ? (
            <PupilBrakeGearAnalysis 
              telematicsId={selectedSession.id}
              sessionDate={selectedSession.started_at}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a session from the Sessions tab to view brake & gear analysis
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="heatmap">
          <DrivingSkillsHeatmap 
            instructorId={instructorId} 
            pupilId={pupilId}
            height="450px"
          />
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All Driving Events</CardTitle>
            </CardHeader>
            <CardContent>
              {allEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events recorded yet</p>
              ) : (
                <ScrollArea className="h-[300px] lg:h-[400px]">
                  <div className="space-y-2 pr-4">
                    {allEvents.map((event) => (
                      <div key={event.id} className="flex flex-wrap items-start gap-2 sm:gap-3 p-3 border rounded-none">
                        {getEventIcon(event.event_type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{formatEventType(event.event_type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.recorded_at), 'd MMM yyyy, HH:mm')}
                          </p>
                          {event.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={event.severity === 'high' ? 'destructive' : event.severity === 'medium' ? 'secondary' : 'outline'}
                          >
                            {event.severity}
                          </Badge>
                          {event.speed_at_event && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round(Number(event.speed_at_event) * 0.621371)} mph
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PupilDrivingReport;
