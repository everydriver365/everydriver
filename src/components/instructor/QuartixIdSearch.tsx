import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Satellite, Search, Copy, Check, Loader2, Car, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuartixResult {
  id: string;
  vehicleId: string;
  driverId: string;
  deviceName: string | null;
  assignedVehicleId: string | null;
}

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
}

interface QuartixIdSearchProps {
  instructorId?: string;
}

export function QuartixIdSearch({ instructorId }: QuartixIdSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<QuartixResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savingDeviceId, setSavingDeviceId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleSearch = async () => {
    if (!instructorId) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from("gps_devices")
        .select("id, quartix_vehicle_id, quartix_driver_id, device_name, vehicle_id")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "quartix");

      if (searchQuery.trim()) {
        query = query.or(
          `quartix_vehicle_id.ilike.%${searchQuery.trim()}%,quartix_driver_id.ilike.%${searchQuery.trim()}%,device_name.ilike.%${searchQuery.trim()}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setResults(
        (data || [])
          .filter((d) => d.quartix_vehicle_id || d.quartix_driver_id)
          .map((d) => ({
            id: d.id,
            vehicleId: d.quartix_vehicle_id || "Not set",
            driverId: d.quartix_driver_id || "Not set",
            deviceName: d.device_name,
            assignedVehicleId: d.vehicle_id,
          }))
      );
    } catch (err) {
      console.error("Quartix search error:", err);
      toast({
        title: "Search failed",
        description: "Could not search Quartix IDs",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const assignVehicle = async (deviceId: string, vehicleId: string | null) => {
    setSavingDeviceId(deviceId);
    try {
      const { error } = await supabase
        .from("gps_devices")
        .update({ vehicle_id: vehicleId })
        .eq("id", deviceId);

      if (error) throw error;

      setResults((prev) =>
        prev.map((r) =>
          r.id === deviceId ? { ...r, assignedVehicleId: vehicleId } : r
        )
      );

      const vehicleName = vehicleId
        ? vehicles?.find((v) => v.id === vehicleId)?.registration
        : null;

      toast({
        title: vehicleId ? "Vehicle assigned" : "Vehicle unassigned",
        description: vehicleId
          ? `Tracker linked to ${vehicleName}`
          : "Tracker unlinked from vehicle",
      });
    } catch (err) {
      console.error("Assign vehicle error:", err);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    } finally {
      setSavingDeviceId(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Copied", description: `${field} copied to clipboard` });
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Satellite className="h-5 w-5" />
        Quartix Units & Vehicle Assignment
      </h2>

      <div className="rounded-lg border bg-white dark:bg-card border-[#E5E7EB] shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search vehicle or driver ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            setSearchQuery("");
            handleSearch();
          }}
          disabled={isSearching}
        >
          Show All My Quartix Units
        </Button>

        {hasSearched && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No Quartix trackers found. Your admin needs to link your Quartix IDs.
              </p>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-md border bg-muted/30 p-3 space-y-3"
                >
                  {result.deviceName && (
                    <p className="text-sm font-medium">{result.deviceName}</p>
                  )}

                  {/* Quartix IDs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Vehicle ID</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono bg-muted px-2 py-1.5 rounded-md flex-1 truncate">
                          {result.vehicleId}
                        </p>
                        {result.vehicleId !== "Not set" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(result.vehicleId, `vid-${result.id}`)}
                          >
                            {copiedField === `vid-${result.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Driver ID</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono bg-muted px-2 py-1.5 rounded-md flex-1 truncate">
                          {result.driverId}
                        </p>
                        {result.driverId !== "Not set" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(result.driverId, `did-${result.id}`)}
                          >
                            {copiedField === `did-${result.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Assignment */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      Assigned Vehicle
                    </p>
                    <Select
                      value={result.assignedVehicleId || "none"}
                      onValueChange={(val) =>
                        assignVehicle(result.id, val === "none" ? null : val)
                      }
                      disabled={savingDeviceId === result.id}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Assign to vehicle..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">No vehicle assigned</span>
                        </SelectItem>
                        {vehicles?.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{v.registration}</span>
                              <span className="text-muted-foreground">
                                {v.make} {v.model}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {savingDeviceId === result.id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
