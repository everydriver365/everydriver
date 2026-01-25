import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Route, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ChevronRight, 
  Car,
  Gauge,
  ArrowUpDown,
  CalendarIcon,
  Download,
  Filter,
  X
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import SessionRouteReport from "./SessionRouteReport";
import { generateDrivingReportPDF } from "./DrivingReportPDF";
import { toast } from "sonner";

interface TrackingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  speeding_count?: number;
  harsh_braking_count?: number;
}

interface GPSPoint {
  latitude: number;
  longitude: number;
}

interface PupilTrackingHistoryProps {
  pupilId: string;
  pupilName: string;
}

type SortOption = "date_desc" | "date_asc" | "distance_desc" | "duration_desc";

export function PupilTrackingHistory({ pupilId, pupilName }: PupilTrackingHistoryProps) {
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [routePreviews, setRoutePreviews] = useState<Record<string, GPSPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  
  // Filter & sort state
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [pupilId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh")
        .eq("pupil_id", pupilId)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch event counts and route previews for each session
      const sessionsWithData = await Promise.all(
        (data || []).map(async (session) => {
          const [speedingResult, brakingResult, routeResult] = await Promise.all([
            supabase
              .from("driving_behavior_events")
              .select("*", { count: "exact", head: true })
              .eq("telematics_id", session.id)
              .eq("event_type", "speeding"),
            supabase
              .from("driving_behavior_events")
              .select("*", { count: "exact", head: true })
              .eq("telematics_id", session.id)
              .eq("event_type", "harsh_braking"),
            supabase
              .from("telematics_gps_points")
              .select("latitude, longitude")
              .eq("telematics_id", session.id)
              .order("recorded_at", { ascending: true })
              .limit(100)
          ]);

          // Store route preview
          if (routeResult.data && routeResult.data.length > 0) {
            setRoutePreviews(prev => ({
              ...prev,
              [session.id]: routeResult.data as GPSPoint[]
            }));
          }

          return {
            ...session,
            speeding_count: speedingResult.count || 0,
            harsh_braking_count: brakingResult.count || 0,
          };
        })
      );

      setSessions(sessionsWithData);
    } catch (error) {
      console.error("Error fetching tracking sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string, endedAt: string | null) => {
    if (!endedAt) return "-";
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getDurationMinutes = (startedAt: string, endedAt: string | null): number => {
    if (!endedAt) return 0;
    return Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  };

  const handleViewReport = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowReport(true);
  };

  const handleExportPDF = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.loading("Generating PDF...");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-route-report', {
        body: { telematicsId: sessionId }
      });

      if (error) throw error;
      if (data.error) {
        toast.dismiss();
        toast.error(data.message || 'Could not generate PDF');
        return;
      }

      await generateDrivingReportPDF(data);
      toast.dismiss();
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.dismiss();
      toast.error("Failed to generate PDF");
    }
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortBy("date_desc");
  };

  const hasActiveFilters = dateFrom || dateTo || sortBy !== "date_desc";

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Date filters
    if (dateFrom) {
      result = result.filter(s => isAfter(new Date(s.started_at), startOfDay(dateFrom)));
    }
    if (dateTo) {
      result = result.filter(s => isBefore(new Date(s.started_at), endOfDay(dateTo)));
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
        case "distance_desc":
          return (b.total_distance_km || 0) - (a.total_distance_km || 0);
        case "duration_desc":
          return getDurationMinutes(b.started_at, b.ended_at) - getDurationMinutes(a.started_at, a.ended_at);
        case "date_desc":
        default:
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
      }
    });

    return result;
  }, [sessions, sortBy, dateFrom, dateTo]);

  // Generate simple SVG path for route thumbnail
  const generateRoutePath = (points: GPSPoint[]): string => {
    if (!points || points.length < 2) return "";
    
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const width = 60;
    const height = 40;
    const padding = 4;
    
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    
    const coords = points.map(p => {
      const x = padding + ((p.longitude - minLng) / lngRange) * (width - 2 * padding);
      const y = padding + ((maxLat - p.latitude) / latRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${coords.join(" L ")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          Loading tracking history...
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-muted-foreground">
          No tracking sessions recorded for this pupil yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Tracking History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredSessions.length} trips
              </Badge>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="flex flex-wrap gap-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Newest first</SelectItem>
                    <SelectItem value="date_asc">Oldest first</SelectItem>
                    <SelectItem value="distance_desc">Longest distance</SelectItem>
                    <SelectItem value="duration_desc">Longest duration</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dateFrom ? format(dateFrom, "dd MMM") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dateTo ? format(dateTo, "dd MMM") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-8 text-xs text-muted-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {filteredSessions.map((session) => {
                const routePoints = routePreviews[session.id];
                const alertCount = (session.speeding_count || 0) + (session.harsh_braking_count || 0);
                
                return (
                  <div
                    key={session.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Route Thumbnail */}
                      <div className="flex-shrink-0 w-16 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                        {routePoints && routePoints.length >= 2 ? (
                          <svg viewBox="0 0 60 40" className="w-full h-full">
                            <path
                              d={generateRoutePath(routePoints)}
                              fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Start dot */}
                            <circle
                              cx={4 + ((routePoints[0].longitude - Math.min(...routePoints.map(p => p.longitude))) / (Math.max(...routePoints.map(p => p.longitude)) - Math.min(...routePoints.map(p => p.longitude)) || 0.001)) * 52}
                              cy={4 + ((Math.max(...routePoints.map(p => p.latitude)) - routePoints[0].latitude) / (Math.max(...routePoints.map(p => p.latitude)) - Math.min(...routePoints.map(p => p.latitude)) || 0.001)) * 32}
                              r="3"
                              className="fill-green-500"
                            />
                            {/* End dot */}
                            <circle
                              cx={4 + ((routePoints[routePoints.length - 1].longitude - Math.min(...routePoints.map(p => p.longitude))) / (Math.max(...routePoints.map(p => p.longitude)) - Math.min(...routePoints.map(p => p.longitude)) || 0.001)) * 52}
                              cy={4 + ((Math.max(...routePoints.map(p => p.latitude)) - routePoints[routePoints.length - 1].latitude) / (Math.max(...routePoints.map(p => p.latitude)) - Math.min(...routePoints.map(p => p.latitude)) || 0.001)) * 32}
                              r="3"
                              className="fill-destructive"
                            />
                          </svg>
                        ) : (
                          <Route className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Session Info */}
                      <button
                        onClick={() => handleViewReport(session.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{format(new Date(session.started_at), "dd MMM yyyy")}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(session.started_at), "HH:mm")}
                          </span>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.started_at, session.ended_at)}
                          </span>
                          {session.total_distance_km && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(session.total_distance_km * 0.621371).toFixed(1)} mi
                            </span>
                          )}
                          {session.avg_speed_kmh && (
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              Avg {Math.round(session.avg_speed_kmh * 0.621371)} mph
                            </span>
                          )}
                          {session.max_speed_kmh && (
                            <span className="flex items-center gap-1 text-amber-600">
                              Max {Math.round(session.max_speed_kmh * 0.621371)} mph
                            </span>
                          )}
                        </div>
                        
                        {/* Alerts */}
                        {alertCount > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {alertCount} alert{alertCount !== 1 ? 's' : ''}
                            {session.speeding_count ? ` (${session.speeding_count} speeding)` : ''}
                          </div>
                        )}
                      </button>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleExportPDF(session.id, e)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReport(session.id)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={showReport} onOpenChange={setShowReport}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Route Report - {pupilName}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100%-4rem)]">
            {selectedSessionId && (
              <SessionRouteReport
                telematicsId={selectedSessionId}
                onClose={() => setShowReport(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
