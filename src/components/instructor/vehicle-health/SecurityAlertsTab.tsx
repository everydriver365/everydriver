import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, MapPin, Check, Car, Zap, Shield, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVehicleSecurity, VehicleSecurityAlert } from "@/hooks/useVehicleSecurity";
import { InstructorVehicle } from "@/hooks/useVehicleHealth";
import { VehicleSecurityCard } from "./VehicleSecurityCard";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SecurityAlertsTabProps {
  vehicles: InstructorVehicle[];
}

export function SecurityAlertsTab({ vehicles }: SecurityAlertsTabProps) {
  const { alerts, settings, acknowledgeAlert, unacknowledgedCount } = useVehicleSecurity();
  const navigate = useNavigate();

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const getAlertIcon = (type: VehicleSecurityAlert["alert_type"]) => {
    switch (type) {
      case "unexpected_movement":
        return <Car className="h-4 w-4" />;
      case "ignition_on":
        return <Zap className="h-4 w-4" />;
      case "geofence_exit":
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getAlertLabel = (type: VehicleSecurityAlert["alert_type"]) => {
    switch (type) {
      case "unexpected_movement":
        return "Unexpected Movement";
      case "ignition_on":
        return "Ignition On";
      case "geofence_exit":
        return "Left Zone";
    }
  };

  const enabledCount = settings.filter((s) => s.security_enabled).length;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {enabledCount} of {vehicles.length} vehicles monitored
              </p>
              {unacknowledgedCount > 0 && (
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {unacknowledgedCount} unacknowledged alert{unacknowledgedCount !== 1 && "s"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {enabledCount > 0 ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Security Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Vehicle Settings</h3>
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Car className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No vehicles registered</p>
              <p className="text-sm text-muted-foreground/70">
                Add a vehicle in the Fleet tab first
              </p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleSecurityCard key={vehicle.id} vehicle={vehicle} />
          ))
        )}
      </div>

      {/* Recent Alerts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Alerts</h3>
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No security alerts</p>
              <p className="text-sm text-muted-foreground/70">
                Alerts will appear here when triggered
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={!alert.acknowledged ? "border-amber-500/50 bg-amber-500/5" : ""}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          !alert.acknowledged
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {alert.vehicle?.registration || "Unknown"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getAlertLabel(alert.alert_type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {alert.speed_kmh
                            ? `Moving at ${Math.round(alert.speed_kmh)} km/h`
                            : "Movement detected"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.latitude && alert.longitude && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/instructor/find-car")}
                        >
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          Map
                        </Button>
                      )}
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          OK
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
