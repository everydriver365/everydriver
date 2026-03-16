import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Star, Loader2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFuelPrices } from "@/hooks/useFuelPrices";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

import toiletIcon from "@/assets/icons/toilet-icon.png";
import mcdonaldsIcon from "@/assets/icons/mcdonalds-icon.png";
import petrolIcon from "@/assets/icons/petrol-icon.png";
import aeIcon from "@/assets/icons/ae-icon.png";
import defibIcon from "@/assets/icons/defib-icon.png";
import driveThruIcon from "@/assets/icons/drive-thru-icon.png";
import coffeeIcon from "@/assets/icons/coffee-icon.png";
import supermarketIcon from "@/assets/icons/supermarket-icon.png";
import pharmacyIcon from "@/assets/icons/pharmacy-icon.png";
import carWashIcon from "@/assets/icons/car-wash-icon.png";
import parkingIcon from "@/assets/icons/parking-icon.png";
import garageIcon from "@/assets/icons/garage-icon.png";
import atmIcon from "@/assets/icons/atm-icon.png";
import evChargingIcon from "@/assets/icons/ev-charging-icon.png";
import postOfficeIcon from "@/assets/icons/post-office-icon.png";
import greggsIcon from "@/assets/icons/greggs-icon.png";

interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  open_now: boolean | null;
  rating: number | null;
}

const categories = [
  { id: "toilet", label: "Toilets", image: toiletIcon, bg: "bg-sky-500/12" },
  { id: "mcdonalds", label: "McDonald's", image: mcdonaldsIcon, bg: "bg-amber-500/12" },
  { id: "petrol", label: "Petrol Station", image: petrolIcon, bg: "bg-emerald-500/12" },
  { id: "ae", label: "A&E", image: aeIcon, bg: "bg-rose-500/12" },
  { id: "defib", label: "Defibrillator", image: defibIcon, bg: "bg-violet-500/12" },
  { id: "drive-through", label: "Drive Thru", image: driveThruIcon, bg: "bg-teal-500/12" },
  { id: "coffee", label: "Coffee Shops", image: coffeeIcon, bg: "bg-amber-700/12" },
  { id: "supermarket", label: "Supermarket", image: supermarketIcon, bg: "bg-green-500/12" },
  { id: "pharmacy", label: "Pharmacy", image: pharmacyIcon, bg: "bg-pink-500/12" },
  { id: "car-wash", label: "Car Wash", image: carWashIcon, bg: "bg-blue-500/12" },
  { id: "parking", label: "Parking", image: parkingIcon, bg: "bg-slate-500/12" },
  { id: "garage", label: "Tyre & Garage", image: garageIcon, bg: "bg-orange-500/12" },
  { id: "atm", label: "ATMs", image: atmIcon, bg: "bg-indigo-500/12" },
  { id: "ev-charging", label: "EV Charging", image: evChargingIcon, bg: "bg-lime-500/12" },
  { id: "post-office", label: "Post Office", image: postOfficeIcon, bg: "bg-red-500/12" },
  { id: "greggs", label: "Greggs", image: greggsIcon, bg: "bg-sky-600/12" },
];

export default function InstructorFindNearby() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { instructor } = useInstructorAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const { nearest, cheapest, loading: fuelLoading, refetch: refetchFuel } = useFuelPrices(instructor?.id);

  const searchNearby = async (categoryId: string) => {
    setActiveCategory(categoryId);
    setPlaces([]);
    setLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      const { data: session } = await supabase.auth.getSession();
      const jwt = session?.session?.access_token;
      if (!jwt) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-places-nearby`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ lat, lng, category: categoryId }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setPlaces(data.places || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Search failed",
        description: err?.message === "User denied Geolocation"
          ? "Please enable location access to find nearby places."
          : err?.message || "Could not search nearby places.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (place: Place) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
      "_blank"
    );
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <InstructorPageHeader
            lucideIcon={MapPin}
            title="Find Nearby"
            subtitle="Toilets, food & more"
          />
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => searchNearby(cat.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <div className={`h-14 w-14 rounded-full ${cat.bg} flex items-center justify-center overflow-hidden`}>
                  <img src={cat.image} alt={cat.label} className="h-10 w-10 object-contain" />
                </div>
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Searching nearby…</span>
          </div>
        )}

        {/* Fuel Summary - Nearest & Cheapest */}
        {!loading && activeCategory === "petrol" && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">Fuel prices</p>
            {fuelLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-xs text-muted-foreground">Loading fuel prices…</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {nearest && (
                  <Card className="border-blue-200 bg-blue-500/5">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Nearest</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground truncate">{nearest.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{nearest.address}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {nearest.distance_miles.toFixed(1)} mi
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`, "_blank")}>
                          <Navigation className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {cheapest && (
                  <Card className="border-green-200 bg-green-500/5">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Cheapest</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground truncate">{cheapest.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{cheapest.address}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {cheapest.distance_miles.toFixed(1)} mi
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${cheapest.lat},${cheapest.lng}`, "_blank")}>
                          <Navigation className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {places.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground px-1 pt-2">
                {places.length} station{places.length !== 1 ? "s" : ""} nearby
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {!loading && places.length > 0 && (
          <div className="space-y-2">
            {activeCategory !== "petrol" && (
              <p className="text-sm font-medium text-muted-foreground px-1">
                {places.length} result{places.length !== 1 ? "s" : ""} found
              </p>
            )}
            {places.map((place, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">{place.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{place.address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {place.distance.toFixed(1)} mi
                        </Badge>
                        {place.open_now !== null && (
                          <Badge
                            variant={place.open_now ? "default" : "destructive"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {place.open_now ? "Open" : "Closed"}
                          </Badge>
                        )}
                        {(activeCategory === "greggs" || activeCategory === "drive-through") &&
                          /drive|thru/i.test(place.name) && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 border-teal-200">
                            🚗 Drive Through
                          </Badge>
                        )}
                        {place.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {place.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 gap-1 text-xs"
                      onClick={() => openDirections(place)}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Go
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && activeCategory && places.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mt-2">No results found nearby</p>
          </div>
        )}

        {/* Initial state */}
        {!activeCategory && (
          <div className="text-center py-12">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mt-2">Tap a category to search nearby</p>
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
