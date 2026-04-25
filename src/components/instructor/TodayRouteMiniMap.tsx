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

  const FONT_STACK =
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Header — premium tile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
          style={{
            background: "transparent",
            border: "none",
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#E6F0FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MapPin size={22} strokeWidth={2} color="#2B7BC8" />
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#000000",
                letterSpacing: -0.2,
                fontFamily: FONT_STACK,
                lineHeight: 1.25,
              }}
            >
              Today's route
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                fontFamily: FONT_STACK,
                marginTop: 3,
              }}
            >
              {locations.length} stops
            </div>
          </div>
          <ExpandChevron isExpanded={isExpanded} size={16} />
        </button>

        {/* Map */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 180, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", borderTop: "0.5px solid #E5E5EA" }}
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
                <button
                  onClick={() => navigate("/instructor/tracking")}
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    zIndex: 10,
                    height: 28,
                    padding: "0 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#FFFFFF",
                    border: "0.5px solid #E5E5EA",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#000000",
                    fontFamily: FONT_STACK,
                    cursor: "pointer",
                  }}
                >
                  <ExternalLink style={{ width: 12, height: 12 }} />
                  Full map
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
