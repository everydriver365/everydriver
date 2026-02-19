import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { loadGoogleMaps, fetchGoogleMapsKey, kmhToMph } from "@/lib/googleMapsLoader";
import { haversineKm, moveAlongBearing } from "@/hooks/useInterpolatedPosition";

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

const DEFAULT_CENTER = { lat: 52.48, lng: -1.89 };

function getVehicleStatus(device: GpsDevice): "moving" | "idle" | "parked" {
  if (!device.last_seen_at) return "parked";
  const age = Date.now() - new Date(device.last_seen_at).getTime();
  if (age > 300000) return "parked";
  if ((device.last_speed_kmh ?? 0) > 3) return "moving";
  if (device.last_ignition_status) return "idle";
  return "parked";
}

function statusColor(status: "moving" | "idle" | "parked") {
  if (status === "moving") return "#10b981";
  if (status === "idle") return "#f59e0b";
  return "#9ca3af";
}

function buildInfoContent(device: GpsDevice) {
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
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const devicesRef = useRef<GpsDevice[]>([]);
  const deviceTimestamps = useRef<Map<string, number>>(new Map());
  const hasFittedBounds = useRef(false);

  // Init Google Map
  useEffect(() => {
    if (!isVisible || !mapDivRef.current || mapRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const apiKey = await fetchGoogleMapsKey();
        if (!apiKey || cancelled) return;
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const w = window as any;
        const map = new w.google.maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapRef.current = map;
        setMapsReady(true);
      } catch {
        // fail silently
      }
    }

    init();
    return () => { cancelled = true; };
  }, [isVisible]);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from("gps_devices")
      .select("id, device_name, last_latitude, last_longitude, last_heading, last_speed_kmh, last_road_name, last_seen_at, last_ignition_status, is_active")
      .eq("instructor_id", instructorId);
    if (data) {
      const now = Date.now();
      data.forEach(d => deviceTimestamps.current.set(d.id, now));
      devicesRef.current = data;
      setDevices(data);
    }
    setLoading(false);
  }, [instructorId]);

  // Poll + realtime
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
        const updated = payload.new as GpsDevice;
        deviceTimestamps.current.set(updated.id, Date.now());
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
  }, [instructorId, fetchDevices]);

  // Update markers on Google Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapsReady) return;
    const w = window as any;

    const validDevices = devices.filter(d => d.last_latitude && d.last_longitude);

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!validDevices.find(d => d.id === id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
        infoWindowsRef.current.get(id)?.close();
        infoWindowsRef.current.delete(id);
      }
    });

    // Upsert markers
    validDevices.forEach(device => {
      const pos = { lat: device.last_latitude!, lng: device.last_longitude! };
      const status = getVehicleStatus(device);
      const color = statusColor(status);
      const icon = {
        path: w.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillOpacity: 1,
        fillColor: color,
        strokeColor: "white",
        strokeWeight: 3,
      };

      const existing = markersRef.current.get(device.id);
      if (existing) {
        existing.setPosition(pos);
        existing.setIcon(icon);
        const iw = infoWindowsRef.current.get(device.id);
        if (iw) iw.setContent(buildInfoContent(device));
      } else {
        const marker = new w.google.maps.Marker({ position: pos, map, icon });
        const infoWindow = new w.google.maps.InfoWindow({ content: buildInfoContent(device) });
        marker.addListener("click", () => {
          // Close all other info windows
          infoWindowsRef.current.forEach(iw => iw.close());
          infoWindow.open(map, marker);
        });
        markersRef.current.set(device.id, marker);
        infoWindowsRef.current.set(device.id, infoWindow);
      }
    });

    // Fit bounds only on first load
    if (validDevices.length > 0 && !hasFittedBounds.current) {
      hasFittedBounds.current = true;
      const bounds = new w.google.maps.LatLngBounds();
      validDevices.forEach(d => bounds.extend({ lat: d.last_latitude!, lng: d.last_longitude! }));
      map.fitBounds(bounds, 40);
      w.google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 15) map.setZoom(15);
      });
    }
  }, [devices, mapsReady]);

  // Interpolation loop — bearing-based smooth movement
  useEffect(() => {
    const interval = setInterval(() => {
      devicesRef.current.forEach(device => {
        const marker = markersRef.current.get(device.id);
        if (!marker || !device.last_latitude || !device.last_longitude) return;

        const speed = device.last_speed_kmh ?? 0;
        if (speed < 3) return;

        const anchorTs = deviceTimestamps.current.get(device.id);
        if (!anchorTs) return;

        const elapsed = Math.min((Date.now() - anchorTs) / 1000, 15);
        const distKm = (speed / 3600) * elapsed;
        const heading = device.last_heading ?? 0;
        const [lat, lng] = moveAlongBearing(device.last_latitude, device.last_longitude, heading, distKm);
        marker.setPosition({ lat, lng });
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
        <div ref={mapDivRef} className="h-[500px] w-full" style={{ background: "#f2f2f2" }} />

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
    </div>
  );
}
