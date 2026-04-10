import { useState, useEffect } from "react";
import { 
  MapPin, 
  Settings, 
  Smartphone, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable" | "checking";

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  isSafari: boolean;
  isChrome: boolean;
  deviceName: string;
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isChrome = /Chrome/.test(ua);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;
  
  let deviceName = "your device";
  if (isIOS) deviceName = "iPhone/iPad";
  else if (isAndroid) deviceName = "Android device";
  
  return { isIOS, isAndroid, isPWA, isSafari, isChrome, deviceName };
}

export function GPSPermissionHelper() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("checking");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [testResult, setTestResult] = useState<{ accuracy: number | null; error: string | null } | null>(null);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setIsChecking(true);
    setPermissionStatus("checking");
    
    if (!("geolocation" in navigator)) {
      setPermissionStatus("unavailable");
      setIsChecking(false);
      return;
    }

    try {
      // Check via Permissions API first
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "geolocation" });
        setPermissionStatus(result.state as PermissionStatus);
        
        // Listen for changes
        result.addEventListener("change", () => {
          setPermissionStatus(result.state as PermissionStatus);
        });
      } else {
        // Fallback: try to get position
        setPermissionStatus("prompt");
      }
    } catch {
      setPermissionStatus("prompt");
    }
    
    setIsChecking(false);
  };

  const testGPS = () => {
    setIsChecking(true);
    setTestResult(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTestResult({ 
          accuracy: position.coords.accuracy, 
          error: null 
        });
        setPermissionStatus("granted");
        setIsChecking(false);
      },
      (error) => {
        let errorMsg = "Unknown error";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Permission denied - please enable location access";
            setPermissionStatus("denied");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "GPS signal unavailable - try moving outdoors";
            break;
          case error.TIMEOUT:
            errorMsg = "GPS timeout - signal is weak";
            break;
        }
        setTestResult({ accuracy: null, error: errorMsg });
        setIsChecking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case "granted":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "denied":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "prompt":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "checking":
        return <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case "granted":
        return "Location enabled";
      case "denied":
        return "Location blocked";
      case "prompt":
        return "Permission needed";
      case "checking":
        return "Checking...";
      default:
        return "Not available";
    }
  };

  const getStatusColor = () => {
    switch (permissionStatus) {
      case "granted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "denied":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "prompt":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const IOSInstructions = () => (
    <div className="space-y-4">
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-none">
        <p className="text-sm text-primary font-medium">
          {deviceInfo?.isPWA 
            ? "You're using Drive365 as an installed app" 
            : "You're using Drive365 in Safari"}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 1: Open Settings</h4>
        <div className="flex items-center gap-3 p-3 bg-muted rounded-none">
          <div className="h-10 w-10 rounded-none bg-gray-500 flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Settings</p>
            <p className="text-xs text-muted-foreground">Open your iPhone Settings app</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 2: Go to Privacy & Security</h4>
        <div className="flex items-center justify-between p-3 bg-muted rounded-none">
          <span className="font-medium">Privacy & Security</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 3: Tap Location Services</h4>
        <div className="flex items-center justify-between p-3 bg-muted rounded-none">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-medium">Location Services</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 4: Enable Location Services</h4>
        <div className="p-3 bg-muted rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Location Services</span>
            <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1">
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Make sure this toggle is ON (green)</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 5: Find {deviceInfo?.isPWA ? "Drive365" : "Safari"}</h4>
        <div className="p-3 bg-muted rounded-none space-y-3">
          <p className="text-sm text-muted-foreground">
            Scroll down and tap on <strong>{deviceInfo?.isPWA ? "Drive365" : "Safari"}</strong>
          </p>
          <div className="flex items-center justify-between py-2 border-t">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-none bg-primary flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-medium">{deviceInfo?.isPWA ? "Drive365" : "Safari"}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 6: Set Location Access</h4>
        <div className="p-3 bg-muted rounded-none space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary" />
              <span className="text-sm font-medium">While Using the App</span>
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm">Ask Next Time</span>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              <span className="text-sm">Never</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          Step 7: Enable Precise Location
        </h4>
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Precise Location</span>
              <p className="text-xs text-muted-foreground mt-0.5">Required for accurate tracking</p>
            </div>
            <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1">
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AndroidInstructions = () => (
    <div className="space-y-4">
      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-none">
        <p className="text-sm text-green-600 font-medium">
          {deviceInfo?.isPWA 
            ? "You're using Drive365 as an installed app" 
            : "You're using Drive365 in Chrome"}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 1: Open Settings</h4>
        <div className="flex items-center gap-3 p-3 bg-muted rounded-none">
          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Settings</p>
            <p className="text-xs text-muted-foreground">Open your phone's Settings</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 2: Go to Location</h4>
        <div className="flex items-center justify-between p-3 bg-muted rounded-none">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-medium">Location</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 3: Turn on Location</h4>
        <div className="p-3 bg-muted rounded-none">
          <div className="flex items-center justify-between">
            <span className="font-medium">Use location</span>
            <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1">
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Step 4: App Permissions</h4>
        <div className="p-3 bg-muted rounded-none space-y-2">
          <p className="text-sm">Go to <strong>App permissions</strong> → <strong>{deviceInfo?.isPWA ? "Drive365" : "Chrome"}</strong></p>
          <p className="text-sm text-muted-foreground">Select <strong>"Allow only while using the app"</strong></p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          Step 5: Use Precise Location
        </h4>
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Use precise location</span>
              <p className="text-xs text-muted-foreground mt-0.5">Required for accurate tracking</p>
            </div>
            <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1">
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${permissionStatus === 'denied' ? 'border-red-500/50 text-red-600' : ''}`}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
          <span className="sm:hidden">GPS</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            GPS Location Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card className={`border ${getStatusColor()}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <p className="font-medium">{getStatusText()}</p>
                    <p className="text-xs text-muted-foreground">
                      {deviceInfo?.deviceName} • {deviceInfo?.isPWA ? "PWA" : "Browser"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={checkPermission}
                  disabled={isChecking}
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test GPS Button */}
          <Button 
            onClick={testGPS} 
            disabled={isChecking}
            className="w-full"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing GPS...
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 mr-2" />
                Test GPS Now
              </>
            )}
          </Button>

          {/* Test Result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {testResult.error ? (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-none">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-600">GPS Test Failed</p>
                        <p className="text-sm text-red-600/80">{testResult.error}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-none">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-600">GPS Working!</p>
                        <p className="text-sm text-green-600/80">
                          Accuracy: ±{testResult.accuracy?.toFixed(0)}m
                          {testResult.accuracy && testResult.accuracy <= 30 && " (Excellent)"}
                          {testResult.accuracy && testResult.accuracy > 30 && testResult.accuracy <= 100 && " (Good)"}
                          {testResult.accuracy && testResult.accuracy > 100 && " (Fair - try moving outdoors)"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions based on permission status */}
          {(permissionStatus === "denied" || permissionStatus === "prompt") && (
            <div className="pt-2 border-t">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                How to Enable Location
              </h3>
              
              {deviceInfo?.isIOS ? (
                <IOSInstructions />
              ) : deviceInfo?.isAndroid ? (
                <AndroidInstructions />
              ) : (
                <div className="p-4 bg-muted rounded-none">
                  <p className="text-sm text-muted-foreground">
                    Please enable location access in your browser settings. Look for the location/privacy settings in your browser menu.
                  </p>
                </div>
              )}
            </div>
          )}

          {permissionStatus === "granted" && !testResult && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-none">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-600">Location Access Enabled</p>
                  <p className="text-sm text-green-600/80">
                    GPS tracking should work. Tap "Test GPS Now" to verify the signal quality.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}