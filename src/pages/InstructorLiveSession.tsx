import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Square,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  Settings,
  Loader2,
  ExternalLink,
  MapPin,
  Camera
} from "lucide-react";
import TripSummarySheet from "@/components/instructor/TripSummarySheet";
import { autoCaptureLessonRoute } from "@/hooks/useLessonRouteAutoCapture";

import { DrivingTestStartDialog } from "@/components/instructor/DrivingTestStartDialog";
import { GPSStatusHero } from "@/components/instructor/tracking/GPSStatusHero";
import { SessionStartPanel } from "@/components/instructor/tracking/SessionStartPanel";
 import { RecentSessionsList } from "@/components/instructor/tracking/RecentSessionsList";
 import { FloatingSessionTimer } from "@/components/instructor/tracking/FloatingSessionTimer";
import { DeviceSelectorDropdown } from "@/components/instructor/tracking/DeviceSelectorDropdown";

import { SatNavLiveMap } from "@/components/instructor/tracking/SatNavLiveMap";
import { LessonRouteRecorder } from "@/components/instructor/LessonRouteRecorder";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";

const InstructorFleetMap = lazy(() => import("@/pages/InstructorFleetMap"));


interface GPSDevice {
  id: string;
  device_identifier: string;
  device_name: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_heartbeat_at: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_heading: number | null;
  last_speed_limit_kmh: number | null;
  last_road_name: string | null;
  current_session_id: string | null;
  current_pupil_id: string | null;
  is_test_route_mode?: boolean;
  last_ignition_status?: boolean | null;
  tracking_provider?: string;
  last_ecu_odometer_km?: number | null;
  daily_start_ecu_odometer_km?: number | null;
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
  
 const [viewMode, setViewMode] = useState<"live" | "fleet">("live");
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
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [showDrivingTestDialog, setShowDrivingTestDialog] = useState(false);
  const [drivingTestDetails, setDrivingTestDetails] = useState<{
    testCentreId: string | null;
    testTime: string;
    pupilId: string | null;
    customPupilName: string;
    examinerId: string | null;
  } | null>(null);

  const isSessionActive = !!device?.current_session_id;
  const location = useLocation();
  const isFullscreenMode = new URLSearchParams(location.search).get("fullscreen") === "true";

  const buildDeviceSnapshot = useCallback((gpsDevice: GPSDevice) => {
    return [
      gpsDevice.last_seen_at ?? "",
      gpsDevice.last_latitude ?? "",
      gpsDevice.last_longitude ?? "",
      gpsDevice.last_speed_kmh ?? "",
      gpsDevice.last_road_name ?? "",
      gpsDevice.last_speed_limit_kmh ?? "",
      gpsDevice.current_session_id ?? "",
      gpsDevice.current_pupil_id ?? "",
      gpsDevice.is_test_route_mode ?? "",
    ].join("|");
  }, []);

  const normalizeDeviceSessionState = useCallback(async (gpsDevice: GPSDevice): Promise<GPSDevice> => {
    if (!gpsDevice.current_session_id) {
      setSessionStartTime(null);
      setTotalDistance(0);
      return gpsDevice;
    }

    const { data: session, error } = await supabase
      .from("lesson_telematics")
      .select("id, started_at, total_distance_km, ended_at")
      .eq("id", gpsDevice.current_session_id)
      .maybeSingle();

    if (error || !session || session.ended_at) {
      setSessionStartTime(null);
      setTotalDistance(0);

      void supabase
        .from("gps_devices")
        .update({
          current_session_id: null,
          current_pupil_id: null,
          is_test_route_mode: false,
        })
        .eq("id", gpsDevice.id);

      return {
        ...gpsDevice,
        current_session_id: null,
        current_pupil_id: null,
        is_test_route_mode: false,
      };
    }

    if (session.started_at) {
      setSessionStartTime(new Date(session.started_at));
    }
    setTotalDistance(session.total_distance_km ?? 0);

    return gpsDevice;
  }, []);

  // Connection status derived from last_seen_at (no client polling needed)
  // Server-side poller runs via pg_cron
  const isReconnecting = false;
  const retryCount = 0;
  const manualReconnect = useCallback(() => {
    // No-op: server-side sync handles reconnection automatically
    toast({
      title: "Server Sync Active",
      description: "GPS data is synced automatically every 15 seconds",
      duration: 2000,
    });
  }, [toast]);

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
      // Fetch active devices and instructor preference in parallel
      const [devicesRes] = await Promise.all([
        supabase
          .from("gps_devices")
          .select("*")
           .eq("instructor_id", instructor.id)
           .eq("tracking_provider", "radius")
          .limit(10),
        supabase
          .from("instructors")
          .select("preferred_tracking_provider")
          .eq("id", instructor.id)
          .single(),
      ]);

      if (devicesRes.error) throw devicesRes.error;
      const devices = devicesRes.data;
      
      if (devices && devices.length > 0) {
        setActiveProvider("radius");

        const providerDevices = devices;
        const chosen = (providerDevices[0] || devices[0]) as GPSDevice;
        const normalizedDevice = await normalizeDeviceSessionState(chosen);

        lastSeenRef.current = buildDeviceSnapshot(normalizedDevice);
        setDevice(normalizedDevice);
      }

      // Fetch pupils (without is_active filter since column doesn't exist)
      const { data: pupilData, error: pupilError } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructor.id)
        .order("name");
      
      if (pupilError) throw pupilError;
      const loadedPupils = (pupilData || []) as Pupil[];
      setPupils(loadedPupils);

      // Auto-select pupil from URL param (?pupilId=...)
      const urlParams = new URLSearchParams(window.location.search);
      const urlPupilId = urlParams.get("pupilId");
      if (urlPupilId && loadedPupils.some(p => p.id === urlPupilId)) {
        setSelectedPupilId(urlPupilId);
      }

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

  // Auto-start session when ?autoStart=1 is present in URL (after pupil + device loaded)
  const autoStartFiredRef = React.useRef(false);
  useEffect(() => {
    if (autoStartFiredRef.current) return;
    if (!device || !instructor?.id || !selectedPupilId) return;
    if (device.current_session_id) return; // already running

    const params = new URLSearchParams(window.location.search);
    if (params.get("autoStart") !== "1") return;

    autoStartFiredRef.current = true;

    // Strip the autoStart flag so refresh doesn't re-trigger
    params.delete("autoStart");
    const newSearch = params.toString();
    navigate(`/instructor/tracking${newSearch ? `?${newSearch}` : ""}`, { replace: true });

    // Fire the existing start handler (defaults to "practice" route type)
    void startSession("practice");
  }, [device, instructor?.id, selectedPupilId, navigate]);

  // Store device ID in a ref to avoid re-creating subscriptions when device object updates
  const deviceIdRef = React.useRef<string | null>(null);
  // Track a snapshot of key fields to prevent duplicate updates causing flickering,
  // while still updating when speed/road/coords change.
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
        
        const snapshot = `${typedDevice.last_seen_at ?? ""}|${typedDevice.last_latitude ?? ""}|${typedDevice.last_longitude ?? ""}|${typedDevice.last_speed_kmh ?? ""}|${typedDevice.last_road_name ?? ""}|${typedDevice.last_speed_limit_kmh ?? ""}`;

        // Only update state if data actually changed (prevents flickering)
        if (snapshot !== lastSeenRef.current) {
          lastSeenRef.current = snapshot;
          setDevice(typedDevice);
          // Only update speed limit if we got a real value (prevent flickering)
          if (typedDevice.last_speed_limit_kmh !== undefined && typedDevice.last_speed_limit_kmh !== null) {
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
          const snapshot = `${newDevice.last_seen_at ?? ""}|${newDevice.last_latitude ?? ""}|${newDevice.last_longitude ?? ""}|${newDevice.last_speed_kmh ?? ""}|${newDevice.last_road_name ?? ""}|${newDevice.last_speed_limit_kmh ?? ""}`;

          // Only update if data actually changed (prevents flickering)
          if (snapshot !== lastSeenRef.current) {
            lastSeenRef.current = snapshot;
            setDevice(newDevice);
            // Only update speed limit if we got a real value (prevent flickering)
            if (newDevice.last_speed_limit_kmh !== undefined && newDevice.last_speed_limit_kmh !== null) {
              setSpeedLimitKmh(newDevice.last_speed_limit_kmh);
            }
          }
        }
      )
      .subscribe();
    
    // Only poll when a session is actively running
    let pollerInterval: ReturnType<typeof setInterval> | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    if (device?.current_session_id && !isStopping) {
      // Direct poller trigger every 2s for near-realtime updates
      const triggerPoller = () => {
        supabase.functions.invoke("radius-poller").catch(() => {});
      };
      triggerPoller(); // Immediate first trigger
      pollerInterval = setInterval(triggerPoller, 2000);

      // Fallback DB poll every 5s (safety net — Realtime is primary)
      fallbackInterval = setInterval(pollDevice, 5000);
    }
    
    return () => {
      deviceIdRef.current = null;
      supabase.removeChannel(channel);
      if (pollerInterval) clearInterval(pollerInterval);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [device?.id, device?.current_session_id, isStopping]);

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

  // Wake lock to keep screen on while on tracking page
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
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
      if (document.visibilityState === 'visible') {
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
  }, []);

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
          manually_started: true,
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

      // Enter fullscreen mode for tracking
      navigate("/instructor/tracking?fullscreen=true", { replace: true });

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
      // Fetch route points for the path and speed calculation
      const { data: gpsPoints } = await supabase
        .from("telematics_gps_points")
        .select("latitude, longitude, speed_kmh")
        .eq("telematics_id", device.current_session_id)
        .order("recorded_at", { ascending: true });

      // Calculate avg/max speed from GPS points
      let avgSpeedKmh: number | null = null;
      let maxSpeedKmh: number | null = null;
      
      if (gpsPoints && gpsPoints.length > 0) {
        const validSpeeds = gpsPoints
          .map(p => p.speed_kmh)
          .filter((s): s is number => s != null && s > 0);
        
        if (validSpeeds.length > 0) {
          avgSpeedKmh = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
          maxSpeedKmh = Math.max(...validSpeeds);
        }
      }

      // Update telematics session with end time and calculated speeds
      const { error: sessionError } = await supabase
        .from("lesson_telematics")
        .update({
          ended_at: new Date().toISOString(),
          avg_speed_kmh: avgSpeedKmh,
          max_speed_kmh: maxSpeedKmh,
        })
        .eq("id", device.current_session_id);

      if (sessionError) throw sessionError;

      // Fetch session data for saving route
      const { data: sessionData } = await supabase
        .from("lesson_telematics")
        .select("total_distance_km, avg_speed_kmh, max_speed_kmh, started_at, ended_at")
        .eq("id", device.current_session_id)
        .single();

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

        // Auto-capture lesson route (GPS trace for pupil portal)
        await autoCaptureLessonRoute({
          telematicsId: device.current_session_id,
          instructorId: instructor.id,
          pupilId: device.current_pupil_id,
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

      // Exit fullscreen mode
      navigate("/instructor/tracking", { replace: true });

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

  // Use last_seen_at + last_heartbeat_at for robust connectivity detection
  const trackTime = device?.last_seen_at;
  const heartbeatTime = device?.last_heartbeat_at;
  const secondsSinceTrack = trackTime
    ? Math.floor((Date.now() - new Date(trackTime).getTime()) / 1000)
    : 9999;
  const secondsSinceHeartbeat = heartbeatTime
    ? Math.floor((Date.now() - new Date(heartbeatTime).getTime()) / 1000)
    : 9999;
  // Connected: device reported recently (<60s) OR poller heartbeat fresh (<120s) and device seen within 30min
  const ignitionOff = device?.last_ignition_status === false;
  const isConnected = isSessionActive
    ? secondsSinceTrack < 60 || (secondsSinceHeartbeat < 120 && secondsSinceTrack < 1800)
    : secondsSinceTrack < 300 || (ignitionOff && secondsSinceTrack < 86400);
  const isParked = !isSessionActive && ignitionOff && secondsSinceTrack >= 300 && secondsSinceTrack < 86400;

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
      <InstructorPortalLayout>
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
      </InstructorPortalLayout>
    );
  }

  // When session is active AND in fullscreen mode, show fullscreen map without standard layout
  if (isSessionActive && isFullscreenMode) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        <div className="flex-1 relative overflow-hidden">

          {/* Sat-Nav Live Map — same style as preview, fullscreen */}
          <SatNavLiveMap
            latitude={device.last_latitude}
            longitude={device.last_longitude}
            heading={device.last_heading}
            speedKmh={device.last_speed_kmh}
            speedLimitKmh={device.last_speed_limit_kmh ?? speedLimitKmh}
            roadName={device.last_road_name}
            lastSeenAt={device.last_seen_at}
            isActive={isConnected}
            sessionId={device.current_session_id}
            ignitionOn={device.last_ignition_status}
            dailyDistanceKm={
              device.last_ecu_odometer_km != null && device.daily_start_ecu_odometer_km != null
                ? device.last_ecu_odometer_km - device.daily_start_ecu_odometer_km
                : null
            }
            fullscreen
            className="absolute inset-0"
          />

          {/* Floating device selector during active session */}
          {instructor?.id && (
            <div className="absolute top-4 left-4 z-30 w-56">
              <DeviceSelectorDropdown
                instructorId={instructor.id}
                currentDeviceId={device.id}
                onDeviceChange={(deviceId, provider) => {
                  setActiveProvider(provider);
                  supabase
                    .from("gps_devices")
                    .select("*")
                    .eq("id", deviceId)
                    .single()
                    .then(({ data }) => {
                      if (data) setDevice(data);
                    });
                }}
              />
            </div>
          )}

           {/* Floating Session Timer Card */}
           <FloatingSessionTimer
             elapsedSeconds={elapsedTime}
             distanceMiles={distanceMiles}
             pupilName={currentPupil?.name || null}
             isTestRoute={device.is_test_route_mode || !device.current_pupil_id}
             onStop={stopSession}
             isStopping={isStopping}
           />

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
            <div className="absolute top-24 right-4 z-30 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-1 bg-[#1c1c1e]/90 text-white border-0">
              <Clock className="h-3 w-3 mr-1" />
              {formatElapsedTime(elapsedTime)}
            </Badge>
          </div>
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
      </div>
    );
  }

  // When no session, use standard layout with hamburger menu
  return (
    <InstructorPortalLayout>
      <div className="min-h-[calc(100dvh-120px)] -mx-4 md:mx-0 -mt-4 md:mt-0" style={{ background: "#FFFFFF" }}>
        <div style={{ padding: 16, paddingBottom: 96, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Live / Fleet toggle */}
          <SegmentedControl
            value={viewMode}
            onChange={(v) => setViewMode(v as "live" | "fleet")}
            options={[
              { value: "live", label: "Live" },
              { value: "fleet", label: "Fleet" },
            ]}
            ariaLabel="Tracking view"
          />

          {viewMode === "fleet" ? (
            <Suspense fallback={<div className="h-[70vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "0.5px solid #E5E5EA", height: "70vh" }}>
                <InstructorFleetMap />
              </div>
            </Suspense>
          ) : (<>
          {/* Device Selector Dropdown (all providers) */}
          {instructor?.id && (
            <DeviceSelectorDropdown
              instructorId={instructor.id}
              currentDeviceId={device.id}
              onDeviceChange={(deviceId, provider) => {
                setActiveProvider(provider);
                supabase
                  .from("gps_devices")
                  .select("*")
                  .eq("id", deviceId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      deviceIdRef.current = null;
                      lastSeenRef.current = null;
                      setDevice(data as GPSDevice);
                    }
                  });
                if (provider) {
                  supabase
                    .from("instructors")
                    .update({ preferred_tracking_provider: provider })
                    .eq("id", instructor.id)
                    .then(() => {});
                }
              }}
            />
          )}

          {/* GPS Status Hero Card */}
          <GPSStatusHero
            deviceName={device.device_name}
            isConnected={isConnected}
            isParked={isParked}
            lastSeenLabel={lastSeenLabel}
            isReconnecting={isReconnecting}
            retryCount={retryCount}
            onManualReconnect={manualReconnect}
            trackingProvider={device.tracking_provider}
          />

          {/* Session Start Panel */}
          {!isSessionActive && (
            <SessionStartPanel
              pupils={pupils}
              selectedPupilId={selectedPupilId}
              onPupilChange={setSelectedPupilId}
              onStartSession={(type) => startSession(type)}
              onOpenDrivingTestDialog={() => setShowDrivingTestDialog(true)}
              isStarting={isStarting}
              isConnected={isConnected}
              isRecording={isSessionActive}
            />
          )}

          {/* Manual GPS Route Recorder */}
          {instructor?.id && (
            <LessonRouteRecorder
              instructorId={instructor.id}
              pupilId={selectedPupilId || null}
            />
          )}

          {/* Dashcam Portal Link — premium card */}
          <button
            type="button"
            onClick={() => window.open("https://www.kinesisfleetpro.com/#/login;next=%2Fstatus", "_blank", "noopener,noreferrer")}
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "0.5px solid #E5E5EA",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#F1ECFA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Camera size={18} strokeWidth={2} color="#8A5BC9" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#000000", lineHeight: 1.25 }}>
                Dashcam portal
              </div>
              <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }}>
                Review past footage
              </div>
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 500,
                color: "#2B7BC8",
                flexShrink: 0,
              }}
            >
              View footage
              <ChevronRight size={10} strokeWidth={1.6} color="#2B7BC8" />
            </span>
          </button>

          {/* Mini Live Map Preview */}
          <SatNavLiveMap
            latitude={device.last_latitude}
            longitude={device.last_longitude}
            heading={device.last_heading}
            speedKmh={device.last_speed_kmh}
            speedLimitKmh={device.last_speed_limit_kmh ?? speedLimitKmh}
            roadName={device.last_road_name}
            lastSeenAt={device.last_seen_at}
            isActive={isConnected}
            sessionId={device.current_session_id}
            ignitionOn={device.last_ignition_status}
            dailyDistanceKm={
              device.last_ecu_odometer_km != null && device.daily_start_ecu_odometer_km != null
                ? device.last_ecu_odometer_km - device.daily_start_ecu_odometer_km
                : null
            }
          />

          {/* Resume active session banner */}
          {isSessionActive && (
            <div
              style={{
                background: "#FFFFFF",
                border: "0.5px solid #E5E5EA",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#3B8B3B",
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#000000", letterSpacing: -0.2, margin: 0 }}>
                    Session in progress
                  </p>
                  <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentPupil?.name || "Test route"} · {formatElapsedTime(elapsedTime)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/instructor/tracking?fullscreen=true", { replace: true })}
                style={{
                  background: "#1F2C4A",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
                }}
              >
                Resume
              </button>
            </div>
          )}

          {/* Recent Sessions */}
          {instructor?.id && (
            <RecentSessionsList instructorId={instructor.id} />
          )}
          </>)}
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
      </div>
    </InstructorPortalLayout>
  );
}
