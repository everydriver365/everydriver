import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  fetchOsrmRoute, buildPathData, positionAlongPath, haversineKm, moveAlongBearing,
  type PathData,
} from "@/hooks/useInterpolatedPosition";

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
  isVisible?: boolean;
}

const DEFAULT_LAT = 52.48;
const DEFAULT_LNG = -1.89;
const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

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

export function FleetLiveMap({ instructorId, isVisible = false }: FleetLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const devicesRef = useRef<GpsDevice[]>([]);
  const devicePaths = useRef<Map<string, PathData>>(new Map());
  const prevPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const deviceTimestamps = useRef<Map<string, number>>(new Map());

  const fetchDevicesAndRoutes = useCallback(async () => {
    const { data } = await supabase
      .from("gps_devices")
      .select("id, device_name, last_latitude, last_longitude, last_heading, last_speed_kmh, last_road_name, last_seen_at, last_ignition_status, is_active")
      .eq("instructor_id", instructorId);
    if (data) {
      const now = Date.now();
      data.forEach(d => {
        deviceTimestamps.current.set(d.id, now);
        if (d.last_latitude && d.last_longitude) {
          const prev = prevPositions.current.get(d.id);
          const speed = d.last_speed_kmh ?? 0;
          if (prev && speed >= 3) {
            const dist = haversineKm(prev.lat, prev.lng, d.last_latitude, d.last_longitude);
            if (dist > 0.005 && dist < 5) {
              fetchOsrmRoute(prev.lat, prev.lng, d.last_latitude, d.last_longitude).then(route => {
                if (route) devicePaths.current.set(d.id, buildPathData(route));
                else devicePaths.current.delete(d.id);
              });
            } else {
              devicePaths.current.delete(d.id);
            }
          }
          prevPositions.current.set(d.id, { lat: d.last_latitude, lng: d.last_longitude });
        }
      });
      devicesRef.current = data;
      setDevices(data);
    }
    setLoading(false);
  }, [instructorId]);

  // Init map when isVisible becomes true (deterministic, no IntersectionObserver)
  useEffect(() => {
    if (!isVisible || !mapRef.current) return;
    const container = mapRef.current;

    if (mapInstance.current) {
      // Already initialized — just fix tile rendering after tab switch
      requestAnimationFrame(() => {
        mapInstance.current?.invalidateSize();
      });
      return;
    }

    // Delay init to ensure container has layout dimensions after display:none removal
    const raf = requestAnimationFrame(() => {
      const map = L.map(container, {
        center: [DEFAULT_LAT, DEFAULT_LNG],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstance.current = map;
      L.tileLayer(getMapTileUrl(), { maxZoom: 19, attribution: getMapAttribution() }).addTo(map);
      map.zoomControl?.setPosition("topright");
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);
    });

    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  // ResizeObserver for container resizes + cleanup on unmount
  useEffect(() => {
    if (!mapRef.current) return;
    const container = mapRef.current;
    const ro = new ResizeObserver(() => mapInstance.current?.invalidateSize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      mapInstance.current?.remove();
      mapInstance.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Fetch + poll + realtime
  useEffect(() => {
    fetchDevicesAndRoutes();
    const interval = setInterval(fetchDevicesAndRoutes, 10000);

    const channel = supabase
      .channel(`fleet-live-${instructorId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "gps_devices",
        filter: `instructor_id=eq.${instructorId}`,
      }, (payload) => {
        const updated = payload.new as GpsDevice;
        deviceTimestamps.current.set(updated.id, Date.now());

        // Fetch OSRM route for this device
        if (updated.last_latitude && updated.last_longitude) {
          const prev = prevPositions.current.get(updated.id);
          const speed = updated.last_speed_kmh ?? 0;
          if (prev && speed >= 3) {
            const dist = haversineKm(prev.lat, prev.lng, updated.last_latitude, updated.last_longitude);
            if (dist > 0.005 && dist < 5) {
              fetchOsrmRoute(prev.lat, prev.lng, updated.last_latitude, updated.last_longitude).then(route => {
                if (route) devicePaths.current.set(updated.id, buildPathData(route));
                else devicePaths.current.delete(updated.id);
              });
            } else {
              devicePaths.current.delete(updated.id);
            }
          }
          prevPositions.current.set(updated.id, { lat: updated.last_latitude, lng: updated.last_longitude });
        }

        setDevices(prev => {
          const next = prev.map(d => d.id === updated.id ? { ...d, ...updated } as GpsDevice : d);
          devicesRef.current = next;
          return next;
        });
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchDevicesAndRoutes]);

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

  // Interpolation loop — walk along OSRM road geometry or fallback to bearing
  useEffect(() => {
    const interval = setInterval(() => {
      const map = mapInstance.current;
      if (!map) return;

      devicesRef.current.forEach(device => {
        const marker = markersRef.current.get(device.id);
        if (!marker || !device.last_latitude || !device.last_longitude) return;

        const speed = device.last_speed_kmh ?? 0;
        if (speed < 3) return;

        const anchorTs = deviceTimestamps.current.get(device.id);
        if (!anchorTs) return;

        const elapsed = Math.min((Date.now() - anchorTs) / 1000, 15);
        const distKm = (speed / 3600) * elapsed;

        const path = devicePaths.current.get(device.id);
        if (path) {
          const [lat, lng] = positionAlongPath(path, distKm);
          marker.setLatLng([lat, lng]);
        } else {
          const heading = device.last_heading ?? 0;
          const [lat, lng] = moveAlongBearing(device.last_latitude, device.last_longitude, heading, distKm);
          marker.setLatLng([lat, lng]);
        }
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Moving</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Idle</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Parked</span>
        <span className="ml-auto text-[10px]">Auto-refreshes every 10s</span>
      </div>
      <Card className="overflow-hidden relative">
        <div ref={mapRef} className="h-[500px] w-full" style={{ background: "#f2f2f2" }} />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && devices.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 space-y-2">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-center px-4">No GPS devices found. Connect a tracker to see your vehicles here.</p>
          </div>
        )}
      </Card>
      <style>{`.fleet-live-marker{background:transparent!important;border:none!important;}`}</style>
    </div>
  );
}
