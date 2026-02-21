import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AdminTrackersManager } from "@/components/admin/AdminTrackersManager";
import { GeotabTripHistory } from "@/components/instructor/geotab/GeotabTripHistory";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { Satellite, Route, Camera } from "lucide-react";

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  withFaults: number;
}

export function AdminGeotabFleet() {
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: devices } = await supabase
        .from("gps_devices")
        .select("id, instructor_id, last_seen_at, last_fault_codes, is_active")
        .eq("tracking_provider", "geotab");

      if (devices) {
        const now = Date.now();
        const onlineThreshold = 5 * 60 * 1000;
        const online = devices.filter(
          (d) => d.last_seen_at && now - new Date(d.last_seen_at).getTime() < onlineThreshold
        ).length;
        const withFaults = devices.filter(
          (d) => d.last_fault_codes && (d.last_fault_codes as any[]).length > 0
        ).length;

        setStats({
          total: devices.length,
          online,
          offline: devices.length - online,
          withFaults,
        });
      }

      // Get unique instructors with Geotab devices
      const { data: devicesWithInst } = await supabase
        .from("gps_devices")
        .select("instructor_id")
        .eq("tracking_provider", "geotab");

      if (devicesWithInst) {
        const uniqueIds = [...new Set(devicesWithInst.map((d) => d.instructor_id).filter(Boolean))];
        if (uniqueIds.length > 0) {
          const { data: instData } = await supabase
            .from("instructors")
            .select("id, name")
            .in("id", uniqueIds);
          if (instData) {
            setInstructors(instData.map((i) => ({ id: i.id, name: i.name })));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching fleet data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Satellite className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Geotab Fleet</h2>
          <p className="text-sm text-muted-foreground">Fleet-wide device management & analytics</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Devices</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.online}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-muted-foreground">{stats.offline}</p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{stats.withFaults}</p>
              <p className="text-xs text-muted-foreground">With Faults</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices" className="gap-1">
            <Satellite className="h-3 w-3" /> Devices
          </TabsTrigger>
          <TabsTrigger value="trips" className="gap-1">
            <Route className="h-3 w-3" /> Trips
          </TabsTrigger>
          <TabsTrigger value="dashcam" className="gap-1">
            <Camera className="h-3 w-3" /> Dashcam
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-4">
          <AdminTrackersManager />
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Fleet Trip History</CardTitle>
                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {selectedInstructor !== "all" ? (
                <GeotabTripHistory instructorId={selectedInstructor} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select an instructor to view their trip history.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashcam" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Fleet Dashcam</CardTitle>
                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DashcamGalleryView
                instructorId={selectedInstructor !== "all" ? selectedInstructor : undefined}
                showAllInstructors={selectedInstructor === "all"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
