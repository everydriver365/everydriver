import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import { 
  MapPin, Plus, Search, Navigation, Pencil, Trash2, Star, 
  ChevronDown, Building2, GraduationCap, Home, MapPinned,
  Loader2
} from "lucide-react";
import { AddFavouriteLocationDialog } from "@/components/instructor/AddFavouriteLocationDialog";
import { EditFavouriteLocationDialog } from "@/components/instructor/EditFavouriteLocationDialog";
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
}

const categoryConfig: Record<string, { label: string; icon: typeof MapPin }> = {
  test_centre: { label: "Test Centres", icon: Building2 },
  school: { label: "Schools", icon: GraduationCap },
  pupil_home: { label: "Pupil Homes", icon: Home },
  meeting_point: { label: "Meeting Points", icon: MapPinned },
  other: { label: "Other Locations", icon: MapPin },
};

export default function InstructorLocations() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [locations, setLocations] = useState<FavouriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(categoryConfig)));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<FavouriteLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<FavouriteLocation | null>(null);

  const fetchLocations = async () => {
    if (!instructorId) return;
    
    try {
      const { data, error } = await supabase
        .from("favourite_locations")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("category")
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
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(query) ||
      loc.postcode?.toLowerCase().includes(query) ||
      loc.address?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);

  const groupedLocations = useMemo(() => {
    return filteredLocations.reduce((acc, loc) => {
      const cat = loc.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(loc);
      return acc;
    }, {} as Record<string, FavouriteLocation[]>);
  }, [filteredLocations]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
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
    return <Icon className="h-4 w-4" />;
  };

  return (
    <InstructorPortalLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/instructor")}>
              <MapPin className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Locations</h1>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!loading && locations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No locations saved</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save test centres, schools, pupil homes, and other frequent destinations.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Location
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!loading && locations.length > 0 && filteredLocations.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No locations match "{searchQuery}"</p>
            </CardContent>
          </Card>
        )}

        {/* Grouped Locations */}
        {!loading && Object.entries(categoryConfig).map(([category, config]) => {
          const categoryLocations = groupedLocations[category];
          if (!categoryLocations || categoryLocations.length === 0) return null;

          const Icon = config.icon;
          const isExpanded = expandedCategories.has(category);

          return (
            <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between px-3 py-2 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">({categoryLocations.length})</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {categoryLocations.map((location) => (
                  <Card key={location.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-primary/10 shrink-0">
                            {getCategoryIcon(location.category)}
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
                              className={`h-4 w-4 ${location.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
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
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Add Dialog */}
      {instructorId && (
        <AddFavouriteLocationDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          instructorId={instructorId}
          onSaved={fetchLocations}
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
