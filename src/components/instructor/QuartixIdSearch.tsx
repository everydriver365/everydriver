import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Satellite, Search, Loader2, Car, RefreshCw, Link2, Check, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuartixServerVehicle {
  vehicleId: string;
  registration: string;
  vehicleName: string;
  groupName: string;
}

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
}

interface LinkedDevice {
  id: string;
  quartix_vehicle_id: string;
  device_name: string | null;
  vehicle_id: string | null;
  is_active: boolean;
}

interface QuartixIdSearchProps {
  instructorId?: string;
}

export function QuartixIdSearch({ instructorId }: QuartixIdSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [selectedVehicleFor, setSelectedVehicleFor] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all vehicles from Quartix server
  const { data: serverVehicles, isLoading: isLoadingServer, refetch: refetchServer } = useQuery({
    queryKey: ["quartix-server-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("quartix-vehicles");
      if (error) throw error;
      return (data?.vehicles || []) as QuartixServerVehicle[];
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch instructor's local vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["instructor-vehicles", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_vehicles")
        .select("id, registration, make, model")
        .eq("instructor_id", instructorId!)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!instructorId,
  });

  // Fetch already-linked GPS devices for this instructor
  const { data: linkedDevices } = useQuery({
    queryKey: ["linked-quartix-devices", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("id, quartix_vehicle_id, device_name, vehicle_id, is_active")
        .eq("instructor_id", instructorId!)
        .eq("tracking_provider", "quartix");
      if (error) throw error;
      return data as LinkedDevice[];
    },
    enabled: !!instructorId,
  });

  // Build a map of quartix_vehicle_id -> linked device
  const linkedMap = new Map<string, LinkedDevice>();
  linkedDevices?.forEach((d) => {
    if (d.quartix_vehicle_id) linkedMap.set(d.quartix_vehicle_id, d);
  });

  // Filter server vehicles by search
  const filtered = serverVehicles?.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      v.vehicleId.toLowerCase().includes(q) ||
      v.registration.toLowerCase().includes(q) ||
      v.vehicleName.toLowerCase().includes(q) ||
      v.groupName.toLowerCase().includes(q)
    );
  });

  const linkUnit = async (sv: QuartixServerVehicle) => {
    if (!instructorId) return;
    const vehicleId = selectedVehicleFor[sv.vehicleId];
    setLinkingId(sv.vehicleId);

    try {
      const existing = linkedMap.get(sv.vehicleId);
      if (existing) {
        // Update existing device
        const { error } = await supabase
          .from("gps_devices")
          .update({
            vehicle_id: vehicleId || null,
            device_name: sv.registration || sv.vehicleName || `Unit ${sv.vehicleId}`,
            is_active: true,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create new GPS device record
        const { error } = await supabase.from("gps_devices").insert({
          instructor_id: instructorId,
          tracking_provider: "quartix",
          device_identifier: sv.vehicleId,
          quartix_vehicle_id: sv.vehicleId,
          device_name: sv.registration || sv.vehicleName || `Unit ${sv.vehicleId}`,
          vehicle_id: vehicleId || null,
          is_active: true,
        });
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["linked-quartix-devices", instructorId] });

      const vName = vehicleId
        ? vehicles?.find((v) => v.id === vehicleId)?.registration
        : null;

      toast({
        title: "Unit linked",
        description: vName
          ? `Quartix ${sv.registration || sv.vehicleId} → ${vName}`
          : `Quartix ${sv.registration || sv.vehicleId} added`,
      });
    } catch (err) {
      console.error("Link error:", err);
      toast({ title: "Error", description: "Failed to link unit", variant: "destructive" });
    } finally {
      setLinkingId(null);
    }
  };

  const unlinkUnit = async (sv: QuartixServerVehicle) => {
    const device = linkedMap.get(sv.vehicleId);
    if (!device) return;
    setLinkingId(sv.vehicleId);

    try {
      const { error } = await supabase
        .from("gps_devices")
        .update({ is_active: false })
        .eq("id", device.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["linked-quartix-devices", instructorId] });
      toast({ title: "Unit unlinked", description: `${sv.registration || sv.vehicleId} removed` });
    } catch (err) {
      console.error("Unlink error:", err);
      toast({ title: "Error", description: "Failed to unlink unit", variant: "destructive" });
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Satellite className="h-5 w-5" />
        Quartix Units
      </h2>

      <div className="rounded-lg border bg-card border-border shadow-sm p-4 space-y-4">
        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reg, name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchServer()}
            disabled={isLoadingServer}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingServer ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Units list */}
        {isLoadingServer ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading from Quartix...</span>
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((sv) => {
              const linked = linkedMap.get(sv.vehicleId);
              const isLinked = !!linked?.is_active;
              const assignedVehicle = isLinked && linked?.vehicle_id
                ? vehicles?.find((v) => v.id === linked.vehicle_id)
                : null;

              return (
                <div
                  key={sv.vehicleId}
                  className={`rounded-lg border p-3 space-y-2 transition-colors ${
                    isLinked
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {sv.registration || sv.vehicleName || `Unit ${sv.vehicleId}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">ID: {sv.vehicleId}</span>
                        {sv.groupName && <span>{sv.groupName}</span>}
                      </div>
                    </div>
                    {isLinked && (
                      <span className="shrink-0 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Linked
                      </span>
                    )}
                  </div>

                  {/* Linked: show assigned vehicle + unlink */}
                  {isLinked ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5" />
                        {assignedVehicle
                          ? `${assignedVehicle.registration} (${assignedVehicle.make || ""} ${assignedVehicle.model || ""})`
                          : "No vehicle assigned"}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => unlinkUnit(sv)}
                        disabled={linkingId === sv.vehicleId}
                      >
                        {linkingId === sv.vehicleId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="h-3 w-3 mr-1" />
                            Unlink
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Not linked: vehicle picker + link button */
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedVehicleFor[sv.vehicleId] || "none"}
                        onValueChange={(val) =>
                          setSelectedVehicleFor((prev) => ({
                            ...prev,
                            [sv.vehicleId]: val === "none" ? "" : val,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Assign to vehicle..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">No vehicle</span>
                          </SelectItem>
                          {vehicles?.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <span className="font-mono">{v.registration}</span>
                              <span className="text-muted-foreground ml-1">
                                {v.make} {v.model}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => linkUnit(sv)}
                        disabled={linkingId === sv.vehicleId}
                      >
                        {linkingId === sv.vehicleId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Link2 className="h-3 w-3 mr-1" />
                            Link
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            {serverVehicles?.length === 0
              ? "No vehicles found on Quartix server."
              : "No matching vehicles found."}
          </p>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {serverVehicles?.length ?? 0} units on Quartix · {linkedMap.size} linked
        </p>
      </div>
    </div>
  );
}
