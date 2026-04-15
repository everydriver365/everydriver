import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Cpu, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Trash2,
  Satellite,
  Search
} from "lucide-react";

import PreFlightChecks from "@/components/instructor/PreFlightChecks";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { GPSConnectionStatusCard } from "@/components/instructor/GPSConnectionStatusCard";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";

import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GPSDevice {
  id: string;
  device_identifier: string;
  device_name: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  current_session_id: string | null;
  geotab_device_id?: string | null;
}

export default function InstructorGPSSetup() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProvider } = useActiveTrackingProvider(instructor?.id);
  
  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("GPS Tracker");
  const [deviceId, setDeviceId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get live GPS position data
  const position = useInstructorLastPosition(instructor?.id ?? null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseHost = supabaseUrl?.replace('https://', '') || 'qyqeibovdhyohkfagujv.supabase.co';

  useEffect(() => {
    if (!loading && !instructor) {
      navigate("/instructor/login");
    }
  }, [loading, instructor, navigate]);

  useEffect(() => {
    if (instructor?.id) {
      fetchDevices();
    }
  }, [instructor?.id]);

  // Auto-poll for status updates every 5 seconds
  useEffect(() => {
    if (!instructor?.id) return;
    
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchDevices();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [instructor?.id]);

  const fetchDevices = async () => {
    if (!instructor?.id) return;
    
    try {
      let query = supabase
        .from("gps_devices")
        .select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });

      // Filter by active provider if one exists
      if (activeProvider) {
        query = query.eq("tracking_provider", activeProvider);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDevice = async () => {
    if (!instructor?.id) return;
    
    if (!deviceId.trim()) {
      toast({
        title: "Device ID required",
        description: "Please enter your device ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .insert({
          device_identifier: deviceId.trim(),
          instructor_id: instructor.id,
          device_name: deviceName,
        })
        .select()
        .single();

      if (error) throw error;

      setDevices([data, ...devices]);
      setDeviceName("GPS Tracker");
      setDeviceId("");
      
      toast({
        title: "Device registered",
        description: "Your tracker has been registered.",
      });
    } catch (err: any) {
      console.error("Error creating device:", err);
      const isDuplicate = err?.code === '23505';
      toast({
        title: isDuplicate ? "Device Already Registered" : "Error",
        description: isDuplicate 
          ? "This device ID is already registered. Check your devices list below."
          : "Failed to create device",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from("gps_devices")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;

      setDevices(devices.filter(d => d.id !== deviceId));
      
      toast({
        title: "Device deleted",
        description: "The device has been removed",
      });
    } catch (err) {
      console.error("Error deleting device:", err);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
      toast({
        title: "Copied",
        description: "Device ID copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatus = (device: GPSDevice) => {
    // MUST have valid GPS coordinates to be considered "live" - no fake status
    const hasValidGPS = device.last_latitude !== null && device.last_longitude !== null;
    if (!hasValidGPS || !device.last_seen_at) return 'offline';
    
    const lastSeen = new Date(device.last_seen_at);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
    
    // Only show "Live" if we have real GPS data within 30 seconds
    if (diffSeconds < 30) return 'active';
    if (diffSeconds < 120) return 'recent';
    return 'offline';
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <InstructorPortalLayout>
     <div className="min-h-[calc(100dvh-120px)] bg-background -mx-4 -mt-4 p-4">
      <div className="space-y-6 max-w-2xl mx-auto">
       {/* Active Provider Banner */}
        {activeProvider && (
          <div className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Satellite className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Connected Tracker</span>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 capitalize">
                    {activeProvider}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your {activeProvider} tracker is the active tracking provider
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GPS Tracker Connection */}

        {/* Live connection status when tracker is active */}
        {position.isActive && (
          <GPSConnectionStatusCard
            deviceName="GPS Tracker"
            isConnected={position.isActive}
            lastSeenLabel={position.lastSeenAt ? formatDistanceToNow(new Date(position.lastSeenAt), { addSuffix: true }) : "Never"}
            speedKmh={position.speedKmh}
            roadName={position.roadName}
          />
        )}


        {/* Pre-Flight Checks */}
        {instructor?.id && (
          <PreFlightChecks 
            instructorId={instructor.id}
            onAllPassed={() => {
              if (devices.length > 0) {
                navigate("/instructor/tracking");
              }
            }}
            onSkip={() => {
              if (devices.length > 0) {
                navigate("/instructor/tracking");
              }
            }}
          />
        )}

        {/* Register New Device */}
        <div className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Register a Tracker
          </h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g. My Car Tracker"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                placeholder="Enter your tracker's device ID"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the unique identifier from your Radius tracker
              </p>
            </div>
            <Button
              onClick={createDevice}
              disabled={isCreating || !deviceId.trim()}
              className="w-full"
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Cpu className="h-4 w-4 mr-2" />
              )}
              Register Device
            </Button>
          </div>
        </div>

        {/* Devices List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Devices</h2>
          
          {devices.length === 0 ? (
            <div className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] py-8 text-center text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No devices configured yet</p>
              <p className="text-sm">Your GPS tracker will appear here automatically</p>
            </div>
          ) : (
            devices.map((device) => (
              <div key={device.id} className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{device.device_name}</span>
                        {(() => {
                          const status = getConnectionStatus(device);
                          if (status === 'active') {
                            return (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                <span className="relative flex h-2 w-2 mr-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Live
                              </Badge>
                            );
                          } else if (status === 'recent') {
                            return (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                <Wifi className="h-3 w-3 mr-1" />
                                Recently Active
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge variant="secondary">
                                <WifiOff className="h-3 w-3 mr-1" />
                                Offline
                              </Badge>
                            );
                          }
                        })()}
                        {device.current_session_id && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Tracking
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {device.device_identifier}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(device.device_identifier, device.id)}
                        >
                          {copiedId === device.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {device.last_seen_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last seen: {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                          {device.last_speed_kmh !== null && (
                            <> · {(device.last_speed_kmh * 0.621371).toFixed(0)} mph</>
                          )}
                        </p>
                      )}
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Device?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "{device.device_name}" and stop any active tracking.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDevice(device.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </InstructorPortalLayout>
  );
}
