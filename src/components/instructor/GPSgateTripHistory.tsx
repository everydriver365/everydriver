import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Clock, 
  Gauge, 
  Route, 
  ChevronRight, 
  ArrowLeft,
  AlertTriangle,
  Calendar,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useGPSgateTrips, GPSgateTripSummary } from "@/hooks/useGPSgateTrips";
import { kmToMiles, kmhToMph } from "@/lib/utils";

interface GPSgateTripHistoryProps {
  instructorId: string;
  onBack: () => void;
  onSelectTrip?: (trip: GPSgateTripSummary) => void;
}

export function GPSgateTripHistory({ 
  instructorId, 
  onBack,
  onSelectTrip 
}: GPSgateTripHistoryProps) {
  const { trips, meta, loading, error, fetchTrips } = useGPSgateTrips(instructorId);
  const [selectedRange, setSelectedRange] = useState<"7d" | "14d" | "30d">("7d");

  useEffect(() => {
    const days = selectedRange === "7d" ? 7 : selectedRange === "14d" ? 14 : 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    fetchTrips(fromDate, new Date());
  }, [instructorId, selectedRange, fetchTrips]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base">Trip History</CardTitle>
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

        {/* Date Range Selector */}
        <div className="flex gap-2 mt-2">
          {(["7d", "14d", "30d"] as const).map((range) => (
            <Button
              key={range}
              variant={selectedRange === range ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setSelectedRange(range)}
            >
              {range === "7d" ? "7 Days" : range === "14d" ? "14 Days" : "30 Days"}
            </Button>
          ))}
        </div>

        {/* Summary Stats */}
        {meta && !loading && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{meta.totalTrips}</div>
              <div className="text-[10px] text-muted-foreground">Trips</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{kmToMiles(meta.totalDistanceKm).toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground">Miles</div>
            </div>
            <div className={`rounded-lg p-2 text-center ${meta.tripsWithOverspeeding > 0 ? "bg-destructive/10" : "bg-muted/50"}`}>
              <div className={`text-lg font-bold ${meta.tripsWithOverspeeding > 0 ? "text-destructive" : ""}`}>
                {meta.tripsWithOverspeeding}
              </div>
              <div className="text-[10px] text-muted-foreground">Speeding</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50 text-destructive" />
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => fetchTrips()}
            >
              Try Again
            </Button>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-8 px-4 text-muted-foreground">
            <Route className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No trips found</p>
            <p className="text-sm mt-1">Trips will appear here when tracked via GPSgate</p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-2">
              {trips.map((trip) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onClick={() => onSelectTrip?.(trip)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface TripCardProps {
  trip: GPSgateTripSummary;
  onClick?: () => void;
}

function TripCard({ trip, onClick }: TripCardProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors group ${
        trip.hasOverspeeding 
          ? "bg-destructive/5 hover:bg-destructive/10 border border-destructive/20" 
          : "bg-muted/30 hover:bg-muted/50"
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm">
            {format(new Date(trip.startTime), "EEE, d MMM yyyy")}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(trip.startTime), "h:mm a")} – {format(new Date(trip.endTime), "h:mm a")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(trip.startTime), { addSuffix: true })}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
      </div>
      
      {/* Stats Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDuration(trip.durationMinutes)}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {kmToMiles(trip.distanceKm).toFixed(1)} mi
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Gauge className="h-3 w-3" />
          Avg {Math.round(kmhToMph(trip.avgSpeedKmh))} mph
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          Max {Math.round(kmhToMph(trip.maxSpeedKmh))} mph
        </div>
      </div>

      {/* Speeding Warning */}
      {trip.hasOverspeeding && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="destructive" className="text-[10px] h-5">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overspeeding
          </Badge>
          {trip.speedingTimeMinutes > 0 && (
            <span className="text-[10px] text-destructive">
              {formatDuration(trip.speedingTimeMinutes)} over limit
            </span>
          )}
          {trip.speedingMaxExcessKmh > 0 && (
            <span className="text-[10px] text-destructive">
              +{Math.round(kmhToMph(trip.speedingMaxExcessKmh))} mph max
            </span>
          )}
        </div>
      )}
    </button>
  );
}
