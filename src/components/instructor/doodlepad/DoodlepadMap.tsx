import { useRef, useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { DoodlepadCanvas } from "./DoodlepadCanvas";
import type { Annotation, LatLng } from "./types";
import type { DrawingTool, DrawingColor } from "./DoodlepadToolbar";
import "leaflet/dist/leaflet.css";

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

function MapController({
  center,
  zoom,
  onZoomChange,
  onCenterChange,
  isDrawing,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  onZoomChange: (z: number) => void;
  onCenterChange: (c: { lat: number; lng: number }) => void;
  isDrawing: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng]); // eslint-disable-line

  useEffect(() => {
    if (isDrawing) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    }
  }, [isDrawing, map]);

  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => {
      const c = map.getCenter();
      onCenterChange({ lat: c.lat, lng: c.lng });
    },
  });

  return null;
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
  const mapRef = useRef<L.Map | null>(null);

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
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
        <MapController
          center={center}
          zoom={zoom}
          onZoomChange={onZoomChange}
          onCenterChange={onCenterChange}
          isDrawing={isDrawing}
        />
        <DoodlepadCanvas
          annotations={annotations}
          activeTool={activeTool}
          activeColor={activeColor}
          lineWidth={lineWidth}
          isDrawing={isDrawing}
          onAddAnnotation={onAddAnnotation}
        />
      </MapContainer>
    </div>
  );
}
