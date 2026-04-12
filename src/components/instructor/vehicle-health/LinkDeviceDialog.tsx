import { useState } from "react";
import { Car, Link, Unlink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GPSDeviceHealth, InstructorVehicle } from "@/hooks/useVehicleHealth";

interface LinkDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: GPSDeviceHealth | null;
  vehicles: InstructorVehicle[];
  onLink: (deviceId: string, vehicleId: string | null) => Promise<void>;
}

export function LinkDeviceDialog({
  open,
  onOpenChange,
  device,
  vehicles,
  onLink,
}: LinkDeviceDialogProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    device?.vehicle_id || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!device) return;
    
    setIsLoading(true);
    try {
      await onLink(device.id, selectedVehicleId);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!device) return;
    
    setIsLoading(true);
    try {
      await onLink(device.id, null);
      setSelectedVehicleId(null);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out vehicles already linked to other devices
  const availableVehicles = vehicles.filter(v => 
    !v.linked_device_id || v.linked_device_id === device?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Device to Vehicle
          </DialogTitle>
          <DialogDescription>
            {device?.device_name || device?.device_identifier}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {availableVehicles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No vehicles available</p>
              <p className="text-sm">Add a vehicle in Settings first</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedVehicleId || ""}
              onValueChange={setSelectedVehicleId}
              className="space-y-2"
            >
              {availableVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="flex items-center space-x-3 rounded-2xl border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <RadioGroupItem value={vehicle.id} id={vehicle.id} />
                  <Label htmlFor={vehicle.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{vehicle.registration}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </div>
                  </Label>
                  <Car className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {device?.vehicle_id && (
            <Button
              variant="outline"
              onClick={handleUnlink}
              disabled={isLoading}
              className="mr-auto"
            >
              <Unlink className="h-4 w-4 mr-1.5" />
              Unlink
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedVehicleId}
          >
            {isLoading ? "Saving..." : "Link Vehicle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
