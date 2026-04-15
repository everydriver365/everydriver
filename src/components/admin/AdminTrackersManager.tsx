import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Satellite,
  Loader2,
  Car,
  Link2,
  Unlink,
  Radio,
  Check,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
}

interface LinkedDevice {
  id: string;
  
  device_identifier: string;
  device_name: string | null;
  vehicle_id: string | null;
  is_active: boolean;
  instructor_id: string;
  tracking_provider: string;
}

interface InstructorOption {
  id: string;
  name: string;
}

export function AdminTrackersManager() {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("radius");
  const [isAdding, setIsAdding] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all instructors
  const { data: instructors } = useQuery({
    queryKey: ["admin-all-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as InstructorOption[];
    },
  });

  // Fetch ALL gps_devices for overview table
  const { data: allDevices } = useQuery({
    queryKey: ["admin-all-gps-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("id, device_identifier, device_name, vehicle_id, is_active, instructor_id, tracking_provider")
        .eq("is_active", true);
      if (error) throw error;
      return data as LinkedDevice[];
    },
  });

  // Fetch selected instructor's vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["instructor-vehicles", selectedInstructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_vehicles")
        .select("id, registration, make, model")
        .eq("instructor_id", selectedInstructorId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!selectedInstructorId,
  });

  const getInstructorName = (id: string) =>
    instructors?.find((i) => i.id === id)?.name || "Unknown";

  const addDevice = async () => {
    if (!selectedInstructorId || !newDeviceId.trim()) return;
    setIsAdding(true);
    try {
      const insertData: Record<string, unknown> = {
        instructor_id: selectedInstructorId,
        tracking_provider: selectedProvider,
        device_identifier: `${selectedProvider}-${newDeviceId.trim()}`,
        device_name: newDeviceName.trim() || `Radius ${newDeviceId.trim()}`,
        vehicle_id: selectedVehicleId || null,
        is_active: true,
      };

      if (selectedProvider === "radius") {
        insertData.device_identifier = newDeviceId.trim();
      }

      const { error } = await supabase.from("gps_devices").insert(insertData as any);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["admin-all-gps-devices"] });
      toast({ title: "Device added", description: `Radius ${newDeviceId.trim()} linked to ${getInstructorName(selectedInstructorId)}` });
      setNewDeviceId("");
      setNewDeviceName("");
      setSelectedVehicleId("");
    } catch (err) {
      console.error("Add device error:", err);
      toast({ title: "Error", description: "Failed to add device", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    setActionId(deviceId);
    try {
      const { error } = await supabase.from("gps_devices").delete().eq("id", deviceId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-all-gps-devices"] });
      toast({ title: "Device removed" });
    } catch (err) {
      console.error("Remove error:", err);
      toast({ title: "Error", description: "Failed to remove device", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            All Assigned Trackers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allDevices || allDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No trackers assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDevices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{getInstructorName(d.instructor_id)}</TableCell>
                    <TableCell>{d.device_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{d.device_identifier}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {d.tracking_provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.is_active ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <Radio className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Check className="h-3 w-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => removeDevice(d.id)}
                        disabled={actionId === d.id}
                      >
                        {actionId === d.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <><Unlink className="h-3 w-3 mr-1" /> Remove</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor..." />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Provider..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radius">Radius</SelectItem>
                <SelectItem value="radius">Radius</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedInstructorId && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Input
                  placeholder="Radius Vehicle/Device ID"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Radius/Velocity portal
                </p>
              </div>

              <Input
                placeholder="Friendly name (e.g. Kenneth's Car)"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
              />

              <Select value={selectedVehicleId || "none"} onValueChange={(val) => setSelectedVehicleId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to vehicle (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> No vehicle</span>
                  </SelectItem>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="font-mono">{v.registration}</span>
                      <span className="text-muted-foreground ml-1">{v.make} {v.model}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={addDevice} disabled={isAdding || !newDeviceId.trim()} className="w-full">
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Add Radius Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
