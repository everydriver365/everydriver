import { useRef, useEffect, useState } from "react";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { DoodlepadCanvas } from "./DoodlepadCanvas";
import type { Annotation } from "./types";
import type { DrawingTool, DrawingColor } from "./DoodlepadToolbar";

interface Props {
  center: { lat: number; lng: number };
  zoom: number;
  onZoomChange: (z: number) => void;
  onCenterChange: (c: { lat: number; lng: number }) => void;
  annotations: Annotation[];
  activeTool: DrawingTool;
  activeColor: DrawingColor;
  lineWidth: number;
  isDrawing: boolean;
  onAddAnnotation: (a: Annotation) => void;
  geoLoading: boolean;
}

export function DoodlepadMap({
  center,
  zoom,
  onZoomChange,
  onCenterChange,
  annotations,
  activeTool,
  activeColor,
  lineWidth,
  isDrawing,
  onAddAnnotation,
  geoLoading,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init Google Map
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!mapDivRef.current || mapRef.current) return;
      try {
        const apiKey = await fetchGoogleMapsKey();
        if (!apiKey || cancelled) return;
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapDivRef.current) return;

        const map = new google.maps.Map(mapDivRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          mapTypeId: "roadmap",
        });
        mapRef.current = map;

        map.addListener("zoom_changed", () => {
          onZoomChange(map.getZoom()!);
        });
        map.addListener("center_changed", () => {
          const c = map.getCenter()!;
          onCenterChange({ lat: c.lat(), lng: c.lng() });
        });

        setMapReady(true);
      } catch (e) {
        console.error("Failed to init Google Maps for Jotter", e);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // Sync center from parent (e.g. geolocation or loading a saved doodlepad)
  useEffect(() => {
    if (!mapRef.current) return;
    const current = mapRef.current.getCenter();
    if (current && Math.abs(current.lat() - center.lat) < 0.00001 && Math.abs(current.lng() - center.lng) < 0.00001) return;
    mapRef.current.setCenter({ lat: center.lat, lng: center.lng });
  }, [center.lat, center.lng]);

  // Sync zoom from parent
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapRef.current.getZoom() === zoom) return;
    mapRef.current.setZoom(zoom);
  }, [zoom]);

  // Toggle dragging based on drawing mode
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({
      draggable: !isDrawing,
      scrollwheel: !isDrawing,
      disableDoubleClickZoom: isDrawing,
    });
  }, [isDrawing]);

  return (
    <div className="w-full h-full relative">
      {geoLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Finding your location…</p>
          </div>
        </div>
      )}
      <div ref={mapDivRef} className="w-full h-full" />
      {mapReady && mapRef.current && (
        <DoodlepadCanvas
          map={mapRef.current}
          annotations={annotations}
          activeTool={activeTool}
          activeColor={activeColor}
          lineWidth={lineWidth}
          isDrawing={isDrawing}
          onAddAnnotation={onAddAnnotation}
        />
      )}
    </div>
  );
}
