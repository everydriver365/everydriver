import { useEffect, useState } from "react";
import { GoogleMap, MarkerF, DirectionsRenderer } from "@react-google-maps/api";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postcode: string | null;
  address: string | null;
  pupilName: string;
  whenLabel: string;
  onNavigate: () => void;
}

const FULL_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  gestureHandling: "greedy",
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  mapTypeId: "roadmap",
};

export function FullscreenMapModal({
  open, onOpenChange, postcode, address, pupilName, whenLabel, onNavigate,
}: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key) return;
        await loadGoogleMaps(key);
        if (!cancelled) setIsLoaded(true);
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || !postcode) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("geocode-postcode", {
          body: { postcodes: [postcode] },
        });
        const r = data?.results?.[0];
        if (!cancelled && r?.latitude && r?.longitude) {
          setCoords({ lat: r.latitude, lng: r.longitude });
        }
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [open, postcode]);

  useEffect(() => {
    if (!open || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (!cancelled) setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!isLoaded || !coords || !myCoords) return;
    let cancelled = false;
    try {
      const svc = new google.maps.DirectionsService();
      svc.route(
        { origin: myCoords, destination: coords, travelMode: google.maps.TravelMode.DRIVING },
        (res, status) => {
          if (cancelled) return;
          if (status === google.maps.DirectionsStatus.OK && res) setDirections(res);
        }
      );
    } catch {}
    return () => { cancelled = true; };
  }, [isLoaded, coords, myCoords]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-3xl w-[95vw] h-[85vh] overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Lesson location map</DialogTitle>
          <DialogDescription>Live map showing route to {pupilName}'s pickup location.</DialogDescription>
        </VisuallyHidden>
        <div className="relative w-full h-full bg-muted">
          {isLoaded && coords ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={coords}
              zoom={15}
              options={FULL_OPTIONS}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    preserveViewport: false,
                    polylineOptions: { strokeColor: "#1E6FB8", strokeOpacity: 0.9, strokeWeight: 4 },
                  }}
                />
              )}
              {myCoords && (
                <MarkerF
                  position={myCoords}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7, fillColor: "#1D9E75", fillOpacity: 1,
                    strokeColor: "#ffffff", strokeWeight: 2,
                  }}
                  title="You"
                />
              )}
              <MarkerF position={coords} title={pupilName} />
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 p-3 bg-gradient-to-b from-black/40 to-transparent">
            <button
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center"
              aria-label="Close map"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
              <div className="text-[12px] font-semibold truncate text-foreground">{pupilName}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {whenLabel}{address ? ` · ${address}` : postcode ? ` · ${postcode}` : ""}
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
            <Button onClick={onNavigate} className="shadow-lg gap-2">
              <Navigation className="h-4 w-4" />
              Navigate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
