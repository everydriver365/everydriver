import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Smartphone, 
  Copy, 
  Check, 
  Wifi, 
  WifiOff,
  RefreshCw,
  ExternalLink,
  Settings,
  Trash2
} from "lucide-react";
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

interface TraccarDevice {
  id: string;
  device_identifier: string;
  device_name: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  current_session_id: string | null;
}

export default function InstructorTraccarSetup() {
  const { instructor, loading } = useInstructorAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("My Phone");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/traccar-webhook`;

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

  const fetchDevices = async () => {
    if (!instructor?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("traccar_devices")
        .select("*")
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });

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

  const generateDeviceId = () => {
    const prefix = instructor?.id?.substring(0, 8) || "INS";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `D365_${prefix}_${random}`;
  };

  const createDevice = async () => {
    if (!instructor?.id) return;
    
    setIsCreating(true);
    try {
      const deviceIdentifier = generateDeviceId();
      
      const { data, error } = await supabase
        .from("traccar_devices")
        .insert({
          device_identifier: deviceIdentifier,
          instructor_id: instructor.id,
          device_name: deviceName,
        })
        .select()
        .single();

      if (error) throw error;

      setDevices([data, ...devices]);
      setDeviceName("My Phone");
      
      toast({
        title: "Device created",
        description: "Your device ID has been generated. Configure Traccar Client with these settings.",
      });
    } catch (err) {
      console.error("Error creating device:", err);
      toast({
        title: "Error",
        description: "Failed to create device",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from("traccar_devices")
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

  const copyToClipboard = async (text: string, type: "id" | "url", deviceId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "id" && deviceId) {
        setCopiedId(deviceId);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
      toast({
        title: "Copied",
        description: `${type === "id" ? "Device ID" : "Server URL"} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const isConnected = (device: TraccarDevice) => {
    if (!device.last_seen_at) return false;
    const lastSeen = new Date(device.last_seen_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
    return diffMinutes < 2; // Connected if seen within last 2 minutes
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/instructor/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Traccar GPS Setup</h1>
            <p className="text-sm text-muted-foreground">Configure external GPS tracking</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Download <strong>Traccar Client</strong> from your app store</li>
              <li>Create a device below to get your unique Device ID</li>
              <li>Configure Traccar Client with the Device ID and Server URL</li>
              <li>Start tracking from the Traccar Session page when teaching</li>
            </ol>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://apps.apple.com/app/traccar-client/id843156974" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  iOS App
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://play.google.com/store/apps/details?id=org.traccar.client" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Android App
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Server URL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Server URL</CardTitle>
            <CardDescription>Use this URL in Traccar Client settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, "url")}
              >
                {copiedUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Set frequency to <strong>5 seconds</strong> and distance to <strong>10 meters</strong>
            </p>
          </CardContent>
        </Card>

        {/* Create Device */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Device</CardTitle>
            <CardDescription>Create a device ID for your phone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., My iPhone"
              />
            </div>
            <Button onClick={createDevice} disabled={isCreating}>
              {isCreating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4 mr-2" />
              )}
              Generate Device ID
            </Button>
          </CardContent>
        </Card>

        {/* Devices List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Your Devices</h2>
          
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No devices configured yet</p>
                <p className="text-sm">Create a device above to get started</p>
              </CardContent>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{device.device_name}</span>
                        {isConnected(device) ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Wifi className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                        )}
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
                          onClick={() => copyToClipboard(device.device_identifier, "id", device.id)}
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
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Traccar Settings Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Traccar Client Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Device identifier</p>
                <p className="text-muted-foreground">Your Device ID from above</p>
              </div>
              <div>
                <p className="font-medium">Server URL</p>
                <p className="text-muted-foreground break-all">{webhookUrl}</p>
              </div>
              <div>
                <p className="font-medium">Frequency</p>
                <p className="text-muted-foreground">5 seconds</p>
              </div>
              <div>
                <p className="font-medium">Distance</p>
                <p className="text-muted-foreground">10 meters</p>
              </div>
              <div>
                <p className="font-medium">Angle</p>
                <p className="text-muted-foreground">10 degrees</p>
              </div>
              <div>
                <p className="font-medium">Offline buffering</p>
                <p className="text-muted-foreground">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
