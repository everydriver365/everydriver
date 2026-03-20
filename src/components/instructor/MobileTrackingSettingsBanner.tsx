import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Settings, 
  ChevronRight,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";

interface MobileTrackingSettingsBannerProps {
  instructorId: string;
  className?: string;
  compact?: boolean;
}

interface TrackingStatus {
  isLinked: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  trackerName: string | null;
  hasValidGPS: boolean;
}

export function MobileTrackingSettingsBanner({ 
  instructorId, 
  className,
  compact = false 
}: MobileTrackingSettingsBannerProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProvider } = useActiveTrackingProvider(instructorId);

  // Hide this GPSgate-specific banner when a higher-priority provider is active
  if (activeProvider === "geotab" || activeProvider === "quartix") {
    return null;
  }

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Check instructor's GPSgate link
        const { data: instructorData } = await supabase
          .from("instructors")
          .select("gpsgate_user_id, gpsgate_username")
          .eq("id", instructorId)
          .single();

        // Check device status
        const { data: deviceData } = await supabase
          .from("gps_devices")
          .select("last_seen_at, last_latitude, last_longitude, gpsgate_user_id, device_name")
          .eq("instructor_id", instructorId)
          .order("last_seen_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const isLinked = !!(instructorData?.gpsgate_user_id || deviceData?.gpsgate_user_id);
        const hasValidGPS = !!(deviceData?.last_latitude && deviceData?.last_longitude);
        
        let isOnline = false;
        if (deviceData?.last_seen_at && hasValidGPS) {
          const lastSeen = new Date(deviceData.last_seen_at);
          const now = new Date();
          const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
          isOnline = diffSeconds < 120; // 2 minutes
        }

        setStatus({
          isLinked,
          isOnline,
          lastSeenAt: deviceData?.last_seen_at || null,
          trackerName: instructorData?.gpsgate_username || deviceData?.device_name || null,
          hasValidGPS,
        });
      } catch (error) {
        console.error("Error fetching tracking status:", error);
        setStatus({
          isLinked: false,
          isOnline: false,
          lastSeenAt: null,
          trackerName: null,
          hasValidGPS: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [instructorId]);

  if (isLoading) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const goToSettings = () => navigate("/instructor/settings/gps");

  // Compact version - just a status indicator
  if (compact) {
    return (
      <button
        onClick={goToSettings}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          status?.isOnline && status?.hasValidGPS
            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
            : status?.isLinked
            ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80",
          className
        )}
      >
        {status?.isOnline && status?.hasValidGPS ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            GPS Live
          </>
        ) : status?.isLinked ? (
          <>
            <WifiOff className="h-3 w-3" />
            GPS Offline
          </>
        ) : (
          <>
            <AlertTriangle className="h-3 w-3" />
            Setup GPS
          </>
        )}
      </button>
    );
  }

  // Full banner version
  return (
    <Card 
      className={cn(
        "border transition-colors cursor-pointer hover:bg-muted/30",
        !status?.isLinked && "border-dashed border-amber-500/50 bg-amber-500/5",
        className
      )}
      onClick={goToSettings}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            status?.isOnline && status?.hasValidGPS
              ? "bg-green-500/10"
              : status?.isLinked
              ? "bg-amber-500/10"
              : "bg-muted"
          )}>
            <Smartphone className={cn(
              "h-5 w-5",
              status?.isOnline && status?.hasValidGPS
                ? "text-green-600"
                : status?.isLinked
                ? "text-amber-600"
                : "text-muted-foreground"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Mobile GPS Tracking</span>
              {status?.isOnline && status?.hasValidGPS ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                  <span className="relative flex h-1.5 w-1.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
              ) : status?.isLinked ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <WifiOff className="h-2.5 w-2.5 mr-1" />
                  Offline
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600">
                  Not Linked
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {status?.isLinked 
                ? status.trackerName || "GPSgate Tracker linked"
                : "Link your GPSgate Tracker app"
              }
            </p>
          </div>

          {/* Action */}
          <Button variant="ghost" size="sm" className="shrink-0 h-8 px-2">
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Setup</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
