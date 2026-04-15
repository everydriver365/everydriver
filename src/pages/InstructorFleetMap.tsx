import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";
import { fetchGoogleMapsKey, loadGoogleMaps, kmhToMph } from "@/lib/googleMapsLoader";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Maximize, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface FleetDevice {
  id: string;
  device_name: string | null;
  device_identifier: string;
  instructor_id?: string;
  last_latitude: number | null;
  last_longitude: number | null;
  last_speed_kmh: number | null;
  last_heading: number | null;
  last_ignition_status: boolean | null;
  last_road_name: string | null;
  last_speed_limit_kmh: number | null;
  last_is_speeding: boolean | null;
  last_seen_at: string | null;
  last_heartbeat_at: string | null;
  is_active: boolean;
  _instructor_name?: string;
}

function isSignalLost(device: FleetDevice): boolean {
  if (!device.last_heartbeat_at) return true;
  return (Date.now() - new Date(device.last_heartbeat_at).getTime()) > 60_000;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diffS = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffS < 5) return "Just now";
  if (diffS < 60) return `${diffS}s ago`;
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  return `${Math.floor(diffS / 3600)}h ago`;
}

function createArrowSvg(heading: number, color: string, pulse: boolean): string {
  const rotation = heading || 0;
  const pulseCircle = pulse
    ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"><animate attributeName="r" from="14" to="22" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.5" to="0" dur="1s" repeatCount="indefinite"/></circle>`
    : "";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${pulseCircle}<g transform="rotate(${rotation} 16 16)"><polygon points="16,4 24,26 16,20 8,26" fill="${color}" stroke="white" stroke-width="1.5"/></g></svg>`)}`;
}

export default function InstructorFleetMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isColleagueMode = searchParams.get("mode") === "colleagues";
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id ?? null;
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const devicesRef = useRef<FleetDevice[]>([]);
  const [showSignalLost, setShowSignalLost] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const prevSpeedingRef = useRef<Map<string, boolean>>(new Map());
  const [colleagueIds, setColleagueIds] = useState<string[] | null>(null);

  // Keep devicesRef in sync with latest state for closure-safe access
  useEffect(() => { devicesRef.current = devices; }, [devices]);

  // Fetch colleague IDs for school filtering
  useEffect(() => {
    if (!isColleagueMode || !instructorId) {
      setColleagueIds(null);
      return;
    }
    (async () => {
      // Get my schools
      const { data: mySchools } = await supabase
        .from("school_instructors")
        .select("school_id")
        .eq("instructor_id", instructorId) as any;

      if (!mySchools?.length) {
        setColleagueIds([]);
        return;
      }

      const schoolIds = mySchools.map((s: any) => s.school_id);

      // Get all instructor IDs in those schools
      const { data: members } = await supabase
        .from("school_instructors")
        .select("instructor_id")
        .in("school_id", schoolIds) as any;

      const ids = [...new Set((members || []).map((m: any) => m.instructor_id))] as string[];
      setColleagueIds(ids);
    })();
  }, [isColleagueMode, instructorId]);

  // Fetch initial devices
  useEffect(() => {
    if (!instructorId) return;
    // In colleague mode, wait for colleagueIds to resolve
    if (isColleagueMode && colleagueIds === null) return;

    (async () => {
      let query = supabase
        .from("gps_devices")
        .select("id, device_name, device_identifier, instructor_id, last_latitude, last_longitude, last_speed_kmh, last_heading, last_ignition_status, last_road_name, last_speed_limit_kmh, last_is_speeding, last_seen_at, last_heartbeat_at, is_active")
        .eq("tracking_provider", "radius");

      if (isColleagueMode && colleagueIds) {
        if (colleagueIds.length === 0) {
          setDevices([]);
          return;
        }
        query = query.in("instructor_id", colleagueIds);
      } else {
        query = query.eq("instructor_id", instructorId);
      }

      const { data } = await query;
      if (data) {
        let devicesWithNames = data as FleetDevice[];

        // In colleague mode, fetch instructor names
        if (isColleagueMode && colleagueIds && colleagueIds.length > 0) {
          const { data: instructors } = await supabase
            .from("instructors")
            .select("id, name")
            .in("id", colleagueIds) as any;

          const nameMap = new Map<string, string>();
          (instructors || []).forEach((i: any) => nameMap.set(i.id, i.name));

          devicesWithNames = devicesWithNames.map(d => ({
            ...d,
            _instructor_name: d.instructor_id ? nameMap.get(d.instructor_id) || undefined : undefined,
          }));
        }

        setDevices(devicesWithNames);
        devicesWithNames.forEach((d) => prevSpeedingRef.current.set(d.id, !!d.last_is_speeding));
      }
    })();
  }, [instructorId, isColleagueMode, colleagueIds]);

  // Realtime updates — only for own devices (not colleague mode to avoid complex filter)
  useRealtimeSubscription(
    "gps_devices",
    "UPDATE",
    (payload) => {
      const updated = payload.new as FleetDevice;
      const wasSpeeding = prevSpeedingRef.current.get(updated.id) ?? false;
      const nowSpeeding = !!updated.last_is_speeding;

      // Overspeed toast — only if heartbeat is fresh (<30s)
      if (!wasSpeeding && nowSpeeding && updated.last_heartbeat_at) {
        const heartbeatAge = Date.now() - new Date(updated.last_heartbeat_at).getTime();
        if (heartbeatAge < 30_000) {
          const name = updated.device_name || updated.device_identifier;
          const speed = Math.round(kmhToMph(updated.last_speed_kmh ?? 0));
          const limit = Math.round(kmhToMph(updated.last_speed_limit_kmh ?? 0));
          toast.error(`${name} — speeding at ${speed} mph in a ${limit} mph zone on ${updated.last_road_name || "unknown road"}`, {
            duration: 8000,
          });
        }
      }
      prevSpeedingRef.current.set(updated.id, nowSpeeding);

      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.id === updated.id);
        if (idx === -1) {
          // In colleague mode, check if this device belongs to a colleague
          if (isColleagueMode && colleagueIds && updated.instructor_id && !colleagueIds.includes(updated.instructor_id)) {
            return prev;
          }
          return [...prev, updated];
        }
        const next = [...prev];
        // Preserve _instructor_name from previous entry
        next[idx] = { ...updated, _instructor_name: prev[idx]._instructor_name };
        return next;
      });
    },
    {
      filter: !isColleagueMode && instructorId ? `instructor_id=eq.${instructorId}` : undefined,
      enabled: !!instructorId,
    }
  );

  // Init Google Maps
  useEffect(() => {
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key) return;
        await loadGoogleMaps(key);
        if (!mapContainerRef.current) return;
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 53.5, lng: -1.5 },
          zoom: 7,
          mapId: "fleet-map",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
          ],
        });
        mapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapReady(true);
      } catch (e) {
        console.error("Failed to init fleet map:", e);
      }
    })();
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapRef.current || !google.maps.marker?.AdvancedMarkerElement) return;
    const map = mapRef.current;
    const existingIds = new Set(markersRef.current.keys());

    const visibleDevices = showSignalLost ? devices : devices.filter((d) => !isSignalLost(d));

    for (const device of visibleDevices) {
      if (!device.last_latitude || !device.last_longitude) continue;
      const pos = { lat: Number(device.last_latitude), lng: Number(device.last_longitude) };
      const lost = isSignalLost(device);
      const speeding = !!device.last_is_speeding && !lost;
      const color = lost ? "#9CA3AF" : speeding ? "#EF4444" : "#22C55E";
      const heading = Number(device.last_heading) || 0;
      const displayName = device._instructor_name || device.device_name || device.device_identifier;
      const speedMph = Math.round(kmhToMph(device.last_speed_kmh ?? 0));
      const label = lost ? `${displayName} — Signal lost` : `${displayName} — ${speedMph} mph`;

      existingIds.delete(device.id);

      const existing = markersRef.current.get(device.id);
      if (existing) {
        existing.position = pos;
        const el = existing.content as HTMLDivElement;
        if (el) {
          const img = el.querySelector("img") as HTMLImageElement;
          if (img) img.src = createArrowSvg(heading, color, speeding);
          const labelEl = el.querySelector(".fleet-label") as HTMLElement;
          if (labelEl) labelEl.textContent = label;
        }
      } else {
        const container = document.createElement("div");
        container.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
        const img = document.createElement("img");
        img.src = createArrowSvg(heading, color, speeding);
        img.width = 32;
        img.height = 32;
        container.appendChild(img);
        const labelDiv = document.createElement("div");
        labelDiv.className = "fleet-label";
        labelDiv.style.cssText = "font-size:10px;background:rgba(0,0,0,0.7);color:white;padding:1px 4px;border-radius:3px;margin-top:2px;white-space:nowrap;";
        labelDiv.textContent = label;
        container.appendChild(labelDiv);

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          content: container,
        });

        marker.addListener("click", () => {
          const d = devicesRef.current.find((dd) => dd.id === device.id) || device;
          const dLost = isSignalLost(d);
          const dSpeed = Math.round(kmhToMph(d.last_speed_kmh ?? 0));
          const dLimit = Math.round(kmhToMph(d.last_speed_limit_kmh ?? 0));
          const dName = d._instructor_name || d.device_name || d.device_identifier;
          const instructorLine = isColleagueMode && d._instructor_name
            ? `<span style="color:#6B7280;font-size:11px;">${d.device_name || d.device_identifier}</span><br/>`
            : "";
          infoWindowRef.current?.setContent(`
            <div style="font-family:system-ui;font-size:13px;line-height:1.5;">
              <strong>${dName}</strong><br/>
              ${instructorLine}
              Speed: ${dSpeed} mph<br/>
              Limit: ${dLimit > 0 ? dLimit + " mph" : "Unknown"}<br/>
              Road: ${d.last_road_name || "Unknown"}<br/>
              Ignition: ${d.last_ignition_status ? "On" : "Off"}<br/>
              Last seen: ${relativeTime(d.last_seen_at)}<br/>
              ${dLost ? '<span style="color:#EF4444;font-weight:600;">⚠ Signal lost</span>' : ""}
            </div>
          `);
          infoWindowRef.current?.open(map, marker);
        });

        markersRef.current.set(device.id, marker);
      }
    }

    // Remove markers for devices no longer visible
    for (const id of existingIds) {
      const marker = markersRef.current.get(id);
      if (marker) {
        marker.map = null;
        markersRef.current.delete(id);
      }
    }
  }, [devices, mapReady, showSignalLost, isColleagueMode]);

  const fitBounds = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    for (const d of devices) {
      if (d.last_latitude && d.last_longitude && (showSignalLost || !isSignalLost(d))) {
        bounds.extend({ lat: Number(d.last_latitude), lng: Number(d.last_longitude) });
        count++;
      }
    }
    if (count > 0) mapRef.current.fitBounds(bounds, 60);
  }, [devices, showSignalLost]);

  const activeCount = devices.filter((d) => !isSignalLost(d)).length;
  const speedingCount = devices.filter((d) => !!d.last_is_speeding && !isSignalLost(d)).length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      {/* Back button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(-1)}
        className="absolute top-3 left-3 z-10 shadow-md"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      {/* Stats bar */}
      <div className="absolute top-3 left-24 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border text-sm">
        <span className="text-foreground font-medium">
          {isColleagueMode ? "Colleagues: " : ""}{activeCount} active
        </span>
        {speedingCount > 0 && (
          <span className="ml-2 text-destructive font-semibold">{speedingCount} speeding</span>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button variant="secondary" size="sm" onClick={fitBounds} className="shadow-md">
          <Maximize className="h-4 w-4 mr-1" /> Fit all
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSignalLost(!showSignalLost)}
          className="shadow-md"
        >
          {showSignalLost ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showSignalLost ? "Hide lost" : "Show lost"}
        </Button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
