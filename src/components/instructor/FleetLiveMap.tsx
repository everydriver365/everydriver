import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GpsDevice {
  id: string;
  device_name: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_heading: number | null;
  last_speed_kmh: number | null;
  last_road_name: string | null;
  last_seen_at: string | null;
  last_ignition_status: boolean | null;
  is_active: boolean | null;
}

interface FleetLiveMapProps {
  instructorId: string;
}

const DEFAULT_LAT = 52.48;
const DEFAULT_LNG = -1.89;

function getVehicleStatus(device: GpsDevice): "moving" | "idle" | "parked" {
  if (!device.last_seen_at) return "parked";
  const age = Date.now() - new Date(device.last_seen_at).getTime();
  if (age > 300000) return "parked"; // >5 min
  if ((device.last_speed_kmh ?? 0) > 3) return "moving";
  if (device.last_ignition_status) return "idle";
  return "parked";
}

function statusColor(status: "moving" | "idle" | "parked") {
  if (status === "moving") return "#10b981";
  if (status === "idle") return "#f59e0b";
  return "#9ca3af";
}

function kmhToMph(kmh: number | null) {
  if (!kmh) return 0;
  return Math.round(kmh * 0.621371);
}

function buildMarkerHtml(device: GpsDevice) {
  const status = getVehicleStatus(device);
  const color = statusColor(status);
  return `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${color};box-shadow:0 3px 12px rgba(0,0,0,0.25);"></div>
    <div style="position:relative;width:22px;height:22px;z-index:1;">
      <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>
  </div>`;
}

function buildPopupHtml(device: GpsDevice) {
  const status = getVehicleStatus(device);
  const mph = kmhToMph(device.last_speed_kmh);
  const name = device.device_name || "Vehicle";
  const road = device.last_road_name || "Unknown road";
  const lastSeen = device.last_seen_at
    ? formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })
    : "N/A";
  const ignition = device.last_ignition_status ? "On" : "Off";
  const lat = device.last_latitude;
  const lng = device.last_longitude;
  const navUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : "#";

  return `<div style="min-width:180px;font-family:system-ui,sans-serif;">
    <div style="font-weight:600;font-size:14px;margin-bottom:6px;">${name}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor(status)};"></span>
      <span style="font-size:12px;text-transform:capitalize;">${status}</span>
    </div>
    <div style="font-size:12px;color:#666;line-height:1.6;">
      <div>🚗 ${mph} mph</div>
      <div>📍 ${road}</div>
      <div>🔑 Ignition: ${ignition}</div>
      <div>🕐 ${lastSeen}</div>
    </div>
    ${lat && lng ? `<a href="${navUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:4px 10px;background:#3b82f6;color:white;border-radius:6px;font-size:12px;text-decoration:none;">Navigate to</a>` : ""}
  </div>`;
}

export function FleetLiveMap({ instructorId }: FleetLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from("gps_devices")
      .select("id, device_name, last_latitude, last_longitude, last_heading, last_speed_kmh, last_road_name, last_seen_at, last_ignition_status, is_active")
      .eq("instructor_id", instructorId);
    if (data) setDevices(data);
    setLoading(false);
  }, [instructorId]);

  // Init map - use IntersectionObserver to detect when tab becomes visible
  useEffect(() => {
    if (!mapRef.current) return;
    const container = mapRef.current;
    let map: L.Map | null = null;

    const initMap = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
        return;
      }
      map = L.map(container, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstance.current = map;
      L.tileLayer(getMapTileUrl(), { maxZoom: 19, attribution: getMapAttribution() }).addTo(map);
      map.zoomControl?.setPosition("topright");
      // Multiple invalidations to handle rendering delays
      setTimeout(() => map?.invalidateSize(), 100);
      setTimeout(() => map?.invalidateSize(), 400);
      setTimeout(() => map?.invalidateSize(), 1000);
    };

    // Use IntersectionObserver to detect visibility (handles Radix tabs display:none)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Small delay to ensure container has non-zero dimensions after tab switch
          setTimeout(() => {
            requestAnimationFrame(() => {
              initMap();
            });
          }, 50);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const ro = new ResizeObserver(() => mapInstance.current?.invalidateSize());
    ro.observe(container);

    return () => {
      observer.disconnect();
      ro.disconnect();
      mapInstance.current?.remove();
      mapInstance.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Fetch + poll + realtime
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);

    const channel = supabase
      .channel(`fleet-live-${instructorId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "gps_devices",
        filter: `instructor_id=eq.${instructorId}`,
      }, (payload) => {
        setDevices(prev => prev.map(d => d.id === (payload.new as GpsDevice).id ? { ...d, ...payload.new } as GpsDevice : d));
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchDevices]);

  // Update markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const validDevices = devices.filter(d => d.last_latitude && d.last_longitude);

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!validDevices.find(d => d.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Upsert markers
    validDevices.forEach(device => {
      const lat = device.last_latitude!;
      const lng = device.last_longitude!;
      const icon = L.divIcon({
        html: buildMarkerHtml(device),
        className: "fleet-live-marker",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const existing = markersRef.current.get(device.id);
      if (existing) {
        existing.setLatLng([lat, lng]);
        existing.setIcon(icon);
        existing.setPopupContent(buildPopupHtml(device));
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(buildPopupHtml(device));
        markersRef.current.set(device.id, marker);
      }
    });

    // Fit bounds
    if (validDevices.length > 0) {
      const bounds = L.latLngBounds(validDevices.map(d => [d.last_latitude!, d.last_longitude!]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [devices]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-2">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No GPS devices found. Connect a tracker to see your vehicles here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Moving</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Idle</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Parked</span>
        <span className="ml-auto text-[10px]">Auto-refreshes every 10s</span>
      </div>
      <Card className="overflow-hidden">
        <div ref={mapRef} className="h-[500px] w-full" style={{ background: "#f2f2f2" }} />
      </Card>
      <style>{`.fleet-live-marker{background:transparent!important;border:none!important;}`}</style>
    </div>
  );
}
