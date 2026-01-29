import React, { useState, useEffect } from "react";
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
  Flag,
  CheckCircle
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
import { DrivingTestStartDialog } from "@/components/instructor/DrivingTestStartDialog";
import { TraccarConnectionChecklist } from "@/components/instructor/TraccarConnectionChecklist";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";

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
  last_speed_limit_kmh: number | null;
  last_road_name: string | null;
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
  const [speedLimitKmh, setSpeedLimitKmh] = useState<number | null>(null);
  const [pendingRouteType, setPendingRouteType] = useState<"practice" | "test" | "driving_test">("practice");
  const [showDrivingTestDialog, setShowDrivingTestDialog] = useState(false);
  const [drivingTestDetails, setDrivingTestDetails] = useState<{
    testCentreId: string | null;
    testTime: string;
    pupilId: string | null;
    customPupilName: string;
    examinerId: string | null;
  } | null>(null);

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

  // Store device ID in a ref to avoid re-creating subscriptions when device object updates
  const deviceIdRef = React.useRef<string | null>(null);

  // Realtime subscription to traccar_devices for instant updates
  // Uses deviceIdRef to prevent subscription churn when device data updates
  useEffect(() => {
    const currentDeviceId = device?.id;
    if (!currentDeviceId) return;
    
    // Only set up subscription once per device ID
    if (deviceIdRef.current === currentDeviceId) return;
    deviceIdRef.current = currentDeviceId;

    console.log('[Traccar] Setting up realtime for device:', currentDeviceId);

    const pollDevice = async () => {
      const { data, error } = await supabase
        .from("traccar_devices")
        .select("*")
        .eq("id", currentDeviceId)
        .single();
      
      if (error) {
        console.error('[Traccar Poll] Error:', error.message);
        return;
      }
      
      if (data) {
        const typedDevice = data as TraccarDevice;
        console.log('[Traccar Poll] Device update:', {
          lat: typedDevice.last_latitude,
          lng: typedDevice.last_longitude,
          speed: typedDevice.last_speed_kmh,
          road: typedDevice.last_road_name,
          limit: typedDevice.last_speed_limit_kmh,
        });
        setDevice(typedDevice);
        // Always read speed limit from device (works for test routes too)
        if (typedDevice.last_speed_limit_kmh !== undefined) {
          setSpeedLimitKmh(typedDevice.last_speed_limit_kmh);
        }
        
        // Also fetch distance if session active
        if (typedDevice.current_session_id) {
          const { data: session } = await supabase
            .from("lesson_telematics")
            .select("total_distance_km")
            .eq("id", typedDevice.current_session_id)
            .single();
          
          if (session?.total_distance_km) {
            setTotalDistance(session.total_distance_km);
          }
        }
      }
    };

    // Initial fetch immediately
    pollDevice();
    
    // Subscribe to device changes for instant updates
    const channel = supabase
      .channel(`device-rt-${currentDeviceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "traccar_devices",
          filter: `id=eq.${currentDeviceId}`,
        },
        (payload) => {
          const newDevice = payload.new as TraccarDevice;
          console.log('[Traccar RT] Device update:', {
            lat: newDevice.last_latitude,
            lng: newDevice.last_longitude,
            speed: newDevice.last_speed_kmh,
            road: newDevice.last_road_name,
            limit: newDevice.last_speed_limit_kmh,
          });
          setDevice(newDevice);
          // Update speed limit from device (works for all session types)
          if (newDevice.last_speed_limit_kmh !== undefined) {
            setSpeedLimitKmh(newDevice.last_speed_limit_kmh);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Traccar RT] Subscription status:', status);
      });
    
    // Aggressive fallback polling every 2s to ensure updates are timely
    const interval = setInterval(pollDevice, 2000);
    
    return () => {
      console.log('[Traccar] Cleaning up realtime for device:', currentDeviceId);
      deviceIdRef.current = null;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [device?.id]);

  // Additional realtime subscription for pupil sessions (live_pupil_positions)
  // This is supplementary - the main updates come from traccar_devices subscription above
  useEffect(() => {
    if (!device?.current_pupil_id || !device?.current_session_id) return;

    // Subscribe to live position changes for pupil sessions (additional data source)
    const channel = supabase
      .channel(`live-pos-${device.current_pupil_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_pupil_positions",
          filter: `pupil_id=eq.${device.current_pupil_id}`,
        },
        (payload) => {
          const newPos = payload.new as { 
            speed_kmh?: number; 
            speed_limit_kmh?: number | null;
            latitude?: number;
            longitude?: number;
            heading?: number;
          };
          
          // Use speed limit from live_pupil_positions if available
          if (newPos.speed_limit_kmh !== undefined && newPos.speed_limit_kmh !== null) {
            setSpeedLimitKmh(newPos.speed_limit_kmh);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [device?.current_pupil_id, device?.current_session_id]);

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

  // Wake lock to keep screen on during tracking
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if (!device?.current_session_id) return;
      
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
        }
      } catch (err) {
        console.log('Wake lock error:', err);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && device?.current_session_id) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
        console.log('Wake lock released');
      }
    };
  }, [device?.current_session_id]);

  const startSession = async (
    routeType: "practice" | "test" | "driving_test" = "practice",
    testDetails?: {
      testCentreId: string | null;
      testTime: string;
      pupilId: string | null;
      customPupilName: string;
      examinerId: string | null;
    }
  ) => {
    if (!device || !instructor?.id) {
      toast({
        title: "Error",
        description: "Device not configured",
        variant: "destructive",
      });
      return;
    }

    // For driving tests, use the pupil from dialog or selected pupil
    const effectivePupilId = testDetails?.pupilId || selectedPupilId || null;

    // Determine test route mode based on route type and pupil selection
    const isTestRouteMode = routeType === "test" || routeType === "driving_test" || !effectivePupilId || device.is_test_route_mode;
    
    // Store the route type and details for when we save the route
    setPendingRouteType(routeType);
    if (testDetails) {
      setDrivingTestDetails(testDetails);
    }

    setIsStarting(true);
    try {
      // Create telematics session (pupil_id can be null for test routes)
      const { data: session, error: sessionError } = await supabase
        .from("lesson_telematics")
        .insert({
          instructor_id: instructor.id,
          pupil_id: effectivePupilId,
          started_at: new Date().toISOString(),
          total_distance_km: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update device with session, pupil (if any), and test route mode
      const { error: deviceError } = await supabase
        .from("traccar_devices")
        .update({
          current_session_id: session.id,
          current_pupil_id: effectivePupilId,
          is_test_route_mode: isTestRouteMode,
        })
        .eq("id", device.id);

      if (deviceError) throw deviceError;

      setDevice({
        ...device,
        current_session_id: session.id,
        current_pupil_id: effectivePupilId,
        is_test_route_mode: isTestRouteMode,
      });
      setSessionStartTime(new Date());
      setTotalDistance(0);

      // Close dialog if open
      setShowDrivingTestDialog(false);

      const toastTitle = routeType === "driving_test" 
        ? "Driving test started" 
        : (isTestRouteMode ? "Test route started" : "Session started");
      toast({
        title: toastTitle,
        description: "GPS data is now being recorded",
        duration: 2000,
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

  const handleDrivingTestStart = (details: {
    testCentreId: string | null;
    testTime: string;
    pupilId: string | null;
    customPupilName: string;
    examinerId: string | null;
  }) => {
    startSession("driving_test", details);
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
      const selectedPupil = device.current_pupil_id 
        ? pupils.find(p => p.id === device.current_pupil_id)
        : null;
      const routeDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      
      // Determine route name based on route type
      let routeName: string;
      if (pendingRouteType === "driving_test") {
        // Use custom pupil name if provided, otherwise use selected pupil
        const pupilDisplayName = drivingTestDetails?.customPupilName || selectedPupil?.name;
        routeName = pupilDisplayName 
          ? `Driving Test - ${pupilDisplayName} - ${routeDate}`
          : `Driving Test - ${routeDate}`;
      } else if (pendingRouteType === "test" || !selectedPupil) {
        routeName = `Test Route - ${routeDate}`;
      } else {
        routeName = `${selectedPupil.name} - ${routeDate}`;
      }

      // Get start/end locations from first/last GPS points
      let startLocation = null;
      let endLocation = null;
      if (gpsPoints && gpsPoints.length >= 2) {
        // Could use reverse geocoding here, but for now just use coordinates
        startLocation = `${gpsPoints[0].latitude.toFixed(4)}, ${gpsPoints[0].longitude.toFixed(4)}`;
        endLocation = `${gpsPoints[gpsPoints.length-1].latitude.toFixed(4)}, ${gpsPoints[gpsPoints.length-1].longitude.toFixed(4)}`;
      }

      // Auto-save the route with the correct route type and driving test details
      if (instructor?.id) {
        const routeData: Record<string, unknown> = {
          instructor_id: instructor.id,
          telematics_id: device.current_session_id,
          name: routeName,
          route_type: pendingRouteType,
          distance_km: sessionData?.total_distance_km,
          duration_minutes: durationMinutes,
          avg_speed_kmh: sessionData?.avg_speed_kmh,
          max_speed_kmh: sessionData?.max_speed_kmh,
          route_path: routePath,
          start_location: startLocation,
          end_location: endLocation,
          pupil_id: device.current_pupil_id || null,
        };

        // Add driving test specific data if available
        if (pendingRouteType === "driving_test" && drivingTestDetails) {
          routeData.test_centre_id = drivingTestDetails.testCentreId;
          routeData.metadata = {
            test_time: drivingTestDetails.testTime,
            examiner_id: drivingTestDetails.examinerId,
            custom_pupil_name: drivingTestDetails.customPupilName || null,
          };
        }

        await supabase
          .from("saved_routes")
          .insert(routeData as any);
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
      setDrivingTestDetails(null); // Clear driving test details

      const toastDescription = pendingRouteType === "driving_test" 
        ? "Driving test route saved" 
        : (pendingRouteType === "test" ? "Test route saved" : "Route saved automatically");
      toast({
        title: "Session ended",
        description: toastDescription,
        duration: 2000,
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

  // Use a SHORT timeout (10s) to detect stale speed data - GPS should update every 1-3 seconds when active
  const secondsSinceUpdate = device?.last_seen_at
    ? Math.floor((Date.now() - new Date(device.last_seen_at).getTime()) / 1000)
    : 9999;
  const isConnected = secondsSinceUpdate < 10; // Only 10 seconds - speed zeros out quickly when GPS stops

  const lastSeenAtDate = device?.last_seen_at ? new Date(device.last_seen_at) : null;
  const secondsSinceLastSeen = lastSeenAtDate
    ? Math.max(0, Math.floor((Date.now() - lastSeenAtDate.getTime()) / 1000))
    : null;
  const lastSeenLabel = (() => {
    if (secondsSinceLastSeen === null) return "never";
    if (secondsSinceLastSeen < 60) return `${secondsSinceLastSeen}s ago`;
    const mins = Math.floor(secondsSinceLastSeen / 60);
    const secs = secondsSinceLastSeen % 60;
    return `${mins}m ${secs}s ago`;
  })();

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
        <div className="sticky top-0 z-50 bg-primary border-b border-primary-foreground/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-primary-foreground">Live Tracking</h1>
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
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Not Connected Warning Banner - only show when not in session */}
      {!isConnected && !isSessionActive && (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              Device not connected – start Traccar Client on your phone
            </span>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0 flex-shrink-0"
            onClick={() => navigate("/instructor/settings/traccar")}
          >
            Setup
          </Button>
        </div>
      )}

      {/* Compact Header - Hidden during active session for full-screen map */}
      {!isSessionActive && (
        <div className="flex-shrink-0 z-50 bg-primary border-b border-primary-foreground/10 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/instructor")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-primary-foreground">Live Tracking</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs px-2 py-0.5">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  Live
                </Badge>
              ) : (
                <Badge className="bg-primary-foreground/10 text-primary-foreground/70 border-primary-foreground/20 text-xs px-2 py-0.5">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/instructor/settings/traccar")}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Map or Pupil Selection */}
      <div className="flex-1 relative">
        {/* Stale data banner */}
        {!isConnected && (
          <div className="absolute top-4 left-4 right-4 z-30">
            <div className="rounded-xl border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-lg">
              <div className="flex items-start gap-2">
                <WifiOff className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    No recent GPS updates
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last update {lastSeenLabel}. Showing last known location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Map - always visible so speed/road updates show instantly */}
        <TraccarLiveMap
          latitude={device.last_latitude}
          longitude={device.last_longitude}
          heading={device.last_heading}
          speedKmh={isConnected ? device.last_speed_kmh : null}
          speedLimitKmh={isConnected ? (device.last_speed_limit_kmh ?? speedLimitKmh) : null}
          isConnected={isConnected}
          sessionId={isSessionActive ? device.current_session_id : null}
          roadName={device.last_road_name}
          className="absolute inset-0"
        />

        {isSessionActive ? (
          <>
            {/* Floating Stop Button - positioned above the map's bottom panel */}
            <div className="absolute bottom-[140px] left-4 right-4 z-30">
              <Button 
                variant="destructive" 
                size="lg"
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
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

            {/* Session info badge */}
            {alertCounts.total > 0 && (
              <div className="absolute top-24 left-4 z-30">
                <Badge variant="destructive" className="text-xs px-2 py-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alertCounts.total} alert{alertCounts.total !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {/* Timer badge */}
            <div className="absolute top-24 right-4 z-30">
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-[#1c1c1e]/90 text-white border-0">
                <Clock className="h-3 w-3 mr-1" />
                {formatElapsedTime(elapsedTime)}
              </Badge>
            </div>
          </>
        ) : (
          /* Pre-session: Start controls overlay (map stays visible behind) */
          <div className="absolute inset-0 z-30 flex flex-col justify-end pointer-events-none">
            <div className="pointer-events-auto px-4 pb-[calc(150px+env(safe-area-inset-bottom))]">
              <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg overflow-hidden">
                <div className="p-4 space-y-5">
                  {/* Header */}
                  <div className="text-center">
                    <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                      {device?.is_test_route_mode || !selectedPupilId ? (
                        <Flag className="h-8 w-8 text-primary" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <h2 className="text-xl font-semibold mb-1">Start Tracking</h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your device and select a pupil
                    </p>
                  </div>

                  {/* Connection Checklist */}
                  <TraccarConnectionChecklist
                    isConnected={isConnected}
                    lastSeenAt={device.last_seen_at}
                    deviceName={device.device_name || "Traccar Device"}
                  />

                  {/* Pupil Selection */}
                  <div className="space-y-4">
                    <Select value={selectedPupilId} onValueChange={(value) => {
                      setSelectedPupilId(value);
                    }}>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue placeholder="Select pupil (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pupils.map((pupil) => (
                          <SelectItem key={pupil.id} value={pupil.id} className="py-3">
                            {pupil.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Test Route Mode Toggle - always visible */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${
                      device?.is_test_route_mode || !selectedPupilId 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-muted/50 border-border"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Flag className={`h-4 w-4 ${device?.is_test_route_mode || !selectedPupilId ? "text-amber-600" : "text-muted-foreground"}`} />
                        <div>
                          <Label className="text-sm font-medium">Test Route</Label>
                          {!selectedPupilId && (
                            <p className="text-[10px] text-muted-foreground">Auto-enabled without pupil</p>
                          )}
                        </div>
                      </div>
                      <Switch 
                        checked={device?.is_test_route_mode || !selectedPupilId}
                        onCheckedChange={async (checked) => {
                          if (!device) return;
                          if (selectedPupilId) {
                            await supabase
                              .from("traccar_devices")
                              .update({ is_test_route_mode: checked })
                              .eq("id", device.id);
                            setDevice({ ...device, is_test_route_mode: checked });
                          }
                        }}
                        disabled={!selectedPupilId}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {/* Start with pupil button */}
                      {selectedPupilId && (
                        <Button 
                          size="lg"
                          className="w-full h-14 text-lg font-semibold rounded-xl"
                          onClick={() => startSession("practice")}
                          disabled={isStarting || !isConnected}
                        >
                          {isStarting ? (
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-5 w-5 mr-2" />
                          )}
                          {device?.is_test_route_mode ? "Start Test Route" : "Start Trip"}
                        </Button>
                      )}

                      {/* Quick start test route button */}
                      {!selectedPupilId && (
                        <Button 
                          size="lg"
                          variant="default"
                          className="w-full h-14 text-lg font-semibold rounded-xl bg-amber-600 hover:bg-amber-700"
                          onClick={() => startSession("test")}
                          disabled={isStarting || !isConnected}
                        >
                          {isStarting ? (
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          ) : (
                            <Flag className="h-5 w-5 mr-2" />
                          )}
                          Start Test Route
                        </Button>
                      )}

                      {/* Driving Test button - opens dialog */}
                      <Button 
                        size="lg"
                        variant="default"
                        className="w-full h-14 text-lg font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setShowDrivingTestDialog(true)}
                        disabled={isStarting || !isConnected}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Driving Test
                      </Button>
                    </div>
                  </div>
                </div>
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

      {/* Driving Test Start Dialog */}
      <DrivingTestStartDialog
        open={showDrivingTestDialog}
        onOpenChange={setShowDrivingTestDialog}
        instructorId={instructor?.id || ""}
        pupils={pupils}
        onStart={handleDrivingTestStart}
        isStarting={isStarting}
      />

      {!device?.current_session_id && <InstructorBottomNav />}
    </div>
  );
}
