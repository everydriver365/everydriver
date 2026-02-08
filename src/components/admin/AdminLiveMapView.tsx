import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  RefreshCw, 
  Car, 
  Clock, 
  Navigation, 
  Phone,
  Gauge,
  Users,
  Wifi,
  WifiOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { kmhToMph } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

interface InstructorDevice {
  id: string;
  device_name: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_speed_kmh: number | null;
  last_heading: number | null;
  last_seen_at: string | null;
  last_road_name: string | null;
  last_ignition_status: boolean | null;
  is_active: boolean;
  instructor_id: string;
  instructors: {
    name: string;
    phone: string | null;
  };
}

// Create custom marker icon
const createMarkerIcon = (isOnline: boolean, heading?: number | null) => {
  const color = isOnline ? "#22c55e" : "#6b7280";
  const rotation = heading ?? 0;
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M12 2L19 21L12 17L5 21L12 2Z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Component to fit map bounds to markers
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [positions, map]);
  
  return null;
}

export function AdminLiveMapView() {
  const [devices, setDevices] = useState<InstructorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDevices = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("gps_devices")
        .select(`
          id, device_name, last_latitude, last_longitude,
          last_speed_kmh, last_heading, last_seen_at, last_road_name,
          last_ignition_status, is_active, instructor_id,
          instructors!inner (name, phone)
        `)
        .eq("is_active", true)
        .not("last_latitude", "is", null)
        .not("last_longitude", "is", null);

      if (fetchError) throw fetchError;
      
      setDevices(data as unknown as InstructorDevice[] || []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError("Failed to load instructor positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin-gps-devices")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gps_devices",
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // Online if seen in last 5 minutes
  };

  const onlineCount = devices.filter(d => isOnline(d.last_seen_at)).length;
  
  const positions: [number, number][] = useMemo(() => 
    devices
      .filter(d => d.last_latitude && d.last_longitude)
      .map(d => [d.last_latitude!, d.last_longitude!]),
    [devices]
  );

  // UK center as default
  const defaultCenter: [number, number] = [52.4862, -1.8904];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Instructor Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Instructor Map
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {devices.length} tracked
              </Badge>
              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                <Wifi className="h-3 w-3" />
                {onlineCount} online
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDevices}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
            <MapPin className="h-12 w-12 mb-4 opacity-50" />
            <p>No active GPS devices found</p>
            <p className="text-sm">Instructors need to link their Every Driver GPS Gate accounts</p>
          </div>
        ) : (
          <div className="h-[500px] rounded-lg overflow-hidden border">
            <MapContainer
              center={positions.length > 0 ? positions[0] : defaultCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url={getMapTileUrl()}
                attribution={getMapAttribution()}
              />
              
              {positions.length > 0 && <FitBounds positions={positions} />}
              
              {devices.map((device) => {
                if (!device.last_latitude || !device.last_longitude) return null;
                
                const online = isOnline(device.last_seen_at);
                
                return (
                  <Marker
                    key={device.id}
                    position={[device.last_latitude, device.last_longitude]}
                    icon={createMarkerIcon(online, device.last_heading)}
                  >
                    <Popup>
                      <div className="min-w-[200px] space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">
                            {device.instructors?.name || "Unknown Instructor"}
                          </h3>
                          {online ? (
                            <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                              <Wifi className="h-2.5 w-2.5 mr-1" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              <WifiOff className="h-2.5 w-2.5 mr-1" />
                              Offline
                            </Badge>
                          )}
                        </div>
                        
                        {device.instructors?.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {device.instructors.phone}
                          </div>
                        )}
                        
                        {device.last_road_name && (
                          <div className="flex items-center gap-1 text-xs">
                            <Navigation className="h-3 w-3 text-muted-foreground" />
                            {device.last_road_name}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3 text-muted-foreground" />
                            {Math.round(kmhToMph(device.last_speed_kmh || 0))} mph
                          </span>
                          {device.last_seen_at && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-[10px] text-muted-foreground pt-1 border-t">
                          {device.device_name || `Device`}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Online (last 5 min)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            Offline
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
