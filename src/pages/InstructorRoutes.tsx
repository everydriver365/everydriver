import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Route,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Flag,
  CheckCircle,
  Download,
  Share2,
  Building2,
  Play,
  Satellite,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";
import SessionRouteReport from "@/components/instructor/SessionRouteReport";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DriverTimesheets } from "@/components/instructor/DriverTimesheets";
import { PupilDrivingLeaderboard } from "@/components/instructor/PupilDrivingLeaderboard";

interface SavedRoute {
  id: string;
  name: string;
  description: string | null;
  route_type: string | null;
  category: string | null;
  start_location: string | null;
  end_location: string | null;
  distance_km: number | null;
  duration_minutes: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  telematics_id: string | null;
  test_centre_id: string | null;
  route_path: Array<{ lat: number; lon: number }> | null;
  created_at: string;
  test_centres?: { name: string } | null;
}

interface TestCentre {
  id: string;
  name: string;
}

// Convert km/h to mph
const toMph = (kmh: number | null) => kmh ? Math.round(kmh * 0.621371) : null;
const toMiles = (km: number | null) => km ? (km * 0.621371).toFixed(1) : null;

// Generate SVG path from route coordinates
const generateRoutePath = (points: Array<{ lat: number; lon: number }> | null): string => {
  if (!points || points.length < 2) return '';
  
  const width = 120;
  const height = 60;
  const padding = 8;
  
  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  
  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;
  
  const coords = points.map(p => {
    const x = padding + ((p.lon - minLon) / lonRange) * (width - 2 * padding);
    const y = padding + ((maxLat - p.lat) / latRange) * (height - 2 * padding);
    return `${x},${y}`;
  });
  
  return `M ${coords.join(' L ')}`;
};

export default function InstructorRoutes() {
  const { instructor } = useInstructorAuth();
  const navigate = useNavigate();
  const { activeProvider } = useActiveTrackingProvider(instructor?.id);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);
  
  // Test route mode state
  const [testRouteMode, setTestRouteMode] = useState(false);
  const [selectedTestCentre, setSelectedTestCentre] = useState<string>("");

  useEffect(() => {
    if (instructor?.id) {
      fetchRoutes();
      fetchTestCentres();
      fetchTestRouteMode();
    }
  }, [instructor?.id]);

  const fetchRoutes = async () => {
    if (!instructor?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("saved_routes")
        .select(`
          *,
          test_centres(name)
        `)
        .eq("instructor_id", instructor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoutes((data as unknown as SavedRoute[]) || []);
    } catch (err) {
      console.error("Error fetching routes:", err);
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTestCentres = async () => {
    try {
      const { data, error } = await supabase
        .from("test_centres")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTestCentres(data || []);
    } catch (err) {
      console.error("Error fetching test centres:", err);
    }
  };

  const fetchTestRouteMode = async () => {
    if (!instructor?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("is_test_route_mode")
        .eq("instructor_id", instructor.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        setTestRouteMode(data.is_test_route_mode || false);
      }
    } catch (err) {
      console.error("Error fetching test route mode:", err);
    }
  };

  const toggleTestRouteMode = async (enabled: boolean) => {
    if (!instructor?.id) return;
    
    try {
      const { error } = await supabase
        .from("gps_devices")
        .update({ is_test_route_mode: enabled })
        .eq("instructor_id", instructor.id)
        .eq("is_active", true);

      if (error) throw error;
      
      setTestRouteMode(enabled);
      toast.success(enabled ? "Test route mode enabled" : "Test route mode disabled");
    } catch (err) {
      console.error("Error toggling test route mode:", err);
      toast.error("Failed to update mode");
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from("saved_routes")
        .delete()
        .eq("id", routeId);

      if (error) throw error;
      
      setRoutes(routes.filter(r => r.id !== routeId));
      toast.success("Route deleted");
    } catch (err) {
      console.error("Error deleting route:", err);
      toast.error("Failed to delete route");
    }
  };

  const updateRoute = async () => {
    if (!editingRoute) return;
    
    try {
      const { error } = await supabase
        .from("saved_routes")
        .update({
          name: editingRoute.name,
          description: editingRoute.description,
          route_type: editingRoute.route_type,
          test_centre_id: editingRoute.test_centre_id || null,
        })
        .eq("id", editingRoute.id);

      if (error) throw error;
      
      setRoutes(routes.map(r => r.id === editingRoute.id ? editingRoute : r));
      setShowEditDialog(false);
      setEditingRoute(null);
      toast.success("Route updated");
    } catch (err) {
      console.error("Error updating route:", err);
      toast.error("Failed to update route");
    }
  };

  const markAsTestRoute = async (route: SavedRoute) => {
    try {
      const { error } = await supabase
        .from("saved_routes")
        .update({ route_type: "test" })
        .eq("id", route.id);

      if (error) throw error;
      
      setRoutes(routes.map(r => r.id === route.id ? { ...r, route_type: "test" } : r));
      toast.success("Marked as test route");
    } catch (err) {
      console.error("Error marking route:", err);
      toast.error("Failed to update route");
    }
  };

  // Filter routes based on tab and search
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = !searchQuery || 
      route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.start_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.end_location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "test") return matchesSearch && route.route_type === "test";
    if (activeTab === "driving_test") return matchesSearch && route.route_type === "driving_test";
    if (activeTab === "practice") return matchesSearch && route.route_type === "practice";
    return matchesSearch;
  });

  const RouteCard = ({ route }: { route: SavedRoute }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Route thumbnail */}
          <div className="w-28 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
            {route.route_path && route.route_path.length >= 2 ? (
              <svg viewBox="0 0 120 60" className="w-full h-full">
                <path
                  d={generateRoutePath(route.route_path)}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {route.route_path.length > 0 && (
                  <>
                    <circle
                      cx={8 + ((route.route_path[0].lon - Math.min(...route.route_path.map(p => p.lon))) / 
                        (Math.max(...route.route_path.map(p => p.lon)) - Math.min(...route.route_path.map(p => p.lon)) || 0.001)) * 104}
                      cy={8 + ((Math.max(...route.route_path.map(p => p.lat)) - route.route_path[0].lat) / 
                        (Math.max(...route.route_path.map(p => p.lat)) - Math.min(...route.route_path.map(p => p.lat)) || 0.001)) * 44}
                      r="4"
                      fill="hsl(142 71% 45%)"
                    />
                    <circle
                      cx={8 + ((route.route_path[route.route_path.length-1].lon - Math.min(...route.route_path.map(p => p.lon))) / 
                        (Math.max(...route.route_path.map(p => p.lon)) - Math.min(...route.route_path.map(p => p.lon)) || 0.001)) * 104}
                      cy={8 + ((Math.max(...route.route_path.map(p => p.lat)) - route.route_path[route.route_path.length-1].lat) / 
                        (Math.max(...route.route_path.map(p => p.lat)) - Math.min(...route.route_path.map(p => p.lat)) || 0.001)) * 44}
                      r="4"
                      fill="hsl(0 84% 60%)"
                    />
                  </>
                )}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Route className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Route info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{route.name}</h3>
                  {route.route_type === "test" && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      Test
                    </Badge>
                  )}
                  {route.route_type === "driving_test" && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Driving Test
                    </Badge>
                  )}
                </div>
                {route.test_centres?.name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {route.test_centres.name}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border">
                  <DropdownMenuItem onClick={() => {
                    setEditingRoute(route);
                    setShowEditDialog(true);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {route.route_type !== "test" && (
                    <DropdownMenuItem onClick={() => markAsTestRoute(route)}>
                      <Flag className="h-4 w-4 mr-2" />
                      Mark as Test Route
                    </DropdownMenuItem>
                  )}
                  {route.telematics_id && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/instructor/trip-replay/${route.id}`)}>
                        <Play className="h-4 w-4 mr-2" />
                        Replay Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedRoute(route);
                        setShowReportSheet(true);
                      }}>
                        <Navigation className="h-4 w-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteRoute(route.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Location */}
            {(route.start_location || route.end_location) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="truncate">{route.start_location || 'Start'}</span>
                <span>→</span>
                <span className="truncate">{route.end_location || 'End'}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {route.distance_km && (
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {toMiles(route.distance_km)} mi
                </span>
              )}
              {route.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {route.duration_minutes} min
                </span>
              )}
              {route.avg_speed_kmh && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {toMph(route.avg_speed_kmh)} mph avg
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <InstructorPortalLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Route className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Saved Routes
            </h1>
            <p className="text-muted-foreground text-sm ml-10">Your recorded driving routes</p>
          </div>
        </div>


        {/* Test Route Mode Card */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Flag className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <Label className="font-medium">Test Route Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    {testRouteMode 
                      ? "Next trip will be saved as a test route" 
                      : "Enable to record test routes"}
                  </p>
                </div>
              </div>
              <Switch 
                checked={testRouteMode} 
                onCheckedChange={toggleTestRouteMode}
              />
            </div>
            
            {testRouteMode && (
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <Label className="text-xs text-muted-foreground">Link to Test Centre</Label>
                <Select value={selectedTestCentre} onValueChange={setSelectedTestCentre}>
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Select test centre (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="none">No test centre</SelectItem>
                    {testCentres.map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="-mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-visible">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 text-[11px] gap-1">
                <TabsTrigger value="all" className="whitespace-nowrap">All</TabsTrigger>
                <TabsTrigger value="timesheets" className="whitespace-nowrap">
                  <Clock className="h-3 w-3 mr-0.5" />
                  Hours
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="whitespace-nowrap">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  Scores
                </TabsTrigger>
                <TabsTrigger value="driving_test" className="whitespace-nowrap">
                  <CheckCircle className="h-3 w-3 mr-0.5" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="test" className="whitespace-nowrap">
                  <Flag className="h-3 w-3 mr-0.5" />
                  Routes
                </TabsTrigger>
                <TabsTrigger value="practice" className="whitespace-nowrap">Practice</TabsTrigger>
              </TabsList>
            </div>

            {/* GPS Trips Tab Content */}
            {activeTab === "timesheets" ? (
            
              <div className="mt-4">
                {instructor?.id && (
                  <DriverTimesheets instructorId={instructor.id} />
                )}
              </div>
            ) : activeTab === "leaderboard" ? (
              <div className="mt-4">
                {instructor?.id && (
                  <PupilDrivingLeaderboard instructorId={instructor.id} />
                )}
              </div>
            ) : (
              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Skeleton className="w-28 h-16 rounded-md" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium mb-1">No routes found</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "driving_test" 
                          ? "Use the 'Driving Test' button to record actual driving test routes"
                          : activeTab === "test" 
                          ? "Use the 'Test Route' option to save practice test routes"
                          : "Complete trips to save routes here"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredRoutes.map(route => (
                      <RouteCard key={route.id} route={route} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Route Report Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Route Report</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full mt-4">
            {selectedRoute?.telematics_id && (
              <SessionRouteReport 
                telematicsId={selectedRoute.telematics_id} 
                onClose={() => setShowReportSheet(false)}
              />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Edit Route Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
          </DialogHeader>
          
          {editingRoute && (
            <div className="space-y-4">
              <div>
                <Label>Route Name</Label>
                <Input 
                  value={editingRoute.name} 
                  onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Input 
                  value={editingRoute.description || ""} 
                  onChange={(e) => setEditingRoute({ ...editingRoute, description: e.target.value })}
                  className="mt-1"
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <Label>Route Type</Label>
                <Select 
                  value={editingRoute.route_type || "practice"} 
                  onValueChange={(v) => setEditingRoute({ ...editingRoute, route_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="practice">Practice Route</SelectItem>
                    <SelectItem value="test">Test Route</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Test Centre</Label>
                <Select 
                  value={editingRoute.test_centre_id || "none"} 
                  onValueChange={(v) => setEditingRoute({ ...editingRoute, test_centre_id: v === "none" ? null : v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select test centre" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    <SelectItem value="none">None</SelectItem>
                    {testCentres.map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateRoute}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InstructorPortalLayout>
  );
}
