import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Key, MapPin, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface IgnitionEvent {
  id: string;
  device_id: string;
  vehicle_id: string | null;
  event_type: "on" | "off";
  latitude: number | null;
  longitude: number | null;
  road_name: string | null;
  recorded_at: string;
  device_name?: string;
  vehicle_registration?: string;
}

interface IgnitionEventsLogProps {
  events: IgnitionEvent[];
  isLoading?: boolean;
  showDeviceName?: boolean;
}

export function IgnitionEventsLog({ events, isLoading, showDeviceName = true }: IgnitionEventsLogProps) {
  if (isLoading) {
    return (
      <InstructorCard>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Key className="h-4 w-4" />
          Ignition Events
        </h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Loading...
        </div>
      </InstructorCard>
    );
  }

  if (events.length === 0) {
    return (
      <InstructorCard>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Key className="h-4 w-4" />
          Ignition Events
        </h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No ignition events recorded yet
        </div>
      </InstructorCard>
    );
  }

  return (
    <InstructorCard>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Key className="h-4 w-4" />
        Ignition Events
      </h3>
      <ScrollArea className="h-64">
        <div className="space-y-2">
          {events.map((event) => (
            <div 
              key={event.id} 
              className={cn(
                "p-2.5 rounded-2xl border text-xs",
                event.event_type === "on" 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Key className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    event.event_type === "on" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Badge 
                    variant={event.event_type === "on" ? "default" : "secondary"}
                    className="text-[10px] px-1.5"
                  >
                    {event.event_type === "on" ? "Started" : "Stopped"}
                  </Badge>
                  {showDeviceName && (event.vehicle_registration || event.device_name) && (
                    <span className="text-muted-foreground truncate">
                      {event.vehicle_registration || event.device_name}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground whitespace-nowrap shrink-0">
                  {formatDistanceToNow(new Date(event.recorded_at), { addSuffix: true })}
                </span>
              </div>
              
              {event.road_name && (
                <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.road_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{format(new Date(event.recorded_at), "MMM d, HH:mm")}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </InstructorCard>
  );
}