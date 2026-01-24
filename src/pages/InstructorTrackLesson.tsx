import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SessionRouteReport from "@/components/instructor/SessionRouteReport";
import { TelematicsSessionHistory } from "@/components/instructor/TelematicsSessionHistory";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTelematicsSession } from "@/hooks/useTelematicsSession";
import { Car, History, Route, PlayCircle, FolderOpen, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import RouteSimulator from "@/components/instructor/RouteSimulator";
import OfflineIndicator from "@/components/instructor/OfflineIndicator";
import { SavedRoutesViewer } from "@/components/instructor/SavedRoutesViewer";

export default function InstructorTrackLesson() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const instructorId = instructor?.id;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [historyPupilName, setHistoryPupilName] = useState<string>("Pupil");
  const [activeTab, setActiveTab] = useState<'track' | 'simulate' | 'routes'>('track');
  const [isStarting, setIsStarting] = useState(false);

  const telematicsSession = useTelematicsSession(instructorId || '');

  const handleStartTracking = useCallback(async () => {
    if (!instructorId || isStarting) return;
    
    setIsStarting(true);
    try {
      // Create session without lesson/pupil - they select on TrackerPage
      const session = await telematicsSession.createSession();
      if (session) {
        navigate(`/instructor/tracker/${session.id}`);
      }
    } catch (err) {
      console.error('Failed to start tracking:', err);
    } finally {
      setIsStarting(false);
    }
  }, [instructorId, isStarting, telematicsSession, navigate]);

  if (authLoading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">No instructor profile found. Please log in.</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  const handleSelectHistorySession = (sessionId: string, pupilName: string) => {
    setSelectedSessionId(sessionId);
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

        {/* Mode Tabs - Track, Simulate, or Saved Routes */}
        {!showHistory ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'track' | 'simulate' | 'routes')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="track" className="gap-1.5 text-xs sm:text-sm">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Live</span> Track
              </TabsTrigger>
              <TabsTrigger value="simulate" className="gap-1.5 text-xs sm:text-sm">
                <PlayCircle className="h-4 w-4" />
                Simulate
              </TabsTrigger>
              <TabsTrigger value="routes" className="gap-1.5 text-xs sm:text-sm">
                <FolderOpen className="h-4 w-4" />
                Routes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="track" className="mt-4 space-y-4">
              {/* Start Tracking Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Car className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">Ready to Track</h2>
                    <p className="text-sm text-muted-foreground">
                      Start tracking to record GPS, speed, and driving behavior
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleStartTracking}
                    disabled={isStarting}
                    className="w-full h-12 text-base gap-2"
                    size="lg"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Route className="h-5 w-5" />
                        Start Tracking
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2">How it works</h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Tap "Start Tracking" to begin GPS monitoring</li>
                    <li>• Select a pupil on the next screen (optional)</li>
                    <li>• Speed limits and road names are shown in real-time</li>
                    <li>• Driving behavior (braking, acceleration) is analyzed</li>
                    <li>• After tracking, generate AI-powered feedback reports</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="simulate" className="mt-4">
              <RouteSimulator instructorId={instructorId} />
            </TabsContent>

            <TabsContent value="routes" className="mt-4">
              <SavedRoutesViewer instructorId={instructorId} />
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
            {selectedSessionId && (
              <SessionRouteReport 
                telematicsId={selectedSessionId}
                onClose={() => setShowReportSheet(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </InstructorPortalLayout>
  );
}
