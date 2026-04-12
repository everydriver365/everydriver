import { useState } from "react";
import { Shield, ShieldOff, Settings2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleSecurity, VehicleSecuritySettings } from "@/hooks/useVehicleSecurity";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";
import { toast } from "sonner";

interface VehicleSecurityCardProps {
  vehicle: InstructorVehicle;
}

export function VehicleSecurityCard({ vehicle }: VehicleSecurityCardProps) {
  const { getVehicleSettings, toggleSecurity, updateSettings } = useVehicleSecurity();
  const settings = getVehicleSettings(vehicle.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isEnabled = settings?.security_enabled ?? false;
  const threshold = settings?.movement_threshold_kmh ?? 5;
  const cooldown = settings?.alert_cooldown_minutes ?? 30;
  const notifyIgnition = settings?.notify_on_ignition ?? true;

  const handleToggle = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await toggleSecurity({ vehicleId: vehicle.id, enabled });
      toast.success(enabled ? "Security monitoring enabled" : "Security monitoring disabled");
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<VehicleSecuritySettings>) => {
    try {
      await updateSettings({ vehicleId: vehicle.id, settings: updates });
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  return (
    <Card className={isEnabled ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isEnabled ? (
              <Shield className="h-5 w-5 text-primary" />
            ) : (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            )}
            <span>
              {vehicle.registration}
              {vehicle.make && ` - ${vehicle.make}`}
              {vehicle.model && ` ${vehicle.model}`}
            </span>
          </CardTitle>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEnabled && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                {isOpen ? "Hide settings" : "Configure alerts"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Movement threshold */}
              <div className="space-y-2">
                <Label className="text-sm">Movement threshold</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[threshold]}
                    onValueChange={([value]) => handleUpdateSettings({ movement_threshold_kmh: value })}
                    min={3}
                    max={15}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">{Math.round(threshold * 0.621371)} mph</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Alert when vehicle exceeds this speed while no lesson is scheduled
                </p>
              </div>

              {/* Alert cooldown */}
              <div className="space-y-2">
                <Label className="text-sm">Alert cooldown</Label>
                <Select
                  value={String(cooldown)}
                  onValueChange={(value) => handleUpdateSettings({ alert_cooldown_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Minimum time between repeat alerts for the same vehicle
                </p>
              </div>

              {/* Ignition alerts */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm">Ignition alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when ignition turns on outside lessons
                  </p>
                </div>
                <Switch
                  checked={notifyIgnition}
                  onCheckedChange={(checked) => handleUpdateSettings({ notify_on_ignition: checked })}
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  Alerts are suppressed during scheduled lessons and 15 minutes before/after to avoid false positives.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isEnabled && (
          <p className="text-sm text-muted-foreground">
            Enable to receive alerts when this vehicle moves outside scheduled lesson times
          </p>
        )}
      </CardContent>
    </Card>
  );
}
