import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicleService, SERVICE_TYPE_LABELS, ServiceType, ServiceReminder, LogServiceInput } from "@/hooks/useVehicleService";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";
import { toast } from "@/hooks/use-toast";
import { kmToMiles } from "@/lib/utils";
import { format } from "date-fns";

interface LogServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: InstructorVehicle[];
  preselectedReminder?: ServiceReminder | null;
}

const SERVICE_TYPES = Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][];

export function LogServiceDialog({ 
  open, 
  onOpenChange, 
  vehicles, 
  preselectedReminder 
}: LogServiceDialogProps) {
  const { logService, reminders } = useVehicleService();
  
  const [vehicleId, setVehicleId] = useState("");
  const [reminderId, setReminderId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("oil_change");
  const [customName, setCustomName] = useState("");
  const [serviceDate, setServiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [odometerMiles, setOdometerMiles] = useState("");
  const [costGbp, setCostGbp] = useState("");
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill from reminder
  useEffect(() => {
    if (preselectedReminder) {
      setVehicleId(preselectedReminder.vehicle_id);
      setReminderId(preselectedReminder.id);
      setServiceType(preselectedReminder.service_type);
      setCustomName(preselectedReminder.custom_name || "");
      // Pre-fill odometer with current vehicle odometer
      if (preselectedReminder.vehicle?.current_odometer_km) {
        setOdometerMiles(Math.round(kmToMiles(preselectedReminder.vehicle.current_odometer_km)).toString());
      }
    }
  }, [preselectedReminder]);

  // Update service type when reminder changes
  const handleReminderChange = (id: string) => {
    setReminderId(id);
    if (id) {
      const reminder = reminders.find(r => r.id === id);
      if (reminder) {
        setServiceType(reminder.service_type);
        setCustomName(reminder.custom_name || "");
      }
    }
  };

  // Filter reminders for selected vehicle
  const vehicleReminders = reminders.filter(r => r.vehicle_id === vehicleId && r.is_active);

  const resetForm = () => {
    setVehicleId("");
    setReminderId("");
    setServiceType("oil_change");
    setCustomName("");
    setServiceDate(format(new Date(), "yyyy-MM-dd"));
    setOdometerMiles("");
    setCostGbp("");
    setProvider("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!vehicleId) {
      toast({ title: "Please select a vehicle", variant: "destructive" });
      return;
    }

    if (!serviceDate) {
      toast({ title: "Please enter the service date", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const input: LogServiceInput = {
        vehicle_id: vehicleId,
        reminder_id: reminderId || undefined,
        service_type: serviceType,
        custom_name: serviceType === "other" ? customName : undefined,
        service_date: serviceDate,
        odometer_km: odometerMiles ? Math.round(parseFloat(odometerMiles) / 0.621371) : undefined,
        cost_gbp: costGbp ? parseFloat(costGbp) : undefined,
        provider: provider || undefined,
        notes: notes || undefined,
      };

      await logService.mutateAsync(input);
      toast({ title: "Service logged successfully" });
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: "Failed to log service", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle */}
          <div>
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={(v) => { setVehicleId(v); setReminderId(""); }}>
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

          {/* Link to reminder (optional) */}
          {vehicleId && vehicleReminders.length > 0 && (
            <div>
              <Label>Link to Reminder (optional)</Label>
              <Select value={reminderId} onValueChange={handleReminderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="No linked reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No linked reminder</SelectItem>
                  {vehicleReminders.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.service_type === "other" ? r.custom_name : SERVICE_TYPE_LABELS[r.service_type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Linking will update the reminder's "next due" automatically
              </p>
            </div>
          )}

          {/* Service Type (only if not linked to reminder) */}
          {!reminderId && (
            <div>
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
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
          )}

          {/* Custom name for "other" */}
          {serviceType === "other" && !reminderId && (
            <div>
              <Label>Service Name</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Timing belt replacement"
              />
            </div>
          )}

          {/* Date and odometer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Date</Label>
              <Input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Odometer (miles)</Label>
              <Input
                type="number"
                value={odometerMiles}
                onChange={(e) => setOdometerMiles(e.target.value)}
                placeholder="Current mileage"
              />
            </div>
          </div>

          {/* Cost and provider */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={costGbp}
                onChange={(e) => setCostGbp(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Provider/Garage</Label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Kwik Fit"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Log Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
