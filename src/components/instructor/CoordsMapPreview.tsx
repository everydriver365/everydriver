import { useState } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Navigation } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import L from "leaflet";
import { getMapTileUrl, getMapAttribution } from "@/lib/mapConfig";
import { cn } from "@/lib/utils";

// Fix default marker icon issue with Leaflet + React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface CoordsMapPreviewProps {
  latitude: number;
  longitude: number;
  className?: string;
  onClick?: () => void;
  expandable?: boolean;
  accentColor?: string;
}

export function CoordsMapPreview({ 
  latitude, 
  longitude, 
  className = "", 
  onClick,
  expandable = true,
  accentColor = "hsl(var(--primary))"
}: CoordsMapPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  if (!expandable) {
    return (
      <div 
        className={cn(
          "rounded-none overflow-hidden border relative z-0",
          onClick && "cursor-pointer",
          className
        )}
        onClick={handleClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === "Enter" && handleClick() : undefined}
      >
        {onClick && (
          <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1 pointer-events-none">
            <Navigation className="h-3 w-3" />
            Navigate
          </div>
        )}
        <div className="relative z-0">
          <MapContainer
            center={[latitude, longitude]}
            zoom={14}
            scrollWheelZoom={false}
            dragging={false}
            zoomControl={false}
            doubleClickZoom={false}
            touchZoom={false}
            style={{ height: "120px", width: "100%", zIndex: 0 }}
          >
            <TileLayer
              attribution={getMapAttribution()}
              url={getMapTileUrl()}
            />
            <Circle
              center={[latitude, longitude]}
              radius={300}
              pathOptions={{
                fillColor: accentColor,
                fillOpacity: 0.2,
                color: accentColor,
                weight: 2,
              }}
            />
            <Marker position={[latitude, longitude]} />
          </MapContainer>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-2", className)}>
      <button
        onClick={toggleExpand}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <>
            <ExpandChevron isExpanded={true} size={12} />
            Hide map
          </>
        ) : (
          <>
            <ExpandChevron isExpanded={false} size={12} />
            Show map
          </>
        )}
      </button>
      
      {isExpanded && (
        <div 
          className="rounded-none overflow-hidden border relative z-0 cursor-pointer mt-1"
          onClick={handleClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => e.key === "Enter" && handleClick() : undefined}
        >
          {onClick && (
            <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-md flex items-center gap-1 pointer-events-none">
              <Navigation className="h-3 w-3" />
              Tap to navigate
            </div>
          )}
          <div className="relative z-0">
            <MapContainer
              center={[latitude, longitude]}
              zoom={14}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              touchZoom={false}
              style={{ height: "140px", width: "100%", zIndex: 0 }}
            >
              <TileLayer
                attribution={getMapAttribution()}
                url={getMapTileUrl()}
              />
              <Circle
                center={[latitude, longitude]}
                radius={300}
                pathOptions={{
                  fillColor: accentColor,
                  fillOpacity: 0.2,
                  color: accentColor,
                  weight: 2,
                }}
              />
              <Marker position={[latitude, longitude]} />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
