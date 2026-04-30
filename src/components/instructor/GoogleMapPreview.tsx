import { useEffect, useRef, useState } from "react";
import { GoogleMap, MarkerF, DirectionsRenderer } from "@react-google-maps/api";
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
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const previewMapRef = useRef<google.maps.Map | null>(null);

  // Whenever the route changes, fit the preview map to the route bounds with
  // padding so we never default to a national overview.
  useEffect(() => {
    if (!previewMapRef.current || !directions) return;
    const bounds = directions.routes?.[0]?.bounds;
    if (!bounds) return;
    try {
      previewMapRef.current.fitBounds(bounds, { top: 32, right: 32, bottom: 48, left: 32 });
    } catch (e) {
      console.warn("fitBounds failed:", e);
    }
  }, [directions]);

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

  // Get device geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) {
          setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      },
      (err) => console.warn("Geolocation unavailable:", err.message),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
    return () => { cancelled = true; };
  }, []);

  // Fetch driving directions once both points + SDK are ready
  useEffect(() => {
    if (!isLoaded || !coords || !myCoords) return;
    let cancelled = false;
    try {
      const svc = new google.maps.DirectionsService();
      svc.route(
        {
          origin: myCoords,
          destination: coords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (cancelled) return;
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.warn("Directions request failed:", status);
          }
        }
      );
    } catch (e) {
      console.warn("Directions error:", e);
    }
    return () => { cancelled = true; };
  }, [isLoaded, coords, myCoords]);

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

  const routePolyline = {
    strokeColor: "#0075c9",
    strokeOpacity: 0.9,
    strokeWeight: 4,
  };

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
          {directions ? (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                preserveViewport: false,
                polylineOptions: routePolyline,
              }}
            />
          ) : null}
          {myCoords && (
            <MarkerF
              position={myCoords}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#0075c9",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          )}
          <MarkerF position={coords} />
        </GoogleMap>
        <div className="absolute inset-0 pointer-events-none" />
        <div
          className="absolute bottom-2 right-2 inline-flex items-center"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "0.5px solid #D3D1C7",
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 500,
            color: "#5F5E5A",
          }}
        >
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
              {directions ? (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    preserveViewport: false,
                    polylineOptions: routePolyline,
                  }}
                />
              ) : null}
              {myCoords && (
                <MarkerF
                  position={myCoords}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#0075c9",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                  title="You"
                />
              )}
              <MarkerF position={coords} title="Pickup" />
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
