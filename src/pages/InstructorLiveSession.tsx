import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGPSPoller } from "@/hooks/useGPSPoller";
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import TripSummarySheet from "@/components/instructor/TripSummarySheet";
import LiveTrackingMap from "@/components/instructor/LiveTrackingMap";
import { DrivingTestStartDialog } from "@/components/instructor/DrivingTestStartDialog";
// GPSConnectionChecklist removed - using inline status bar for compact UI
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";

interface GPSDevice {
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

export default function InstructorLiveSession() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [device, setDevice] = useState<GPSDevice | null>(null);
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

  // Stable error handler for GPS poller (prevents effect restarts)
  const handlePollerError = useCallback((error: Error) => {
    console.error("[GPSPoller] Error:", error);
  }, []);

  // Track page visibility to pause polling when hidden (mobile optimization)
  const [isPageVisible, setIsPageVisible] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Poll GPS server while this page is open so we can keep `last_seen_at`
  // fresh and accurately reflect connectivity even before a session starts.
  // Only poll when page is visible to reduce background churn on mobile
  const isSessionActive = !!device?.current_session_id;
  useGPSPoller({
    enabled: !!device?.id && isPageVisible,
    intervalMs: isSessionActive ? 15000 : 30000, // 15s active, 30s inactive
    onError: handlePollerError,
  });

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
        .from("gps_devices")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true)
        .limit(1);

      if (deviceError) throw deviceError;
      
      if (devices && devices.length > 0) {
        setDevice(devices[0] as GPSDevice);
        
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
  // Track last seen time to prevent duplicate updates causing flickering
  const lastSeenRef = React.useRef<string | null>(null);

  // Realtime subscription to gps_devices for instant updates
  // Uses deviceIdRef to prevent subscription churn when device data updates
  useEffect(() => {
    const currentDeviceId = device?.id;
    if (!currentDeviceId) return;
    
    // Only set up subscription once per device ID
    if (deviceIdRef.current === currentDeviceId) return;
    deviceIdRef.current = currentDeviceId;

    const pollDevice = async () => {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("*")
        .eq("id", currentDeviceId)
        .single();
      
      if (error) {
        console.error('[GPS Poll] Error:', error.message);
        return;
      }
      
      if (data) {
        const typedDevice = data as GPSDevice;
        
        // Only update state if data actually changed (prevents flickering)
        if (typedDevice.last_seen_at !== lastSeenRef.current) {
          lastSeenRef.current = typedDevice.last_seen_at;
          setDevice(typedDevice);
          if (typedDevice.last_speed_limit_kmh !== undefined) {
            setSpeedLimitKmh(typedDevice.last_speed_limit_kmh);
          }
        }
        
        // Fetch distance if session active (always check this)
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
          table: "gps_devices",
          filter: `id=eq.${currentDeviceId}`,
        },
        (payload) => {
          const newDevice = payload.new as GPSDevice;
          // Only update if data actually changed (prevents flickering)
          if (newDevice.last_seen_at !== lastSeenRef.current) {
            lastSeenRef.current = newDevice.last_seen_at;
            setDevice(newDevice);
            if (newDevice.last_speed_limit_kmh !== undefined) {
              setSpeedLimitKmh(newDevice.last_speed_limit_kmh);
            }
          }
        }
      )
      .subscribe();
    
    // Fallback polling every 15s (realtime handles most updates)
    const interval = setInterval(pollDevice, 15000);
    
    return () => {
      deviceIdRef.current = null;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [device?.id]);

  // Additional realtime subscription for pupil sessions (live_pupil_positions)
  // This is supplementary - the main updates come from gps_devices subscription above
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
        .from("gps_devices")
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
        .from("gps_devices")
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

  // Use a SHORT timeout for active sessions (to quickly zero-out speed when GPS stops),
  // but a more forgiving timeout when not recording (GPS hardware may have gaps).
  // 30s for active sessions (we need fresh data), 5 minutes for idle (just showing device is known)
  const secondsSinceUpdate = device?.last_seen_at
    ? Math.floor((Date.now() - new Date(device.last_seen_at).getTime()) / 1000)
    : 9999;
  const isConnected = secondsSinceUpdate < (isSessionActive ? 30 : 300);

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
        <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")} className="text-primary/80 hover:text-primary hover:bg-primary/10 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src="/everydriver-logo-instructor.png"
              alt="EveryDriver" 
              className="h-6 object-contain"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Device Configured</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Set up a GPS device before starting a session
            </p>
            <Button size="lg" onClick={() => navigate("/instructor/settings/gps")}>
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

      {/* Header - Matches other pages */}
      {!isSessionActive && (
        <div className="flex-shrink-0 z-50 bg-background border-b border-border shadow-sm px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/80 hover:text-primary hover:bg-primary/10 -ml-2" onClick={() => navigate("/instructor")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img 
                src="/everydriver-logo-instructor.png"
                alt="EveryDriver" 
                className="h-6 object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs px-2 py-0.5">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/80 hover:text-primary hover:bg-primary/10" onClick={() => navigate("/instructor/settings/gps")}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Map or Pupil Selection */}
      <div className="flex-1 relative overflow-hidden">
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
        <LiveTrackingMap
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
          /* Pre-session: Compact Start controls overlay - no scrolling */
          <div className="absolute inset-0 z-30 flex flex-col pointer-events-none">
            {/* Connection Status Bar - Top */}
            <div className="pointer-events-auto flex-shrink-0 p-3 pb-0">
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl border backdrop-blur ${
                isConnected 
                  ? "bg-emerald-500/10 border-emerald-500/30" 
                  : "bg-destructive/10 border-destructive/30"
              }`}>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium">
                    {device.device_name || "GPS Device"}
                  </span>
                </div>
                <span className={`text-xs ${isConnected ? "text-emerald-600" : "text-destructive"}`}>
                  {isConnected ? "Connected" : `Last: ${lastSeenLabel}`}
                </span>
              </div>
            </div>

            {/* Spacer to push content to bottom */}
            <div className="flex-1" />

            {/* Bottom Controls Panel */}
            <div className="pointer-events-auto px-3 pb-[calc(70px+env(safe-area-inset-bottom))]">
              <div className="rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg">
                <div className="p-3 space-y-3">
                  {/* Pupil Selection Row */}
                  <div className="flex items-center gap-2">
                    <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
                      <SelectTrigger className="flex-1 h-11">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select pupil..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {pupils.map((pupil) => (
                          <SelectItem key={pupil.id} value={pupil.id}>
                            {pupil.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Test Route Toggle */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      device?.is_test_route_mode || !selectedPupilId 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-muted/50 border-border"
                    }`}>
                      <Flag className={`h-4 w-4 ${device?.is_test_route_mode || !selectedPupilId ? "text-amber-600" : "text-muted-foreground"}`} />
                      <Switch 
                        checked={device?.is_test_route_mode || !selectedPupilId}
                        onCheckedChange={async (checked) => {
                          if (!device) return;
                          if (selectedPupilId) {
                            await supabase
                              .from("gps_devices")
                              .update({ is_test_route_mode: checked })
                              .eq("id", device.id);
                            setDevice({ ...device, is_test_route_mode: checked });
                          }
                        }}
                        disabled={!selectedPupilId}
                        className="scale-90"
                      />
                    </div>
                  </div>

                  {/* Action Buttons - Side by Side */}
                  <div className="flex gap-2">
                    {/* Main Start Button */}
                    <Button 
                      size="lg"
                      className={`flex-1 h-12 text-base font-semibold rounded-xl ${
                        !selectedPupilId ? "bg-amber-600 hover:bg-amber-700" : ""
                      }`}
                      onClick={() => startSession(selectedPupilId ? "practice" : "test")}
                      disabled={isStarting || !isConnected}
                    >
                      {isStarting ? (
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      ) : selectedPupilId ? (
                        <Play className="h-5 w-5 mr-2" />
                      ) : (
                        <Flag className="h-5 w-5 mr-2" />
                      )}
                      {selectedPupilId 
                        ? (device?.is_test_route_mode ? "Test Route" : "Start") 
                        : "Test Route"
                      }
                    </Button>

                    {/* Driving Test Button */}
                    <Button 
                      size="lg"
                      className="h-12 px-4 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowDrivingTestDialog(true)}
                      disabled={isStarting || !isConnected}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trip Summary Sheet */}
      {completedSessionId && (
        <TripSummarySheet
          open={showReport}
          onOpenChange={setShowReport}
          telematicsId={completedSessionId}
        />
      )}

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
