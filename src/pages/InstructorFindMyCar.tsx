import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation, Car, MapPin, Clock, RefreshCw, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";

interface DevicePosition {
  id: string;
  device_name: string | null;
  device_identifier: string;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
  last_speed_kmh: number | null;
  last_ignition_status: boolean | null;
  vehicle?: {
    registration: string;
    make: string | null;
    model: string | null;
  } | null;
}

// Custom car marker icon
const carIcon = new L.DivIcon({
  className: "car-marker",
  html: `
    <div style="
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default function InstructorFindMyCar() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const [devices, setDevices] = useState<DevicePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DevicePosition | null>(null);

  const fetchDevices = async () => {
    if (!instructor?.id) return;

    try {
      // Fetch devices with positions
      const { data: deviceData, error } = await supabase
        .from("traccar_devices")
        .select(`
          id,
          device_name,
          device_identifier,
          last_latitude,
          last_longitude,
          last_seen_at,
          last_speed_kmh,
          last_ignition_status,
          vehicle_id
        `)
        .eq("instructor_id", instructor.id);

      if (error) throw error;

      // Fetch linked vehicles
      const vehicleIds = deviceData?.map(d => d.vehicle_id).filter(Boolean) || [];
      let vehiclesMap: Record<string, { registration: string; make: string | null; model: string | null }> = {};

      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("instructor_vehicles")
          .select("id, registration, make, model")
          .in("id", vehicleIds);

        vehicles?.forEach(v => {
          vehiclesMap[v.id] = v;
        });
      }

      const devicesWithVehicles = (deviceData || []).map(d => ({
        ...d,
        vehicle: d.vehicle_id ? vehiclesMap[d.vehicle_id] || null : null,
      }));

      setDevices(devicesWithVehicles);

      // Auto-select first device with position
      const deviceWithPosition = devicesWithVehicles.find(d => d.last_latitude && d.last_longitude);
      if (deviceWithPosition && !selectedDevice) {
        setSelectedDevice(deviceWithPosition);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [instructor?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDevices();
  };

  const openNavigation = (lat: number, lng: number) => {
    // Try Google Maps first, fallback to Apple Maps on iOS
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    const appleMapsUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // Try Apple Maps first on iOS
      window.location.href = appleMapsUrl;
      // Fallback to Google Maps after a short delay
      setTimeout(() => {
        window.open(googleMapsUrl, "_blank");
      }, 500);
    } else {
      window.open(googleMapsUrl, "_blank");
    }
  };

  const devicesWithPosition = devices.filter(d => d.last_latitude && d.last_longitude);
  const hasPosition = selectedDevice?.last_latitude && selectedDevice?.last_longitude;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Find My Car</h1>
              <p className="text-sm text-muted-foreground">
                Locate your vehicle
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Finding your car...</p>
          </div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No GPS devices registered</p>
              <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                Set up a GPS tracker to find your car
              </p>
              <Button onClick={() => navigate("/instructor/settings/traccar")}>
                Add GPS Device
              </Button>
            </CardContent>
          </Card>
        ) : devicesWithPosition.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-orange-500/50 mb-3" />
              <p className="font-medium text-muted-foreground">No location data</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Your GPS device hasn't reported a position yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Device Selector (if multiple) */}
            {devicesWithPosition.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {devicesWithPosition.map(device => (
                  <Button
                    key={device.id}
                    variant={selectedDevice?.id === device.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDevice(device)}
                    className="shrink-0"
                  >
                    <Car className="h-4 w-4 mr-1.5" />
                    {device.vehicle?.registration || device.device_name || "Device"}
                  </Button>
                ))}
              </div>
            )}

            {/* Map */}
            {hasPosition && (
              <Card className="overflow-hidden">
                <div className="h-64 relative">
                  <MapContainer
                    center={[selectedDevice.last_latitude!, selectedDevice.last_longitude!]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                  >
                    <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
                    <Marker
                      position={[selectedDevice.last_latitude!, selectedDevice.last_longitude!]}
                      icon={carIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong>{selectedDevice.vehicle?.registration || "Your Car"}</strong>
                          {selectedDevice.vehicle && (
                            <p className="text-sm text-muted-foreground">
                              {selectedDevice.vehicle.make} {selectedDevice.vehicle.model}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </Card>
            )}

            {/* Vehicle Info Card */}
            {selectedDevice && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="h-4 w-4" />
                    {selectedDevice.vehicle?.registration || selectedDevice.device_name || "Vehicle Location"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle details */}
                  {selectedDevice.vehicle && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDevice.vehicle.make} {selectedDevice.vehicle.model}
                    </p>
                  )}

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    {selectedDevice.last_seen_at && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(selectedDevice.last_seen_at), { addSuffix: true })}
                      </Badge>
                    )}
                    {selectedDevice.last_ignition_status !== null && (
                      <Badge 
                        variant="secondary" 
                        className={selectedDevice.last_ignition_status ? "bg-green-500/10 text-green-600" : ""}
                      >
                        {selectedDevice.last_ignition_status ? "Ignition On" : "Ignition Off"}
                      </Badge>
                    )}
                    {selectedDevice.last_speed_kmh !== null && selectedDevice.last_speed_kmh > 0 && (
                      <Badge variant="secondary">
                        {Math.round(selectedDevice.last_speed_kmh * 0.621371)} mph
                      </Badge>
                    )}
                  </div>

                  {/* Coordinates */}
                  {hasPosition && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="font-mono text-xs">
                        {selectedDevice.last_latitude!.toFixed(6)}, {selectedDevice.last_longitude!.toFixed(6)}
                      </span>
                    </div>
                  )}

                  {/* Navigate Button */}
                  {hasPosition && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => openNavigation(selectedDevice.last_latitude!, selectedDevice.last_longitude!)}
                    >
                      <Navigation className="h-5 w-5 mr-2" />
                      Navigate to Car
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
