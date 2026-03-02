import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation, Clock, Car, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorEnRouteETA } from "@/hooks/useInstructorEnRouteETA";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";

interface InstructorEnRouteTrackerProps {
  pupilId: string;
  lessonId: string;
  brandColour?: string | null;
}

const trafficConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  clear: { label: "Clear roads", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: Car },
  light: { label: "Light traffic", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: Car },
  moderate: { label: "Moderate traffic", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: AlertTriangle },
  heavy: { label: "Heavy traffic", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: AlertTriangle },
};

export function InstructorEnRouteTracker({ pupilId, lessonId, brandColour }: InstructorEnRouteTrackerProps) {
  const { etaMinutes, etaText, trafficCondition, instructorLat, instructorLng, heading, isLoading, error } =
    useInstructorEnRouteETA(pupilId, lessonId);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Load Google Maps
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (key && !cancelled) {
          await loadGoogleMaps(key);
          setMapReady(true);
        }
      } catch {
        console.error("Failed to load Google Maps for en-route tracker");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Init map
  useEffect(() => {
    if (!mapReady || !mapRef.current || googleMapRef.current) return;
    if (!instructorLat || !instructorLng) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: instructorLat, lng: instructorLng },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });

    const marker = new google.maps.Marker({
      position: { lat: instructorLat, lng: instructorLng },
      map,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: brandColour || "#1e3a5f",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        rotation: heading || 0,
      },
      title: "Your instructor",
    });

    googleMapRef.current = map;
    markerRef.current = marker;
  }, [mapReady, instructorLat, instructorLng]);

  // Update marker position
  useEffect(() => {
    if (!markerRef.current || !instructorLat || !instructorLng) return;

    markerRef.current.setPosition({ lat: instructorLat, lng: instructorLng });
    if (heading !== null) {
      const icon = markerRef.current.getIcon() as google.maps.Symbol;
      markerRef.current.setIcon({ ...icon, rotation: heading });
    }

    googleMapRef.current?.panTo({ lat: instructorLat, lng: instructorLng });
  }, [instructorLat, instructorLng, heading]);

  // If error (e.g. no longer en_route), don't render
  if (error) return null;

  const traffic = trafficConfig[trafficCondition || "clear"] || trafficConfig.clear;
  const TrafficIcon = traffic.icon;

  return (
    <Card className="overflow-hidden border-0 shadow-lg" style={{ backgroundColor: brandColour || "#1e3a5f" }}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <Navigation className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-sm font-semibold">Instructor On The Way</span>
          </div>

          {/* ETA */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-10 w-20 rounded bg-white/20 animate-pulse" />
              <span className="text-white/70 text-sm">Calculating ETA...</span>
            </div>
          ) : etaMinutes !== null ? (
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">{etaMinutes}</div>
              <div>
                <div className="text-sm font-medium text-white/90">minutes away</div>
                <Badge variant="outline" className={`${traffic.color} border-0 text-[10px] mt-1`}>
                  <TrafficIcon className="h-3 w-3 mr-1" />
                  {traffic.label}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-white/80 text-sm">Tracking instructor location...</div>
          )}
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-48 bg-muted"
          style={{ minHeight: "192px" }}
        />
      </CardContent>
    </Card>
  );
}
