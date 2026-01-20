import { useState, useEffect } from "react";
import TelematicsTracker from "@/components/instructor/TelematicsTracker";
import SessionRouteReport from "@/components/instructor/SessionRouteReport";
import { TelematicsSessionHistory } from "@/components/instructor/TelematicsSessionHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Car, User, Clock, MapPin, History, Route, Bookmark, Beaker, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { SaveRouteDialog } from "@/components/instructor/SaveRouteDialog";
import PreFlightChecks from "@/components/instructor/PreFlightChecks";
import TrackingDebugPanel from "@/components/instructor/TrackingDebugPanel";
import RouteSimulator from "@/components/instructor/RouteSimulator";
import OfflineIndicator from "@/components/instructor/OfflineIndicator";
interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pickup_location: string | null;
  pupil: {
    id: string;
    name: string;
  } | null;
}

export default function InstructorTrackLesson() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const isMobile = useIsMobile();
  
  const [todaysLessons, setTodaysLessons] = useState<ScheduledLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>();
  const [selectedPupilId, setSelectedPupilId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastTelematicsId, setLastTelematicsId] = useState<string | null>(null);
  const [historyPupilName, setHistoryPupilName] = useState<string>("Pupil");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState<{
    startLocation?: string;
    endLocation?: string;
    distanceKm?: number;
  }>({});
  
  // Demo mode and pre-flight state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [preFlightPassed, setPreFlightPassed] = useState(false);
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(null);
  const [gpsPointsCount, setGpsPointsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [currentGpsStatus, setCurrentGpsStatus] = useState('unavailable');
  const [currentMotionStatus, setCurrentMotionStatus] = useState<boolean | null>(null);
  const [currentDamoovStatus, setCurrentDamoovStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'track' | 'simulate'>('track');

  useEffect(() => {
    if (instructorId) {
      fetchTodaysLessons();
    }
  }, [instructorId]);

  const fetchTodaysLessons = async () => {
    if (!instructorId) return;
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: lessonsData, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, pickup_location, pupil_id")
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Fetch pupils separately
      const pupilIds = (lessonsData || []).map(l => l.pupil_id).filter(Boolean) as string[];
      let pupilsMap: Record<string, { id: string; name: string }> = {};
      
      if (pupilIds.length > 0) {
        const { data: pupilsData } = await supabase
          .from("pupils")
          .select("id, name")
          .in("id", pupilIds);
        
        pupilsMap = (pupilsData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, { id: string; name: string }>);
      }

      const lessons: ScheduledLesson[] = (lessonsData || []).map((lesson) => ({
        id: lesson.id,
        lesson_date: lesson.lesson_date,
        start_time: lesson.start_time,
        duration_minutes: lesson.duration_minutes,
        pickup_location: lesson.pickup_location,
        pupil: lesson.pupil_id ? pupilsMap[lesson.pupil_id] || null : null
      }));

      setTodaysLessons(lessons);
      
      // Auto-select first lesson if available
      if (lessons.length > 0 && !selectedLessonId) {
        setSelectedLessonId(lessons[0].id);
        setSelectedPupilId(lessons[0].pupil?.id);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const lesson = todaysLessons.find(l => l.id === lessonId);
    setSelectedPupilId(lesson?.pupil?.id);
  };

  const selectedLesson = todaysLessons.find(l => l.id === selectedLessonId);
  const selectedPupilName = selectedLesson?.pupil?.name || "Pupil";

  // Check for recent telematics session to offer report generation
  useEffect(() => {
    const checkRecentSession = async () => {
      if (!selectedPupilId || !instructorId) return;
      
      const { data } = await supabase
        .from("lesson_telematics")
        .select("id, ended_at")
        .eq("instructor_id", instructorId)
        .eq("pupil_id", selectedPupilId)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setLastTelematicsId(data[0].id);
      }
    };
    
    checkRecentSession();
  }, [selectedPupilId, instructorId]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  const handleSelectHistorySession = (sessionId: string, pupilName: string) => {
    setLastTelematicsId(sessionId);
    setHistoryPupilName(pupilName);
    setShowHistory(false);
    setShowReportSheet(true);
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Track Lesson</h1>
              <p className="text-sm text-muted-foreground">Monitor driving behavior in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator showDetails />
            {isDemoMode && (
              <Badge variant="secondary" className="gap-1">
                <Beaker className="h-3 w-3" />
                Demo
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </div>

        {/* Mode Tabs - Track or Simulate */}
        {!showHistory ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'track' | 'simulate')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="track" className="gap-1.5">
                <Car className="h-4 w-4" />
                Live Tracking
              </TabsTrigger>
              <TabsTrigger value="simulate" className="gap-1.5">
                <PlayCircle className="h-4 w-4" />
                Simulate Route
              </TabsTrigger>
            </TabsList>

            <TabsContent value="track" className="mt-4 space-y-4">
              {/* Pre-Flight Checks */}
              {!preFlightPassed && (
                <PreFlightChecks 
                  instructorId={instructorId}
                  onAllPassed={() => setPreFlightPassed(true)}
                  onSkip={() => setPreFlightPassed(true)}
                />
              )}

              {/* Demo Mode Toggle */}
              <Card className="border-dashed">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
                          Demo Mode
                        </Label>
                        <p className="text-xs text-muted-foreground">Track without selecting a lesson</p>
                      </div>
                    </div>
                    <Switch
                      id="demo-mode"
                      checked={isDemoMode}
                      onCheckedChange={(checked) => {
                        setIsDemoMode(checked);
                        if (checked) {
                          setSelectedLessonId(undefined);
                          setSelectedPupilId(undefined);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lesson Selector - hidden in demo mode */}
              {!isDemoMode && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Lesson</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="text-center text-muted-foreground py-4">Loading lessons...</div>
                    ) : todaysLessons.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No lessons scheduled for today</p>
                        <p className="text-sm text-muted-foreground mt-1">Enable Demo Mode to track without a lesson</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Today's Lessons</Label>
                          <Select value={selectedLessonId} onValueChange={handleLessonChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a lesson" />
                            </SelectTrigger>
                            <SelectContent>
                              {todaysLessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {formatTime(lesson.start_time)} - {lesson.pupil?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedLesson && (
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {selectedLesson.pupil?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(selectedLesson.start_time)} ({Math.round(selectedLesson.duration_minutes / 60)}h)</span>
                            </div>
                            {selectedLesson.pickup_location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{selectedLesson.pickup_location}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Demo Mode Notice */}
              {isDemoMode && (
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-3">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <strong>Demo Mode:</strong> Tracking data will be recorded without linking to a lesson or pupil. 
                      Damoov analysis will be skipped.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Telematics Tracker */}
              <TelematicsTracker
                instructorId={instructorId}
                lessonId={isDemoMode ? undefined : selectedLessonId}
                pupilId={isDemoMode ? undefined : selectedPupilId}
                onSessionEnd={async (sessionId) => {
                  setLastTelematicsId(sessionId);
                  // Fetch session stats for save dialog
                  try {
                    const { data: session } = await supabase
                      .from("lesson_telematics")
                      .select("total_distance_km")
                      .eq("id", sessionId)
                      .single();
                    
                    const { data: gpsPoints } = await supabase
                      .from("telematics_gps_points")
                      .select("latitude, longitude")
                      .eq("telematics_id", sessionId)
                      .order("recorded_at", { ascending: true });

                    if (gpsPoints && gpsPoints.length > 0) {
                      setLastSessionStats({
                        startLocation: `${gpsPoints[0].latitude.toFixed(4)}, ${gpsPoints[0].longitude.toFixed(4)}`,
                        endLocation: `${gpsPoints[gpsPoints.length - 1].latitude.toFixed(4)}, ${gpsPoints[gpsPoints.length - 1].longitude.toFixed(4)}`,
                        distanceKm: session?.total_distance_km || undefined
                      });
                    }
                  } catch (error) {
                    console.error("Error fetching session stats:", error);
                  }
                }}
              />

              {/* Action Buttons - shown when there's tracking data */}
              {lastTelematicsId && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => setShowReportSheet(true)} 
                    variant="default" 
                    className="w-full gap-2"
                  >
                    <Route className="h-4 w-4" />
                    Route Report
                  </Button>
                  <Button 
                    onClick={() => setShowSaveDialog(true)} 
                    variant="secondary" 
                    className="w-full gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    Save as Training Route
                  </Button>
                </div>
              )}

              {/* Info Card */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2">How it works</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Select a lesson to link tracking data to a pupil</li>
                    <li>• Or enable Demo Mode to test tracking</li>
                    <li>• Tap "Start Tracking" to begin GPS monitoring</li>
                    <li>• Driving behavior (braking, acceleration) is analyzed</li>
                    <li>• After tracking, generate AI-powered feedback reports</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Debug Panel */}
              <TrackingDebugPanel 
                debugInfo={{
                  instructorId,
                  lessonId: isDemoMode ? undefined : selectedLessonId,
                  pupilId: isDemoMode ? undefined : selectedPupilId,
                  isTracking: false,
                  gpsStatus: currentGpsStatus,
                  motionStatus: currentMotionStatus,
                  lastError: null,
                  sessionId: trackingSessionId,
                  gpsPointsCount,
                  eventsCount,
                  damoovStatus: currentDamoovStatus
                }}
              />
            </TabsContent>

            <TabsContent value="simulate" className="mt-4">
              <RouteSimulator instructorId={instructorId} />
            </TabsContent>
          </Tabs>
        ) : (
          <TelematicsSessionHistory
            instructorId={instructorId}
            onBack={() => setShowHistory(false)}
            onSelectSession={handleSelectHistorySession}
          />
        )}
      </div>

      {/* Reports Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : "sm:max-w-lg"}>
          <SheetHeader>
            <SheetTitle>Route Report</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100%-4rem)]">
            {lastTelematicsId && (
              <SessionRouteReport 
                telematicsId={lastTelematicsId}
                onClose={() => setShowReportSheet(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Save Route Dialog */}
      {lastTelematicsId && (
        <SaveRouteDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          instructorId={instructorId}
          telematicsId={lastTelematicsId}
          startLocation={lastSessionStats.startLocation}
          endLocation={lastSessionStats.endLocation}
          distanceKm={lastSessionStats.distanceKm}
          onSaved={() => setLastTelematicsId(null)}
        />
      )}
    </InstructorPortalLayout>
  );
}
