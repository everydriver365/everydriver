import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  Square,
  Wifi, 
  WifiOff,
  RefreshCw,
  Gauge,
  AlertTriangle,
  Clock,
  User,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import SessionRouteReport from "@/components/instructor/SessionRouteReport";
import TraccarLiveMap from "@/components/instructor/TraccarLiveMap";

interface TraccarDevice {
  id: string;
  device_identifier: string;
  device_name: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_heading: number | null;
  current_session_id: string | null;
  current_pupil_id: string | null;
}

interface Pupil {
  id: string;
  name: string;
}

interface AlertCounts {
  total: number;
  speeding: number;
  braking: number;
}

export default function InstructorTraccarSession() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [device, setDevice] = useState<TraccarDevice | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupilId, setSelectedPupilId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({ total: 0, speeding: 0, braking: 0 });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !instructor) {
      navigate("/instructor/login");
    }
  }, [loading, instructor, navigate]);

  // Fetch device and pupils
  useEffect(() => {
    if (instructor?.id) {
      fetchData();
    }
  }, [instructor?.id]);

  const fetchData = async () => {
    if (!instructor?.id) return;
    
    try {
      // Fetch first active device
      const { data: devices, error: deviceError } = await supabase
        .from("traccar_devices")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true)
        .limit(1);

      if (deviceError) throw deviceError;
      
      if (devices && devices.length > 0) {
        setDevice(devices[0] as TraccarDevice);
        
        // If session is active, restore timer
        if (devices[0].current_session_id) {
          const { data: session } = await supabase
            .from("lesson_telematics")
            .select("started_at")
            .eq("id", devices[0].current_session_id)
            .single();
          
          if (session?.started_at) {
            setSessionStartTime(new Date(session.started_at));
          }
        }
      }

      // Fetch pupils
      const { data: pupilData, error: pupilError } = await (supabase as any)
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true)
        .order("name");
      
      if (pupilError) throw pupilError;
      setPupils((pupilData || []) as Pupil[]);

    } catch (err) {
      console.error("Error fetching data:", err);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Poll device status
  useEffect(() => {
    if (!device?.id) return;

    const pollDevice = async () => {
      const { data } = await supabase
        .from("traccar_devices")
        .select("*")
        .eq("id", device.id)
        .single();
      
      if (data) {
        setDevice(data as TraccarDevice);
      }
    };

    const interval = setInterval(pollDevice, 3000);
    return () => clearInterval(interval);
  }, [device?.id]);

  // Fetch alert counts when session is active
  useEffect(() => {
    if (!device?.current_session_id) {
      setAlertCounts({ total: 0, speeding: 0, braking: 0 });
      return;
    }

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("telematics_realtime_alerts" as any)
        .select("alert_type")
        .eq("telematics_id", device.current_session_id) as { 
          data: { alert_type: string }[] | null; 
          error: unknown 
        };

      if (!error && data) {
        const speeding = data.filter((a: { alert_type: string }) => a.alert_type === "speeding").length;
        const braking = data.filter((a: { alert_type: string }) => a.alert_type === "harsh_braking").length;
        setAlertCounts({
          total: data.length,
          speeding,
          braking,
        });
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [device?.current_session_id]);

  // Timer for elapsed time
  useEffect(() => {
    if (!sessionStartTime) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setElapsedTime(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const startSession = async () => {
    if (!device || !selectedPupilId || !instructor?.id) {
      toast({
        title: "Select a pupil",
        description: "Please select a pupil before starting the session",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    try {
      // Create telematics session
      const { data: session, error: sessionError } = await supabase
        .from("lesson_telematics")
        .insert({
          instructor_id: instructor.id,
          pupil_id: selectedPupilId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update device with session and pupil
      const { error: deviceError } = await supabase
        .from("traccar_devices")
        .update({
          current_session_id: session.id,
          current_pupil_id: selectedPupilId,
        })
        .eq("id", device.id);

      if (deviceError) throw deviceError;

      setDevice({
        ...device,
        current_session_id: session.id,
        current_pupil_id: selectedPupilId,
      });
      setSessionStartTime(new Date());

      toast({
        title: "Session started",
        description: "GPS data is now being recorded to the pupil's history",
      });
    } catch (err) {
      console.error("Error starting session:", err);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopSession = async () => {
    if (!device?.current_session_id) return;

    setIsStopping(true);
    try {
      // Update telematics session
      const { error: sessionError } = await supabase
        .from("lesson_telematics")
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq("id", device.current_session_id);

      if (sessionError) throw sessionError;

      // Clear live position
      if (device.current_pupil_id) {
        await supabase
          .from("live_pupil_positions")
          .update({ is_active: false })
          .eq("pupil_id", device.current_pupil_id);
      }

      // Store session ID before clearing
      const sessionId = device.current_session_id;

      // Clear device session
      const { error: deviceError } = await supabase
        .from("traccar_devices")
        .update({
          current_session_id: null,
          current_pupil_id: null,
        })
        .eq("id", device.id);

      if (deviceError) throw deviceError;

      setDevice({
        ...device,
        current_session_id: null,
        current_pupil_id: null,
      });
      setSessionStartTime(null);
      setCompletedSessionId(sessionId);
      setShowReport(true);

      toast({
        title: "Session ended",
        description: "Trip data has been saved",
      });
    } catch (err) {
      console.error("Error stopping session:", err);
      toast({
        title: "Error",
        description: "Failed to stop session",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isConnected = device?.last_seen_at 
    ? (new Date().getTime() - new Date(device.last_seen_at).getTime()) / 1000 / 60 < 2
    : false;

  const isSessionActive = !!device?.current_session_id;
  const currentPupil = pupils.find(p => p.id === device?.current_pupil_id);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Traccar Session</h1>
          </div>
        </div>
        <div className="p-4">
          <Card>
            <CardContent className="py-8 text-center">
              <WifiOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Device Configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up a Traccar device before starting a session
              </p>
              <Button onClick={() => navigate("/instructor/settings/traccar")}>
                <Settings className="h-4 w-4 mr-2" />
                Setup Device
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Traccar Session</h1>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/settings/traccar")}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Session Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isSessionActive ? "Active Session" : "Start Session"}
            </CardTitle>
            {!isSessionActive && (
              <CardDescription>Select a pupil and start tracking</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isSessionActive ? (
              <>
                {/* Active session info */}
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{currentPupil?.name || "Unknown Pupil"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatElapsedTime(elapsedTime)}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={stopSession}
                  disabled={isStopping}
                >
                  {isStopping ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  End Session
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Pupil</label>
                  <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a pupil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pupils.map((pupil) => (
                        <SelectItem key={pupil.id} value={pupil.id}>
                          {pupil.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full"
                  onClick={startSession}
                  disabled={isStarting || !selectedPupilId || !isConnected}
                >
                  {isStarting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Session
                </Button>

                {!isConnected && (
                  <p className="text-xs text-amber-600 text-center">
                    ⚠️ Device is offline. Start Traccar Client on your phone.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Live Map */}
        {isSessionActive && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <TraccarLiveMap
                latitude={device.last_latitude}
                longitude={device.last_longitude}
                heading={device.last_heading}
                speedKmh={device.last_speed_kmh}
                isConnected={isConnected}
                sessionId={device.current_session_id}
                className="h-[300px]"
              />
            </CardContent>
          </Card>
        )}

        {/* Live Stats */}
        {isSessionActive && (
          <div className="grid grid-cols-2 gap-3">
            {/* Speed */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Gauge className="h-4 w-4" />
                  <span className="text-xs">Current Speed</span>
                </div>
                <p className="text-2xl font-bold">
                  {device.last_speed_kmh !== null 
                    ? `${Math.round(device.last_speed_kmh * 0.621371)} mph`
                    : "-- mph"}
                </p>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Alerts</span>
                </div>
                <p className="text-2xl font-bold">{alertCounts.total}</p>
                <div className="flex gap-2 mt-1">
                  {alertCounts.speeding > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {alertCounts.speeding} speed
                    </Badge>
                  )}
                  {alertCounts.braking > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {alertCounts.braking} brake
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location info when session active */}
        {isSessionActive && device.last_latitude && device.last_longitude && (
          <div className="text-center text-xs text-muted-foreground">
            {device.last_latitude.toFixed(5)}, {device.last_longitude.toFixed(5)}
            {device.last_seen_at && (
              <span className="ml-2">
                • Updated {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
              </span>
            )}
          </div>
        )}

        {/* Device Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Device</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{device.device_name}</p>
                <code className="text-xs text-muted-foreground">{device.device_identifier}</code>
              </div>
              {device.last_seen_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Report Sheet */}
      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Trip Report</SheetTitle>
          </SheetHeader>
          {completedSessionId && (
            <div className="overflow-y-auto h-full pb-8">
              <SessionRouteReport 
                telematicsId={completedSessionId} 
                onClose={() => setShowReport(false)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
