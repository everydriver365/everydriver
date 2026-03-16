import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Fuel, Coffee, Heart, Zap, Navigation, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  { id: "toilet", label: "Toilets", icon: MapPin, color: "text-sky-600", bg: "bg-sky-500/12" },
  { id: "mcdonalds", label: "McDonald's", icon: Coffee, color: "text-amber-600", bg: "bg-amber-500/12" },
  { id: "petrol", label: "Petrol Station", icon: Fuel, color: "text-emerald-600", bg: "bg-emerald-500/12" },
  { id: "ae", label: "A&E", icon: Heart, color: "text-rose-600", bg: "bg-rose-500/12" },
  { id: "defib", label: "Defibrillator", icon: Zap, color: "text-violet-600", bg: "bg-violet-500/12" },
];

export default function InstructorFindNearby() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

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
            const Icon = cat.icon;
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
                <div className={`h-10 w-10 rounded-full ${cat.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${cat.color}`} />
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

        {/* Results */}
        {!loading && places.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">
              {places.length} result{places.length !== 1 ? "s" : ""} found
            </p>
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
