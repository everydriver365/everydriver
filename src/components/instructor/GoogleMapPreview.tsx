import { useEffect, useState } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { Loader2, X, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface GoogleMapPreviewProps {
  postcode: string;
  address?: string | null;
  height?: number;
  className?: string;
}

const PREVIEW_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "none",
  clickableIcons: false,
  zoomControl: false,
  mapTypeId: "roadmap",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

const FULL_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  gestureHandling: "greedy",
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  mapTypeId: "roadmap",
};

export function GoogleMapPreview({
  postcode,
  address,
  height = 120,
  className = "",
}: GoogleMapPreviewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key) return;
        await loadGoogleMaps(key);
        if (!cancelled) setIsLoaded(true);
      } catch (e) {
        console.error("Failed to load Google Maps:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) {
          if (result?.latitude && result?.longitude) {
            setCoords({ lat: result.latitude, lng: result.longitude });
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Error geocoding postcode:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCoords();
    return () => { cancelled = true; };
  }, [postcode]);

  const openExternal = () => {
    const dest = encodeURIComponent([address, postcode].filter(Boolean).join(", "));
    if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  if (loading || !isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ height }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !coords) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`block w-full relative cursor-pointer ${className}`}
        style={{ height }}
        aria-label="Expand map"
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={coords}
          zoom={14}
          options={PREVIEW_OPTIONS}
        >
          <MarkerF position={coords} />
        </GoogleMap>
        <div className="absolute inset-0 pointer-events-none" />
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white/90 backdrop-blur text-[11px] font-semibold text-foreground shadow-sm">
          Tap to expand
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-3xl w-[95vw] h-[80vh] overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Pickup location map</DialogTitle>
            <DialogDescription>
              Interactive map showing the pupil pickup location.
            </DialogDescription>
          </VisuallyHidden>
          <div className="relative w-full h-full">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={coords}
              zoom={15}
              options={FULL_OPTIONS}
            >
              <MarkerF position={coords} />
            </GoogleMap>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 left-3 z-10 h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center"
              aria-label="Close map"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
              <Button onClick={openExternal} className="shadow-lg">
                <Navigation className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
