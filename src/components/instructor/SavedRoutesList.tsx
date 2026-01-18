import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Route, MapPin, Trash2, ChevronDown, ChevronUp, Calendar, Share2, Upload, FileUp } from "lucide-react";
import { format } from "date-fns";
import { SavedRoutePreview } from "./SavedRoutePreview";
import { UploadedRoutePreview } from "./UploadedRoutePreview";
import { ShareRouteDialog } from "./ShareRouteDialog";
import { RouteUploader } from "./RouteUploader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SavedRoute {
  id: string;
  name: string;
  description: string | null;
  start_location: string | null;
  end_location: string | null;
  distance_km: number | null;
  route_type: string;
  telematics_id: string | null;
  is_shared: boolean | null;
  share_code: string | null;
  created_at: string;
}

interface SavedRoutesListProps {
  instructorId: string;
  onNavigate?: (lat: number, lng: number, name: string) => void;
}

export function SavedRoutesList({ instructorId, onNavigate }: SavedRoutesListProps) {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const [shareRoute, setShareRoute] = useState<SavedRoute | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, [instructorId]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_routes")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error("Error fetching saved routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRouteId) return;

    try {
      const { error } = await supabase
        .from("saved_routes")
        .delete()
        .eq("id", deleteRouteId);

      if (error) throw error;
      
      setRoutes(routes.filter(r => r.id !== deleteRouteId));
      toast.success("Route deleted");
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error("Failed to delete route");
    } finally {
      setDeleteRouteId(null);
    }
  };

  const toggleExpand = (routeId: string) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground py-4">Loading saved routes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              Saved Routes {routes.length > 0 && `(${routes.length})`}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setShowUploader(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {routes.length === 0 ? (
            <div className="text-center py-4">
              <Route className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">No saved routes yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Record a lesson or upload a GPX/KML file
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 gap-2"
                onClick={() => setShowUploader(true)}
              >
                <FileUp className="h-4 w-4" />
                Upload Route File
              </Button>
            </div>
          ) : (
            routes.map((route) => (
              <div key={route.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(route.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{route.name}</span>
                      {route.is_shared && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Shared
                        </Badge>
                      )}
                      {route.route_type === "uploaded" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {route.distance_km && (
                        <span>{route.distance_km.toFixed(1)} km</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(route.created_at), "MMM d")}
                      </span>
                    </div>
                  </div>
                  {expandedRouteId === route.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedRouteId === route.id && (
                  <div className="border-t p-3 space-y-3 bg-muted/30">
                    {route.description && (
                      <p className="text-sm text-muted-foreground">{route.description}</p>
                    )}

                    {(route.start_location || route.end_location) && (
                      <div className="space-y-1 text-sm">
                        {route.start_location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-green-500" />
                            <span className="truncate">{route.start_location}</span>
                          </div>
                        )}
                        {route.end_location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            <span className="truncate">{route.end_location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {route.telematics_id ? (
                      <SavedRoutePreview 
                        telematicsId={route.telematics_id} 
                        onNavigateToStart={onNavigate}
                      />
                    ) : route.route_type === "uploaded" && (
                      <UploadedRoutePreview 
                        routeId={route.id} 
                        onNavigateToStart={onNavigate}
                      />
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setShareRoute(route)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                        onClick={() => setDeleteRouteId(route.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <RouteUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        instructorId={instructorId}
        onUploaded={fetchRoutes}
      />

      {shareRoute && (
        <ShareRouteDialog
          open={!!shareRoute}
          onOpenChange={() => setShareRoute(null)}
          routeId={shareRoute.id}
          routeName={shareRoute.name}
          isShared={shareRoute.is_shared || false}
          shareCode={shareRoute.share_code}
          onUpdated={fetchRoutes}
        />
      )}

      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this saved route. This action cannot be undone.
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
