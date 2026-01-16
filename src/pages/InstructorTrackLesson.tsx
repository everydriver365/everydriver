import { useState, useEffect } from "react";
import TelematicsTracker from "@/components/instructor/TelematicsTracker";
import GeneratedDrivingReport from "@/components/instructor/GeneratedDrivingReport";
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
import { supabase } from "@/integrations/supabase/client";
import { Car, User, Clock, MapPin, FileText, History, Route } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

        {/* Show History or Main Content */}
        {showHistory ? (
          <TelematicsSessionHistory
            instructorId={instructorId}
            onBack={() => setShowHistory(false)}
            onSelectSession={handleSelectHistorySession}
          />
        ) : (
          <>
            {/* Lesson Selector */}
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
                    <p className="text-sm text-muted-foreground mt-1">You can still track without a lesson</p>
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

            {/* Telematics Tracker */}
            <TelematicsTracker
              instructorId={instructorId}
              lessonId={selectedLessonId}
              pupilId={selectedPupilId}
              onSessionEnd={(sessionId) => {
                setLastTelematicsId(sessionId);
              }}
            />

            {/* Generate Report Buttons - shown when there's tracking data */}
            {lastTelematicsId && selectedPupilId && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowReportSheet(true)} 
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  AI Feedback
                </Button>
                <Button 
                  onClick={() => setShowReportSheet(true)} 
                  variant="default" 
                  className="flex-1 gap-2"
                >
                  <Route className="h-4 w-4" />
                  Route Report
                </Button>
              </div>
            )}

            {/* Info Card */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-2">How it works</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Select a lesson to link tracking data to a pupil</li>
                  <li>• Tap "Start Tracking" to begin GPS monitoring</li>
                  <li>• Driving behavior (braking, acceleration) is analyzed</li>
                  <li>• After tracking, generate AI-powered feedback reports</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Reports Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : "sm:max-w-lg"}>
          <SheetHeader>
            <SheetTitle>Session Reports</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100%-4rem)]">
            {lastTelematicsId && (
              <Tabs defaultValue="route" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="route">Route Report</TabsTrigger>
                  <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
                </TabsList>
                <TabsContent value="route" className="mt-4">
                  <SessionRouteReport 
                    telematicsId={lastTelematicsId}
                    onClose={() => setShowReportSheet(false)}
                  />
                </TabsContent>
                <TabsContent value="feedback" className="mt-4">
                  <GeneratedDrivingReport 
                    telematicsId={lastTelematicsId}
                    pupilName={showHistory ? historyPupilName : selectedPupilName}
                    onClose={() => setShowReportSheet(false)}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </InstructorPortalLayout>
  );
}
