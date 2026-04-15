import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorContext } from "@/contexts/InstructorContext";
import { kmhToMph } from "@/lib/googleMapsLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, AlertTriangle, TrendingUp, Car } from "lucide-react";
import { format } from "date-fns";

interface OverspeedEvent {
  id: string;
  recorded_at: string;
  speed_kmh: number;
  speed_limit_kmh: number;
  excess_kmh: number;
  latitude: number;
  longitude: number;
  road_name: string | null;
  device_id: string;
  device_name: string | null;
}

type SortKey = "recorded_at" | "speed_kmh" | "speed_limit_kmh" | "excess_kmh" | "road_name" | "device_name";

export default function InstructorOverspeedHistory() {
  const { instructorId } = useInstructorContext();
  const [events, setEvents] = useState<OverspeedEvent[]>([]);
  const [devices, setDevices] = useState<{ id: string; device_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("recorded_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch devices list
  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("gps_devices")
      .select("id, device_name")
      .eq("instructor_id", instructorId)
      .eq("tracking_provider", "radius")
      .then(({ data }) => {
        if (data) setDevices(data.map((d: any) => ({ id: d.id, device_name: d.device_name || d.id })));
      });
  }, [instructorId]);

  // Fetch events
  useEffect(() => {
    if (!instructorId) return;
    setIsLoading(true);
    (async () => {
      // Get device IDs for this instructor
      const { data: devData } = await supabase
        .from("gps_devices")
        .select("id, device_name")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "radius");

      if (!devData || devData.length === 0) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const deviceIds = vehicleFilter === "all"
        ? devData.map((d: any) => d.id)
        : [vehicleFilter];
      const deviceNameMap = new Map(devData.map((d: any) => [d.id, d.device_name]));

      const startOfDay = `${dateFrom}T00:00:00Z`;
      const endOfDay = `${dateTo}T23:59:59Z`;

      const { data } = await supabase
        .from("overspeed_events")
        .select("id, recorded_at, speed_kmh, speed_limit_kmh, excess_kmh, latitude, longitude, road_name, device_id")
        .in("device_id", deviceIds)
        .gte("recorded_at", startOfDay)
        .lte("recorded_at", endOfDay)
        .order("recorded_at", { ascending: false })
        .limit(500);

      const mapped: OverspeedEvent[] = (data || []).map((e: any) => ({
        ...e,
        device_name: deviceNameMap.get(e.device_id) || e.device_id,
      }));
      setEvents(mapped);
      setIsLoading(false);
    })();
  }, [instructorId, dateFrom, dateTo, vehicleFilter]);

  // Summary stats — today only
  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayEvents = events.filter((e) => e.recorded_at.startsWith(today));
    const total = todayEvents.length;
    const worstExcess = total > 0 ? Math.max(...todayEvents.map((e) => Number(e.excess_kmh))) : 0;
    const vehicleCounts = new Map<string, number>();
    todayEvents.forEach((e) => {
      vehicleCounts.set(e.device_name || e.device_id, (vehicleCounts.get(e.device_name || e.device_id) || 0) + 1);
    });
    let worstVehicle = "—";
    let maxCount = 0;
    vehicleCounts.forEach((count, name) => {
      if (count > maxCount) { maxCount = count; worstVehicle = name; }
    });
    return { total, worstExcess: Math.round(kmhToMph(worstExcess)), worstVehicle };
  }, [events]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...events];
    copy.sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va == null) va = "";
      if (vb == null) vb = "";
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [events, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const exportCSV = useCallback(() => {
    const header = "Date/Time,Vehicle,Road,Speed (mph),Limit (mph),Excess (mph)\n";
    const rows = sorted.map((e) =>
      `"${format(new Date(e.recorded_at), "dd/MM/yyyy HH:mm:ss")}","${e.device_name || ""}","${e.road_name || ""}",${Math.round(kmhToMph(Number(e.speed_kmh)))},${Math.round(kmhToMph(Number(e.speed_limit_kmh)))},${Math.round(kmhToMph(Number(e.excess_kmh)))}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overspeed-history-${dateFrom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, dateFrom]);

  const sortIcon = (key: SortKey) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Overspeed History</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Events today</p>
            <p className="text-lg font-bold text-foreground">{summary.total}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Worst excess</p>
            <p className="text-lg font-bold text-foreground">{summary.worstExcess} mph</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <Car className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Most events</p>
            <p className="text-sm font-semibold text-foreground truncate">{summary.worstVehicle}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Vehicle</label>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.device_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 cursor-pointer select-none" onClick={() => handleSort("recorded_at")}>Date/Time{sortIcon("recorded_at")}</th>
              <th className="text-left p-2 cursor-pointer select-none" onClick={() => handleSort("device_name")}>Vehicle{sortIcon("device_name")}</th>
              <th className="text-left p-2 cursor-pointer select-none" onClick={() => handleSort("road_name")}>Road{sortIcon("road_name")}</th>
              <th className="text-right p-2 cursor-pointer select-none" onClick={() => handleSort("speed_kmh")}>Speed{sortIcon("speed_kmh")}</th>
              <th className="text-right p-2 cursor-pointer select-none" onClick={() => handleSort("speed_limit_kmh")}>Limit{sortIcon("speed_limit_kmh")}</th>
              <th className="text-right p-2 cursor-pointer select-none" onClick={() => handleSort("excess_kmh")}>Excess{sortIcon("excess_kmh")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No overspeed events found</td></tr>
            ) : sorted.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-2 whitespace-nowrap">{format(new Date(e.recorded_at), "dd/MM/yyyy HH:mm")}</td>
                <td className="p-2">{e.device_name}</td>
                <td className="p-2 truncate max-w-[200px]">{e.road_name || "—"}</td>
                <td className="p-2 text-right">{Math.round(kmhToMph(Number(e.speed_kmh)))} mph</td>
                <td className="p-2 text-right">{Math.round(kmhToMph(Number(e.speed_limit_kmh)))} mph</td>
                <td className="p-2 text-right font-semibold text-destructive">{Math.round(kmhToMph(Number(e.excess_kmh)))} mph</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
