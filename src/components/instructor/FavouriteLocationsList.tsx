import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Navigation, Trash2, Star, Building2, School, Home, Plus } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AddFavouriteLocationDialog } from "./AddFavouriteLocationDialog";

interface FavouriteLocation {
  id: string;
  name: string;
  category: string;
  address: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  is_favorite: boolean;
}

interface FavouriteLocationsListProps {
  instructorId: string;
  onNavigate?: (lat: number, lng: number, name: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  test_centre: <Building2 className="h-4 w-4" />,
  school: <School className="h-4 w-4" />,
  pupil_home: <Home className="h-4 w-4" />,
  meeting_point: <MapPin className="h-4 w-4" />,
  other: <Star className="h-4 w-4" />
};

const categoryLabels: Record<string, string> = {
  test_centre: "Test Centre",
  school: "School",
  pupil_home: "Pupil Home",
  meeting_point: "Meeting Point",
  other: "Other"
};

export function FavouriteLocationsList({ instructorId, onNavigate }: FavouriteLocationsListProps) {
  const [locations, setLocations] = useState<FavouriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [instructorId]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("favourite_locations")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("is_favorite", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching favourite locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLocationId) return;

    try {
      const { error } = await supabase
        .from("favourite_locations")
        .delete()
        .eq("id", deleteLocationId);

      if (error) throw error;
      
      setLocations(locations.filter(l => l.id !== deleteLocationId));
      toast.success("Location deleted");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    } finally {
      setDeleteLocationId(null);
    }
  };

  const handleNavigate = (location: FavouriteLocation) => {
    if (onNavigate) {
      onNavigate(location.latitude, location.longitude, location.name);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground py-4">Loading locations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Favourite Locations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandChevron isExpanded={true} /> : <ExpandChevron isExpanded={false} />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {expanded && (
          <CardContent className="pt-2 space-y-2">
            {locations.length === 0 ? (
              <div className="text-center py-4">
                <Star className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No saved locations</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Location
                </Button>
              </div>
            ) : (
              locations.map((location) => (
                <div key={location.id} className="flex items-center gap-3 p-2 rounded-none hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-full bg-muted">
                    {categoryIcons[location.category] || <MapPin className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{location.name}</span>
                      {location.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                    {location.address && (
                      <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {categoryLabels[location.category]}
                      </Badge>
                      {location.postcode && <span>{location.postcode}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleNavigate(location)}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteLocationId(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      <AddFavouriteLocationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        instructorId={instructorId}
        onSaved={fetchLocations}
      />

      <AlertDialog open={!!deleteLocationId} onOpenChange={() => setDeleteLocationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this favourite location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
