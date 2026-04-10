import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Route, MapPin, Download, FileText, Eye, Trash2, 
  Calendar, Ruler, Clock, AlertTriangle, ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SavedRoute {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  start_location: string | null;
  end_location: string | null;
  distance_km: number | null;
  created_at: string;
  route_type: string;
  telematics_id: string | null;
}

interface Waypoint {
  sequence: number;
  latitude: number;
  longitude: number;
  name: string | null;
}

interface RouteReport {
  waypoints: Waypoint[];
  alerts: Array<{
    type: string;
    severity: string;
    speed_kmh: number | null;
    speed_limit_kmh: number | null;
    road_name: string | null;
    recorded_at: string;
  }>;
}

interface SavedRoutesViewerProps {
  instructorId: string;
}

const categoryLabels: Record<string, string> = {
  test_routes: "Test Routes",
  training: "Training Routes",
  manoeuvres: "Manoeuvres Practice",
  motorway: "Motorway Driving",
  night: "Night Driving",
  general: "General",
};

export function SavedRoutesViewer({ instructorId }: SavedRoutesViewerProps) {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [routeReport, setRouteReport] = useState<RouteReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showReportDialog, setShowReportDialog] = useState(false);

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
      console.error("Error fetching routes:", error);
      toast.error("Failed to load saved routes");
    } finally {
      setLoading(false);
    }
  };

  const loadRouteReport = async (route: SavedRoute) => {
    setSelectedRoute(route);
    setLoadingReport(true);
    setShowReportDialog(true);

    try {
      // Fetch waypoints
      const { data: waypoints, error: waypointsError } = await supabase
        .from("saved_route_waypoints")
        .select("sequence, latitude, longitude, name")
        .eq("route_id", route.id)
        .order("sequence", { ascending: true });

      if (waypointsError) throw waypointsError;

      // Fetch alerts if telematics session exists
      let alerts: RouteReport["alerts"] = [];
      if (route.telematics_id) {
        const { data: alertsData } = await supabase
          .from("telematics_alerts")
          .select("alert_type, severity, speed_kmh, speed_limit_kmh, road_name, created_at")
          .eq("telematics_id", route.telematics_id)
          .order("created_at", { ascending: true });

        alerts = (alertsData || []).map(a => ({
          type: a.alert_type,
          severity: a.severity,
          speed_kmh: a.speed_kmh,
          speed_limit_kmh: a.speed_limit_kmh,
          road_name: a.road_name,
          recorded_at: a.created_at,
        }));
      }

      setRouteReport({
        waypoints: waypoints || [],
        alerts,
      });
    } catch (error) {
      console.error("Error loading route report:", error);
      toast.error("Failed to load route details");
    } finally {
      setLoadingReport(false);
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      const { error } = await supabase
        .from("saved_routes")
        .delete()
        .eq("id", routeId);

      if (error) throw error;

      setRoutes(prev => prev.filter(r => r.id !== routeId));
      toast.success("Route deleted");
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error("Failed to delete route");
    }
  };

  const exportToCSV = () => {
    if (!selectedRoute || !routeReport) return;

    const headers = ["Sequence", "Road Name", "Latitude", "Longitude"];
    const waypointRows = routeReport.waypoints.map(w => 
      [w.sequence, w.name || "Unknown", w.latitude, w.longitude].join(",")
    );

    const alertHeaders = ["Time", "Type", "Severity", "Speed (mph)", "Limit (mph)", "Road"];
    const alertRows = routeReport.alerts.map(a => 
      [
        format(new Date(a.recorded_at), "HH:mm:ss"),
        a.type,
        a.severity,
        a.speed_kmh ? Math.round(a.speed_kmh * 0.621371) : "",
        a.speed_limit_kmh ? Math.round(a.speed_limit_kmh * 0.621371) : "",
        a.road_name || ""
      ].join(",")
    );

    const csv = [
      `Route: ${selectedRoute.name}`,
      `Date: ${format(new Date(selectedRoute.created_at), "dd/MM/yyyy")}`,
      `Distance: ${selectedRoute.distance_km?.toFixed(1) || "?"} km`,
      "",
      "WAYPOINTS",
      headers.join(","),
      ...waypointRows,
      "",
      "ALERTS",
      alertHeaders.join(","),
      ...alertRows,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRoute.name.replace(/\s+/g, "_")}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportToPDF = () => {
    if (!selectedRoute || !routeReport) return;

    const doc = new jsPDF();
    const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

    // Title
    doc.setFontSize(18);
    doc.text(`Route Report: ${selectedRoute.name}`, 14, 20);

    // Summary
    doc.setFontSize(11);
    doc.text(`Date: ${format(new Date(selectedRoute.created_at), "dd/MM/yyyy HH:mm")}`, 14, 30);
    doc.text(`Distance: ${selectedRoute.distance_km?.toFixed(1) || "?"} km`, 14, 36);
    doc.text(`Start: ${selectedRoute.start_location || "Unknown"}`, 14, 42);
    doc.text(`End: ${selectedRoute.end_location || "Unknown"}`, 14, 48);
    doc.text(`Total Waypoints: ${routeReport.waypoints.length}`, 14, 54);
    doc.text(`Total Alerts: ${routeReport.alerts.length}`, 14, 60);

    // Roads Summary
    const roadCounts = routeReport.waypoints.reduce((acc, w) => {
      const road = w.name || "Unknown Road";
      acc[road] = (acc[road] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    doc.setFontSize(14);
    doc.text("Roads Travelled", 14, 75);

    autoTable(doc, {
      startY: 80,
      head: [["Road Name", "Points on Road"]],
      body: Object.entries(roadCounts).map(([road, count]) => [road, count]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Alerts Table
    if (routeReport.alerts.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      
      doc.setFontSize(14);
      doc.text("Driving Alerts", 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [["Time", "Type", "Severity", "Speed (mph)", "Limit (mph)", "Road"]],
        body: routeReport.alerts.map(a => [
          format(new Date(a.recorded_at), "HH:mm:ss"),
          a.type.replace(/_/g, " "),
          a.severity,
          a.speed_kmh ? kmhToMph(a.speed_kmh) : "-",
          a.speed_limit_kmh ? kmhToMph(a.speed_limit_kmh) : "-",
          a.road_name || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    doc.save(`${selectedRoute.name.replace(/\s+/g, "_")}_report.pdf`);
    toast.success("PDF exported");
  };

  const filteredRoutes = categoryFilter === "all" 
    ? routes 
    : routes.filter(r => r.category === categoryFilter || (categoryFilter === "general" && !r.category));

  const categories = [...new Set(routes.map(r => r.category || "general"))];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading saved routes...
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
              <Route className="h-4 w-4" />
              Saved Routes
            </CardTitle>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRoutes.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No saved routes yet. Track a lesson and save the route!
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="divide-y">
                {filteredRoutes.map(route => (
                  <div
                    key={route.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{route.name}</p>
                          {route.category && route.category !== "general" && (
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {categoryLabels[route.category] || route.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(route.created_at), "dd MMM")}
                          </span>
                          {route.distance_km && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {route.distance_km.toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => loadRouteReport(route)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteRoute(route.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Route Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedRoute?.name || "Route Report"}
            </DialogTitle>
          </DialogHeader>

          {loadingReport ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading route data...
            </div>
          ) : routeReport ? (
            <div className="flex-1 overflow-auto space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-none p-3">
                  <p className="text-muted-foreground text-xs">Distance</p>
                  <p className="font-semibold">{selectedRoute?.distance_km ? (selectedRoute.distance_km * 0.621371).toFixed(1) : "?"} mi</p>
                </div>
                <div className="bg-muted/50 rounded-none p-3">
                  <p className="text-muted-foreground text-xs">Waypoints</p>
                  <p className="font-semibold">{routeReport.waypoints.length}</p>
                </div>
                <div className="bg-muted/50 rounded-none p-3">
                  <p className="text-muted-foreground text-xs">Alerts</p>
                  <p className="font-semibold text-destructive">{routeReport.alerts.length}</p>
                </div>
                <div className="bg-muted/50 rounded-none p-3">
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-semibold">{selectedRoute ? format(new Date(selectedRoute.created_at), "dd/MM/yy") : "-"}</p>
                </div>
              </div>

              {/* Roads Summary */}
              <div>
                <p className="text-sm font-medium mb-2">Roads Travelled</p>
                <div className="bg-card border rounded-none max-h-[120px] overflow-auto">
                  {Object.entries(
                    routeReport.waypoints.reduce((acc, w) => {
                      const road = w.name || "Unknown Road";
                      acc[road] = (acc[road] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([road, count], i) => (
                    <div key={road} className={`flex items-center justify-between px-3 py-1.5 text-xs ${i > 0 ? "border-t" : ""}`}>
                      <span className="truncate">{road}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">{count} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              {routeReport.alerts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Driving Alerts
                  </p>
                  <div className="bg-card border rounded-none max-h-[150px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Time</th>
                          <th className="px-2 py-1.5 text-left">Type</th>
                          <th className="px-2 py-1.5 text-right">Speed</th>
                          <th className="px-2 py-1.5 text-right">Limit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {routeReport.alerts.map((alert, i) => (
                          <tr key={i} className={alert.severity === "high" ? "bg-destructive/10" : ""}>
                            <td className="px-2 py-1">{format(new Date(alert.recorded_at), "HH:mm")}</td>
                            <td className="px-2 py-1 capitalize">{alert.type.replace(/_/g, " ")}</td>
                            <td className="px-2 py-1 text-right">
                              {alert.speed_kmh ? Math.round(alert.speed_kmh * 0.621371) : "-"}
                            </td>
                            <td className="px-2 py-1 text-right">
                              {alert.speed_limit_kmh ? Math.round(alert.speed_limit_kmh * 0.621371) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!routeReport}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!routeReport}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button size="sm" onClick={() => setShowReportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
