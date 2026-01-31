import { Car, Gauge, Wrench, Wifi, Star, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

export interface InstructorVehicleExtended {
  id: string;
  instructor_id: string;
  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;
  transmission: string | null;
  current_odometer_km: number | null;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  next_service_due_km: number | null;
  last_service_date: string | null;
  is_primary: boolean;
  linked_device_id?: string | null;
  image_url?: string | null;
}

interface VehicleFleetCardProps {
  vehicle: InstructorVehicleExtended;
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(dateStr), new Date());
}

function getExpiryBadge(label: string, days: number | null) {
  if (days === null) return null;
  
  let variant: "default" | "destructive" | "secondary" = "secondary";
  let className = "";
  
  if (days < 0) {
    variant = "destructive";
  } else if (days <= 14) {
    variant = "destructive";
    className = "bg-destructive/80";
  } else if (days <= 30) {
    className = "bg-orange-500 text-white border-orange-500";
  } else if (days <= 60) {
    className = "bg-orange-400/80 text-orange-900 border-orange-400";
  }

  const displayText = days < 0 
    ? `${label} EXPIRED` 
    : `${label} ${days}d`;

  return (
    <Badge variant={variant} className={cn("text-xs", className)}>
      {displayText}
    </Badge>
  );
}

export function VehicleFleetCard({ vehicle }: VehicleFleetCardProps) {
  const motDays = getDaysUntil(vehicle.mot_expiry);
  const insuranceDays = getDaysUntil(vehicle.insurance_expiry);
  const taxDays = getDaysUntil(vehicle.tax_expiry);

  const kmUntilService = vehicle.next_service_due_km && vehicle.current_odometer_km
    ? vehicle.next_service_due_km - vehicle.current_odometer_km
    : null;

  return (
    <Card className="overflow-hidden">
      {/* Vehicle Image */}
      {vehicle.image_url ? (
        <div className="aspect-video bg-muted">
          <img
            src={vehicle.image_url}
            alt={vehicle.registration}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted/50 flex items-center justify-center">
          <Camera className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base font-mono tracking-wider">
                {vehicle.registration}
              </h3>
              {vehicle.is_primary && (
                <Star className="h-4 w-4 text-primary fill-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
              {vehicle.transmission && ` • ${vehicle.transmission}`}
            </p>
          </div>
          <Car className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {vehicle.current_odometer_km?.toLocaleString() || "0"} km
            </span>
          </div>
          {kmUntilService !== null && (
            <div className="flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                kmUntilService <= 500 && "text-orange-600",
                kmUntilService <= 0 && "text-destructive"
              )}>
                Service: {kmUntilService > 0 ? `${kmUntilService.toLocaleString()} km` : "Due!"}
              </span>
            </div>
          )}
        </div>

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-1.5">
          {getExpiryBadge("MOT", motDays)}
          {getExpiryBadge("Insurance", insuranceDays)}
          {getExpiryBadge("Tax", taxDays)}
        </div>

        {/* Linked device indicator */}
        {vehicle.linked_device_id && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
            <Wifi className="h-3 w-3 text-primary" />
            <span>GPS tracker linked</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
