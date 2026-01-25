import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Settings,
  Navigation,
  Zap,
  Flag
} from "lucide-react";
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
  is_test_route_mode?: boolean;
}

interface Pupil {
  id: string;
  name: string;
}

interface AlertCounts {
  total: number;
  speeding: number;
  braking: number;
  acceleration: number;
}

interface DrivingEvent {
  id: string;
  alert_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  created_at: string;
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
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({ total: 0, speeding: 0, braking: 0, acceleration: 0 });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [drivingEvents, setDrivingEvents] = useState<DrivingEvent[]>([]);

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
        
        // If session is active, restore timer and distance
        if (devices[0].current_session_id) {
          const { data: session } = await supabase
            .from("lesson_telematics")
            .select("started_at, total_distance_km")
            .eq("id", devices[0].current_session_id)
            .single();
          
          if (session?.started_at) {
            setSessionStartTime(new Date(session.started_at));
          }
          if (session?.total_distance_km) {
            setTotalDistance(session.total_distance_km);
          }
        }
      }

      // Fetch pupils (without is_active filter since column doesn't exist)
      const { data: pupilData, error: pupilError } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructor.id)
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

      // Also fetch distance if session active
      if (device.current_session_id) {
        const { data: session } = await supabase
          .from("lesson_telematics")
          .select("total_distance_km")
          .eq("id", device.current_session_id)
          .single();
        
        if (session?.total_distance_km) {
          setTotalDistance(session.total_distance_km);
        }
      }
    };

    const interval = setInterval(pollDevice, 3000);
    return () => clearInterval(interval);
  }, [device?.id, device?.current_session_id]);

  // Fetch alert counts and events when session is active
  useEffect(() => {
    if (!device?.current_session_id) {
      setAlertCounts({ total: 0, speeding: 0, braking: 0, acceleration: 0 });
      setDrivingEvents([]);
      return;
    }

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from("telematics_realtime_alerts")
        .select("id, alert_type, severity, latitude, longitude, speed_kmh, created_at")
        .eq("telematics_id", device.current_session_id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const speeding = data.filter((a) => a.alert_type === "speeding").length;
        const braking = data.filter((a) => a.alert_type === "harsh_braking").length;
        const acceleration = data.filter((a) => a.alert_type === "harsh_acceleration").length;
        setAlertCounts({
          total: data.length,
          speeding,
          braking,
          acceleration,
        });
        setDrivingEvents(data as DrivingEvent[]);
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
          total_distance_km: 0,
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
      setTotalDistance(0);

      toast({
        title: "Session started",
        description: "GPS data is now being recorded",
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

      // Fetch session data for saving route
      const { data: sessionData } = await supabase
        .from("lesson_telematics")
        .select("total_distance_km, avg_speed_kmh, max_speed_kmh, started_at, ended_at")
        .eq("id", device.current_session_id)
        .single();

      // Fetch route points for the path
      const { data: gpsPoints } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude")
        .eq("telematics_id", device.current_session_id)
        .order("recorded_at", { ascending: true });

      // Calculate duration
      let durationMinutes = null;
      if (sessionData?.started_at && sessionData?.ended_at) {
        const start = new Date(sessionData.started_at).getTime();
        const end = new Date(sessionData.ended_at).getTime();
        durationMinutes = Math.round((end - start) / 1000 / 60);
      }

      // Sample route path (max 100 points for storage efficiency)
      let routePath = null;
      if (gpsPoints && gpsPoints.length >= 2) {
        const step = Math.max(1, Math.floor(gpsPoints.length / 100));
        routePath = gpsPoints
          .filter((_, i) => i % step === 0 || i === gpsPoints.length - 1)
          .map(p => ({ lat: p.latitude, lon: p.longitude }));
      }

      // Get pupil name for route naming
      const selectedPupil = pupils.find(p => p.id === device.current_pupil_id);
      const pupilName = selectedPupil?.name || "Unknown";
      const routeDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      
      // Check if test route mode is enabled
      const isTestRoute = device.is_test_route_mode || false;

      // Get start/end locations from first/last GPS points
      let startLocation = null;
      let endLocation = null;
      if (gpsPoints && gpsPoints.length >= 2) {
        // Could use reverse geocoding here, but for now just use coordinates
        startLocation = `${gpsPoints[0].latitude.toFixed(4)}, ${gpsPoints[0].longitude.toFixed(4)}`;
        endLocation = `${gpsPoints[gpsPoints.length-1].latitude.toFixed(4)}, ${gpsPoints[gpsPoints.length-1].longitude.toFixed(4)}`;
      }

      // Auto-save the route
      if (instructor?.id) {
        await supabase
          .from("saved_routes")
          .insert({
            instructor_id: instructor.id,
            telematics_id: device.current_session_id,
            name: `${pupilName} - ${routeDate}`,
            route_type: isTestRoute ? "test" : "practice",
            distance_km: sessionData?.total_distance_km,
            duration_minutes: durationMinutes,
            avg_speed_kmh: sessionData?.avg_speed_kmh,
            max_speed_kmh: sessionData?.max_speed_kmh,
            route_path: routePath,
            start_location: startLocation,
            end_location: endLocation,
            pupil_id: device.current_pupil_id,
          });
      }

      // Clear live position
      if (device.current_pupil_id) {
        await supabase
          .from("live_pupil_positions")
          .update({ is_active: false })
          .eq("pupil_id", device.current_pupil_id);
      }

      // Store session ID before clearing
      const sessionId = device.current_session_id;

      // Clear device session (also reset test route mode)
      const { error: deviceError } = await supabase
        .from("traccar_devices")
        .update({
          current_session_id: null,
          current_pupil_id: null,
          is_test_route_mode: false,
        })
        .eq("id", device.id);

      if (deviceError) throw deviceError;

      setDevice({
        ...device,
        current_session_id: null,
        current_pupil_id: null,
        is_test_route_mode: false,
      });
      setSessionStartTime(null);
      setCompletedSessionId(sessionId);
      setShowReport(true);

      toast({
        title: "Session ended",
        description: isTestRoute ? "Test route saved" : "Route saved automatically",
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
  const speedMph = device?.last_speed_kmh != null ? Math.round(device.last_speed_kmh * 0.621371) : null;
  const distanceMiles = totalDistance * 0.621371;

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Live Tracking</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Device Configured</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set up a Traccar device before starting a session
            </p>
            <Button size="lg" onClick={() => navigate("/instructor/settings/traccar")}>
              <Settings className="h-5 w-5 mr-2" />
              Setup Device
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/instructor")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">
              {isSessionActive ? currentPupil?.name || "Tracking" : "Live Tracking"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-2 py-0.5">
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/instructor/settings/traccar")}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Screen Map or Pupil Selection */}
      <div className="flex-1 relative">
        {isSessionActive ? (
          <>
            {/* Live Map - Full Screen */}
            <TraccarLiveMap
              latitude={device.last_latitude}
              longitude={device.last_longitude}
              heading={device.last_heading}
              speedKmh={device.last_speed_kmh}
              isConnected={isConnected}
              sessionId={device.current_session_id}
              events={drivingEvents}
              className="absolute inset-0"
            />

            {/* Floating Stats Bar */}
            <div className="absolute bottom-24 left-4 right-4 z-20">
              <div className="bg-background/95 backdrop-blur rounded-2xl shadow-lg border p-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {/* Speed */}
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Gauge className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold">
                      {speedMph !== null ? speedMph : "--"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">mph</p>
                  </div>
                  
                  {/* Time */}
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Clock className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold">{formatElapsedTime(elapsedTime)}</p>
                    <p className="text-[10px] text-muted-foreground">time</p>
                  </div>
                  
                  {/* Distance */}
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Navigation className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-bold">{distanceMiles.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">miles</p>
                  </div>
                  
                  {/* Alerts */}
                  <div>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <p className={`text-lg font-bold ${alertCounts.total > 0 ? 'text-amber-500' : ''}`}>
                      {alertCounts.total}
                    </p>
                    <p className="text-[10px] text-muted-foreground">alerts</p>
                  </div>
                </div>

                {/* Alert breakdown */}
                {alertCounts.total > 0 && (
                  <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                    {alertCounts.braking > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {alertCounts.braking} brake
                      </Badge>
                    )}
                    {alertCounts.acceleration > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Zap className="h-2.5 w-2.5 mr-0.5" />
                        {alertCounts.acceleration} accel
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Floating Stop Button */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <Button 
                variant="destructive" 
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
                onClick={stopSession}
                disabled={isStopping}
              >
                {isStopping ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Square className="h-5 w-5 mr-2" />
                )}
                End Trip
              </Button>
            </div>
          </>
        ) : (
          /* Pre-session: Pupil Selection Overlay */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Start Tracking</h2>
                <p className="text-sm text-muted-foreground">
                  Select a pupil to begin recording the trip
                </p>
              </div>

              <div className="space-y-4">
                <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue placeholder="Select pupil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pupils.map((pupil) => (
                      <SelectItem key={pupil.id} value={pupil.id} className="py-3">
                        {pupil.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Test Route Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-amber-600" />
                    <Label className="text-sm font-medium">Test Route</Label>
                  </div>
                  <Switch 
                    checked={device?.is_test_route_mode || false}
                    onCheckedChange={async (checked) => {
                      if (!device) return;
                      await supabase
                        .from("traccar_devices")
                        .update({ is_test_route_mode: checked })
                        .eq("id", device.id);
                      setDevice({ ...device, is_test_route_mode: checked });
                    }}
                  />
                </div>

                <Button 
                  size="lg"
                  className="w-full h-14 text-lg font-semibold rounded-xl"
                  onClick={startSession}
                  disabled={isStarting || !selectedPupilId || !isConnected}
                >
                  {isStarting ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 mr-2" />
                  )}
                  {device?.is_test_route_mode ? "Start Test Route" : "Start Trip"}
                </Button>

                {!isConnected && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                      ⚠️ Device is offline. Start Traccar Client on your phone.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trip Report Sheet */}
      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Trip Report</SheetTitle>
          </SheetHeader>
          {completedSessionId && (
            <SessionRouteReport 
              telematicsId={completedSessionId} 
              onClose={() => setShowReport(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
