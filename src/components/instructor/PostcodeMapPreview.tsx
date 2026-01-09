import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import L from "leaflet";

// Fix default marker icon issue with Leaflet + React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PostcodeMapPreviewProps {
  postcode: string;
  className?: string;
}

export function PostcodeMapPreview({ postcode, className = "" }: PostcodeMapPreviewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCoords = async () => {
      if (!postcode) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("geocode-postcode", {
          body: { postcodes: [postcode] },
        });

        if (fnError) throw fnError;

        const result = data?.results?.[0];
        if (result?.latitude && result?.longitude) {
          setCoords({ lat: result.latitude, lng: result.longitude });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error geocoding postcode:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCoords();
  }, [postcode]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg h-32 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !coords) {
    return null;
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ height: "120px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[coords.lat, coords.lng]}
          radius={500}
          pathOptions={{
            fillColor: "hsl(var(--primary))",
            fillOpacity: 0.2,
            color: "hsl(var(--primary))",
            weight: 2,
          }}
        />
        <Marker position={[coords.lat, coords.lng]} />
      </MapContainer>
    </div>
  );
}
