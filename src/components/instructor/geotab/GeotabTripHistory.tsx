import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useGeotabTrips, GeotabTrip } from "@/hooks/useGeotabTrips";
import { useGeotabFuelUsage, FuelRecord } from "@/hooks/useGeotabFuelUsage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Route, Gauge, ArrowUpDown, Play, Fuel, PoundSterling } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TripDetailSheet } from "./TripDetailSheet";

interface GeotabTripHistoryProps {
  instructorId: string;
}

function kmToMiles(km: number): number {
  return km * 0.621371;
}

function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

function calcMpg(distKm: number, litres: number): number | null {
  if (!litres || litres <= 0) return null;
  const miles = distKm * 0.621371;
  const gallons = litres * 0.219969;
  return gallons > 0 ? Math.round((miles / gallons) * 10) / 10 : null;
}

function safeDate(val: string | number | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatSafe(val: string | number | null | undefined, fmt: string, fallback = "—"): string {
  const d = safeDate(val);
  return d ? format(d, fmt) : fallback;
}

export function GeotabTripHistory({ instructorId }: GeotabTripHistoryProps) {
  const [fromDate, setFromDate] = useState<Date>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [toDate, setToDate] = useState<Date>(new Date());
  const [sortField, setSortField] = useState<keyof GeotabTrip>("startTime");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<GeotabTrip | null>(null);

  const { data, isLoading, error } = useGeotabTrips(instructorId, fromDate, toDate);
  const { data: fuelData } = useGeotabFuelUsage(instructorId, fromDate, toDate);
  const navigate = useNavigate();

  // Build a lookup map matching fuel records to trips by timestamp proximity (±60s)
  const fuelLookup = useMemo(() => {
    const map = new Map<string, FuelRecord>();
    if (!fuelData?.records || !data?.trips) return map;
    for (const trip of data.trips) {
      const tripTime = new Date(trip.startTime).getTime();
      const match = fuelData.records.find((r) => {
        if (!r.trip_start) return false;
        return Math.abs(new Date(r.trip_start).getTime() - tripTime) < 60000;
      });
      if (match) map.set(trip.id, match);
    }
    return map;
  }, [data?.trips, fuelData?.records]);

  const toggleSort = (field: keyof GeotabTrip) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedTrips = [...(data?.trips || [])].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal == null || bVal == null) return 0;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortAsc ? cmp : -cmp;
  });

  const setRange = (days: number) => {
    setFromDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    setToDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {data?.meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{data.meta.totalTrips}</p>
              <p className="text-xs text-muted-foreground">Total Trips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{kmToMiles(data.meta.totalDistanceKm).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Miles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">
                {Math.floor(data.meta.totalDurationMinutes / 60)}h {data.meta.totalDurationMinutes % 60}m
              </p>
              <p className="text-xs text-muted-foreground">Drive Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">
                {data.meta.totalTrips > 0
                  ? (kmToMiles(data.meta.totalDistanceKm) / data.meta.totalTrips).toFixed(1)
                  : "0"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Miles/Trip</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {format(fromDate, "dd MMM")} – {format(toDate, "dd MMM yyyy")}
        </Badge>
        <div className="flex gap-1">
          {[1, 7, 14, 30].map((d) => (
            <Button key={d} variant="ghost" size="sm" className="text-xs h-7" onClick={() => setRange(d)}>
              {d === 1 ? "Today" : `${d}d`}
            </Button>
          ))}
        </div>
      </div>

      {/* Trips table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            Failed to load trips: {error.message}
          </CardContent>
        </Card>
      ) : sortedTrips.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No trips found for this period.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("startTime")}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("distanceKm")}>
                  <span className="flex items-center gap-1">
                    <Route className="h-3 w-3" /> Miles <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("durationMinutes")}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Duration <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer hidden sm:table-cell" onClick={() => toggleSort("maxSpeedKmh")}>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> Max <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Idle</TableHead>
                <TableHead className="hidden sm:table-cell">
                  <span className="flex items-center gap-1">
                    <Fuel className="h-3 w-3" /> MPG
                  </span>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <span className="flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" /> Cost
                  </span>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTrips.map((trip) => {
                const fuel = fuelLookup.get(trip.id);
                const mpg = fuel ? calcMpg(fuel.distance_km ?? trip.distanceKm, fuel.fuel_used_litres ?? 0) : null;
                return (
                <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTrip(trip)}>
                  <TableCell className="font-medium text-xs">
                    {formatSafe(trip.startTime, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatSafe(trip.startTime, "HH:mm")}
                    {trip.endTime && ` – ${formatSafe(trip.endTime, "HH:mm")}`}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {kmToMiles(trip.distanceKm).toFixed(1)} mi
                  </TableCell>
                  <TableCell className="text-xs">
                    {trip.durationMinutes >= 60
                      ? `${Math.floor(trip.durationMinutes / 60)}h ${trip.durationMinutes % 60}m`
                      : `${trip.durationMinutes}m`}
                  </TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">
                    {kmhToMph(trip.maxSpeedKmh).toFixed(0)} mph
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {trip.idleMinutes}m
                  </TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">
                    {mpg != null ? `${mpg}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">
                    {fuel?.cost_gbp != null ? `£${fuel.cost_gbp.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {trip.startLat && trip.startLng && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/instructor/trip-replay?lat=${trip.startLat}&lng=${trip.startLng}&date=${trip.startTime}`);
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TripDetailSheet
        trip={selectedTrip}
        fuelRecord={selectedTrip ? fuelLookup.get(selectedTrip.id) ?? null : null}
        open={!!selectedTrip}
        onOpenChange={(open) => { if (!open) setSelectedTrip(null); }}
      />
    </div>
  );
}
