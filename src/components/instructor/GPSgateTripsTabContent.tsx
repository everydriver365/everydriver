import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Clock, 
  Gauge, 
  Route, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Download,
  User,
  Check
} from "lucide-react";
import { useGPSgateTrips, GPSgateTripSummary } from "@/hooks/useGPSgateTrips";
import { kmToMiles, kmhToMph } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GPSgateTripsTabContentProps {
  instructorId: string;
}

interface Pupil {
  id: string;
  name: string;
}

export function GPSgateTripsTabContent({ instructorId }: GPSgateTripsTabContentProps) {
  const { trips, meta, loading, error, fetchTrips } = useGPSgateTrips(instructorId);
  const [selectedRange, setSelectedRange] = useState<"7d" | "14d" | "30d">("7d");
  const [syncing, setSyncing] = useState(false);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<string>("");

  useEffect(() => {
    const days = selectedRange === "7d" ? 7 : selectedRange === "14d" ? 14 : 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    fetchTrips(fromDate, new Date());
  }, [instructorId, selectedRange, fetchTrips]);

  useEffect(() => {
    // Fetch pupils for assignment
    const fetchPupils = async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .order("name");
      setPupils(data || []);
    };
    fetchPupils();
  }, [instructorId]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  const handleSyncToMileage = async () => {
    setSyncing(true);
    try {
      const days = selectedRange === "7d" ? 7 : selectedRange === "14d" ? 14 : 30;
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data, error: syncError } = await supabase.functions.invoke("gpsgate-trips", {
        body: {
          instructorId,
          fromDate: fromDate.toISOString(),
          toDate: new Date().toISOString(),
          syncToMileage: true,
          pupilId: selectedPupil || null,
        },
      });

      if (syncError) throw syncError;

      const syncedCount = data?.meta?.syncedCount || 0;
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} trips to mileage log`);
      } else {
        toast.info("All trips are already synced");
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Failed to sync trips");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["7d", "14d", "30d"] as const).map((range) => (
            <Button
              key={range}
              variant={selectedRange === range ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedRange(range)}
            >
              {range === "7d" ? "7 Days" : range === "14d" ? "14 Days" : "30 Days"}
            </Button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => {
            const days = selectedRange === "7d" ? 7 : selectedRange === "14d" ? 14 : 30;
            fetchTrips(new Date(Date.now() - days * 24 * 60 * 60 * 1000), new Date());
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Sync to Mileage Section */}
      {trips.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync to Mileage Log</span>
              <Badge variant="secondary" className="text-xs">
                For Tax Records
              </Badge>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPupil} onValueChange={setSelectedPupil}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Assign to pupil (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No pupil (personal)</SelectItem>
                  {pupils.map((pupil) => (
                    <SelectItem key={pupil.id} value={pupil.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {pupil.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleSyncToMileage}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Sync
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPupil ? "Trips will be marked as business (tax deductible)" : "Trips will be marked as personal"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {meta && !loading && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{meta.totalTrips}</div>
              <div className="text-xs text-muted-foreground">Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{kmToMiles(meta.totalDistanceKm).toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Miles</div>
            </CardContent>
          </Card>
          <Card className={meta.tripsWithOverspeeding > 0 ? "border-destructive/50" : ""}>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${meta.tripsWithOverspeeding > 0 ? "text-destructive" : ""}`}>
                {meta.tripsWithOverspeeding}
              </div>
              <div className="text-xs text-muted-foreground">Speeding</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trip List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
            <h3 className="font-medium mb-1">Failed to load trips</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => fetchTrips()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : trips.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No trips found</h3>
            <p className="text-sm text-muted-foreground">
              Trips from your GPSgate tracker will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <GPSTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}

interface GPSTripCardProps {
  trip: GPSgateTripSummary;
}

function GPSTripCard({ trip }: GPSTripCardProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <Card className={trip.hasOverspeeding ? "border-destructive/30" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Mini route visualization placeholder */}
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
            trip.hasOverspeeding ? "bg-destructive/10" : "bg-muted"
          }`}>
            {trip.hasOverspeeding ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <Route className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Trip info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {format(new Date(trip.startTime), "EEE, d MMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(trip.startTime), "h:mm a")} – {format(new Date(trip.endTime), "h:mm a")}
                </p>
              </div>
              
              {trip.hasOverspeeding && (
                <Badge variant="destructive" className="text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Speeding
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(trip.durationMinutes)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {kmToMiles(trip.distanceKm).toFixed(1)} mi
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {Math.round(kmhToMph(trip.avgSpeedKmh))} mph
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {Math.round(kmhToMph(trip.maxSpeedKmh))} max
              </span>
            </div>

            {/* Speeding details */}
            {trip.hasOverspeeding && (
              <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                {trip.speedingTimeMinutes > 0 && (
                  <span>{formatDuration(trip.speedingTimeMinutes)} over limit</span>
                )}
                {trip.speedingMaxExcessKmh > 0 && (
                  <span>• +{Math.round(kmhToMph(trip.speedingMaxExcessKmh))} mph excess</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
