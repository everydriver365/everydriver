import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, ExternalLink } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { motion, AnimatePresence } from "framer-motion";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon
const createMarkerIcon = (index: number) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: hsl(var(--primary));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface LessonLocation {
  postcode: string;
  pupilName: string;
  time: string;
  lat: number;
  lng: number;
}

interface TodayRouteMiniMapProps {
  locations: LessonLocation[];
}

export function TodayRouteMiniMap({ locations }: TodayRouteMiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  // Only show if 2+ locations
  if (locations.length < 2) return null;

  // Calculate bounds
  const lats = locations.map((l) => l.lat);
  const lngs = locations.map((l) => l.lng);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
    [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01],
  ];

  const center: [number, number] = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <div className="bg-card rounded-2xl shadow-lift border border-border/50 overflow-hidden shadow-sm">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Today's Route</p>
              <p className="text-xs text-muted-foreground">{locations.length} stops</p>
            </div>
          </div>
          <ExpandChevron isExpanded={isExpanded} size={20} />
        </button>

        {/* Map */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 180, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="h-[180px] relative">
                <MapContainer
                  bounds={bounds}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                  attributionControl={false}
                  className="h-full w-full z-0"
                >
                  <TileLayer url={getMapTileUrl()} attribution={getMapAttribution()} />
                  {locations.map((loc, index) => (
                    <Marker
                      key={index}
                      position={[loc.lat, loc.lng]}
                      icon={createMarkerIcon(index)}
                    >
                      <Popup>
                        <div className="text-xs">
                          <strong>{loc.pupilName}</strong>
                          <br />
                          {loc.time} - {loc.postcode}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
                {/* Expand button overlay */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 z-10 h-7 text-xs shadow-md"
                  onClick={() => navigate("/instructor/tracking")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Full Map
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
