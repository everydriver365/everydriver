import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicleService, SERVICE_TYPE_LABELS, ServiceType, CreateReminderInput } from "@/hooks/useVehicleService";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";
import { toast } from "@/hooks/use-toast";
import { kmToMiles } from "@/lib/utils";

interface AddServiceReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: InstructorVehicle[];
}

const SERVICE_TYPES = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];

const INTERVAL_PRESETS = {
  oil_change: { months: 6, km: 16000 }, // ~10k miles
  full_service: { months: 12, km: 19000 }, // ~12k miles
  mot: { months: 12, km: null },
  tire_rotation: { months: 6, km: 16000 },
  brake_check: { months: 12, km: 32000 }, // ~20k miles
  air_filter: { months: 12, km: 24000 }, // ~15k miles
  coolant_flush: { months: 24, km: 48000 }, // ~30k miles
  transmission: { months: 36, km: 96000 }, // ~60k miles
  other: { months: null, km: null },
};

export function AddServiceReminderDialog({ open, onOpenChange, vehicles }: AddServiceReminderDialogProps) {
  const { createReminder } = useVehicleService();
  
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("oil_change");
  const [customName, setCustomName] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("");
  const [intervalMiles, setIntervalMiles] = useState("");
  const [reminderDays, setReminderDays] = useState("14");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [lastServiceMiles, setLastServiceMiles] = useState("");
  const [saving, setSaving] = useState(false);

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    const preset = INTERVAL_PRESETS[type];
    if (preset.months) setIntervalMonths(preset.months.toString());
    if (preset.km) setIntervalMiles(Math.round(kmToMiles(preset.km)).toString());
  };

  const resetForm = () => {
    setVehicleId("");
    setServiceType("oil_change");
    setCustomName("");
    setIntervalMonths("");
    setIntervalMiles("");
    setReminderDays("14");
    setLastServiceDate("");
    setLastServiceMiles("");
  };

  const handleSubmit = async () => {
    if (!vehicleId) {
      toast({ title: "Please select a vehicle", variant: "destructive" });
      return;
    }

    if (!intervalMonths && !intervalMiles) {
      toast({ title: "Please set at least one interval (time or mileage)", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const input: CreateReminderInput = {
        vehicle_id: vehicleId,
        service_type: serviceType,
        custom_name: serviceType === "other" ? customName : undefined,
        interval_months: intervalMonths ? parseInt(intervalMonths) : undefined,
        interval_km: intervalMiles ? Math.round(parseFloat(intervalMiles) / 0.621371) : undefined,
        reminder_days_before: parseInt(reminderDays) || 14,
        last_service_date: lastServiceDate || undefined,
        last_service_km: lastServiceMiles ? Math.round(parseFloat(lastServiceMiles) / 0.621371) : undefined,
      };

      await createReminder.mutateAsync(input);
      toast({ title: "Service reminder created" });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to create reminder", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Service Reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle */}
          <div>
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.registration} - {v.make} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div>
            <Label>Service Type</Label>
            <Select value={serviceType} onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom name for "other" */}
          {serviceType === "other" && (
            <div>
              <Label>Service Name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Timing belt replacement"
              />
            </div>
          )}

          {/* Intervals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Every (months)</Label>
              <Input
                type="number"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
                placeholder="12"
              />
            </div>
            <div>
              <Label>Every (miles)</Label>
              <Input
                type="number"
                value={intervalMiles}
                onChange={(e) => setIntervalMiles(e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>

          {/* Reminder days */}
          <div>
            <Label>Remind me (days before)</Label>
            <Select value={reminderDays} onValueChange={setReminderDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last service (optional) */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Last Service (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Odometer (miles)</Label>
                <Input
                  type="number"
                  value={lastServiceMiles}
                  onChange={(e) => setLastServiceMiles(e.target.value)}
                  placeholder="Current mileage"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
