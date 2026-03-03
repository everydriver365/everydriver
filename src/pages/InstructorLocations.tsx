import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { 
  MapPin, Plus, Search, Navigation, Pencil, Trash2, Star, 
  Building2, GraduationCap, Home, MapPinned, Loader2, Crosshair, User
} from "lucide-react";
import { GlassCard, GlassChip } from "@/components/ui/GlassCard";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { AddFavouriteLocationDialog } from "@/components/instructor/AddFavouriteLocationDialog";
import { EditFavouriteLocationDialog } from "@/components/instructor/EditFavouriteLocationDialog";
import { CoordsMapPreview } from "@/components/instructor/CoordsMapPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface FavouriteLocation {
  id: string;
  name: string;
  category: string;
  address: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  is_favorite: boolean | null;
  created_at: string;
  pupil_id: string | null;
  instructor_id: string;
  pupil?: { name: string } | null;
}

const categoryConfig: Record<string, { label: string; shortLabel: string; icon: typeof MapPin }> = {
  all: { label: "All Locations", shortLabel: "All", icon: MapPin },
  test_centre: { label: "Test Centres", shortLabel: "Test", icon: Building2 },
  school: { label: "Schools", shortLabel: "School", icon: GraduationCap },
  pupil_home: { label: "Pupil Homes", shortLabel: "Home", icon: Home },
  meeting_point: { label: "Meeting Points", shortLabel: "Meet", icon: MapPinned },
  other: { label: "Other Locations", shortLabel: "Other", icon: MapPin },
};

const categoryAccents: Record<string, { text: string; bg: string; glow: string; hex: string }> = {
  test_centre: { text: "text-teal-500", bg: "bg-teal-500/10", glow: "ring-teal-500/20", hex: "#14b8a6" },
  school: { text: "text-emerald-500", bg: "bg-emerald-500/10", glow: "ring-emerald-500/20", hex: "#10b981" },
  pupil_home: { text: "text-amber-500", bg: "bg-amber-500/10", glow: "ring-amber-500/20", hex: "#f59e0b" },
  meeting_point: { text: "text-violet-500", bg: "bg-violet-500/10", glow: "ring-violet-500/20", hex: "#8b5cf6" },
  other: { text: "text-primary", bg: "bg-primary/10", glow: "ring-primary/20", hex: "hsl(var(--primary))" },
};

export default function InstructorLocations() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [locations, setLocations] = useState<FavouriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<FavouriteLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<FavouriteLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [prefilledData, setPrefilledData] = useState<{ coords?: { lat: number; lng: number }; postcode?: string } | undefined>();

  const fetchLocations = async () => {
    if (!instructorId) return;
    
    try {
      const { data, error } = await supabase
        .from("favourite_locations")
        .select(`
          *,
          pupil:pupils(name)
        `)
        .eq("instructor_id", instructorId)
        .order("is_favorite", { ascending: false })
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [instructorId]);

  const filteredLocations = useMemo(() => {
    let filtered = locations;
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(query) ||
        loc.postcode?.toLowerCase().includes(query) ||
        loc.address?.toLowerCase().includes(query) ||
        loc.pupil?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [locations, searchQuery, selectedCategory]);

  const favouriteLocations = useMemo(() => {
    return locations.filter(loc => loc.is_favorite);
  }, [locations]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get postcode
          const response = await fetch(
            `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`
          );
          const data = await response.json();
          const postcode = data.result?.[0]?.postcode;

          // Open add dialog with pre-filled data
          setPrefilledData({ 
            coords: { lat: latitude, lng: longitude }, 
            postcode: postcode || undefined 
          });
          setAddDialogOpen(true);
          toast.success("Location detected!");
        } catch (error) {
          console.error("Reverse geocode error:", error);
          // Still open dialog with coords even if postcode lookup fails
          setPrefilledData({ coords: { lat: latitude, lng: longitude } });
          setAddDialogOpen(true);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your location. Please check permissions.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openNavigation = (lat: number, lng: number) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;
    
    if (isIOS) {
      window.location.href = appleUrl;
    } else {
      window.open(googleUrl, "_blank");
    }
  };

  const toggleFavorite = async (location: FavouriteLocation) => {
    try {
      const { error } = await supabase
        .from("favourite_locations")
        .update({ is_favorite: !location.is_favorite })
        .eq("id", location.id);

      if (error) throw error;
      
      setLocations(prev => 
        prev.map(loc => 
          loc.id === location.id 
            ? { ...loc, is_favorite: !loc.is_favorite }
            : loc
        )
      );
      toast.success(location.is_favorite ? "Removed from favourites" : "Added to favourites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favourite");
    }
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;
    
    try {
      const { error } = await supabase
        .from("favourite_locations")
        .delete()
        .eq("id", deletingLocation.id);

      if (error) throw error;
      
      setLocations(prev => prev.filter(loc => loc.id !== deletingLocation.id));
      toast.success("Location deleted");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    } finally {
      setDeletingLocation(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const config = categoryConfig[category] || categoryConfig.other;
    const Icon = config.icon;
    return Icon;
  };

  const getAccent = (category: string) => {
    return categoryAccents[category] || categoryAccents.other;
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setPrefilledData(undefined);
    }
    setAddDialogOpen(open);
  };

  const renderLocationCard = (location: FavouriteLocation, showCategory = true) => {
    const accent = getAccent(location.category);
    const Icon = getCategoryIcon(location.category);

    return (
      <GlassCard 
        key={location.id} 
        intensity="medium"
        className={cn("p-3 ring-1", accent.glow)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-full shrink-0", accent.bg)}>
              <Icon className={cn("h-4 w-4", accent.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{location.name}</h4>
                {location.is_favorite && (
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {location.postcode}
                {location.address && ` · ${location.address}`}
              </p>
              {location.pupil?.name && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Linked: {location.pupil.name}
                </p>
              )}
              {location.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {location.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toggleFavorite(location)}
            >
              <Star 
                className={cn("h-4 w-4", location.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} 
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openNavigation(location.latitude, location.longitude)}
            >
              <Navigation className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditingLocation(location)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setDeletingLocation(location)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Expandable Map Preview */}
        <CoordsMapPreview
          latitude={location.latitude}
          longitude={location.longitude}
          onClick={() => openNavigation(location.latitude, location.longitude)}
          accentColor={accent.hex}
        />
      </GlassCard>
    );
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <InstructorPageHeader
          lucideIcon={MapPin}
          title="Locations"
          action={
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          }
        />

        {/* GPS Quick-Add Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4 text-primary" />
          )}
          {gpsLoading ? "Getting location..." : "Use Current Location"}
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Pills */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const count = key === "all" 
                ? locations.length 
                : locations.filter(l => l.category === key).length;
              
              if (key !== "all" && count === 0) return null;
              
              return (
                <GlassChip
                  key={key}
                  active={selectedCategory === key}
                  onClick={() => setSelectedCategory(key)}
                  className="flex items-center gap-1.5"
                >
                  <config.icon className="h-3 w-3" />
                  {config.shortLabel}
                  {count > 0 && (
                    <span className="text-[10px] opacity-70">({count})</span>
                  )}
                </GlassChip>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!loading && locations.length === 0 && (
          <GlassCard intensity="medium" className="p-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No locations saved</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save test centres, schools, pupil homes, and other frequent destinations.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            </div>
          </GlassCard>
        )}

        {/* No Results */}
        {!loading && locations.length > 0 && filteredLocations.length === 0 && (
          <GlassCard intensity="medium" className="p-6">
            <p className="text-center text-muted-foreground">
              No locations match "{searchQuery}"
            </p>
          </GlassCard>
        )}

        {/* Favourites Section */}
        {!loading && favouriteLocations.length > 0 && selectedCategory === "all" && !searchQuery && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Favourites ({favouriteLocations.length})
              </h2>
            </div>
            <div className="space-y-2">
              {favouriteLocations.map(location => renderLocationCard(location))}
            </div>
          </div>
        )}

        {/* All Locations */}
        {!loading && filteredLocations.length > 0 && (
          <div className="space-y-2">
            {(favouriteLocations.length > 0 && selectedCategory === "all" && !searchQuery) && (
              <div className="flex items-center gap-2 px-1 mt-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  All Locations
                </h2>
              </div>
            )}
            <div className="space-y-2">
              {filteredLocations
                .filter(loc => {
                  // If showing favourites section, exclude favourites from "All"
                  if (favouriteLocations.length > 0 && selectedCategory === "all" && !searchQuery) {
                    return !loc.is_favorite;
                  }
                  return true;
                })
                .map(location => renderLocationCard(location))}
            </div>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      {instructorId && (
        <AddFavouriteLocationDialog
          open={addDialogOpen}
          onOpenChange={handleDialogClose}
          instructorId={instructorId}
          onSaved={fetchLocations}
          prefilled={prefilledData}
        />
      )}

      {/* Edit Dialog */}
      {editingLocation && instructorId && (
        <EditFavouriteLocationDialog
          open={!!editingLocation}
          onOpenChange={(open) => !open && setEditingLocation(null)}
          location={editingLocation}
          onSaved={fetchLocations}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLocation} onOpenChange={(open) => !open && setDeletingLocation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLocation?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </InstructorPortalLayout>
  );
}
