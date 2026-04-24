import { MapPin, User, Calendar } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { MileageLogEntry } from "@/hooks/useVehicleHealth";
import { format } from "date-fns";
import { kmToMiles } from "@/lib/utils";

interface MileageLogListProps {
  entries: MileageLogEntry[];
}

export function MileageLogList({ entries }: MileageLogListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No tracking sessions yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Complete a tracking session to log mileage
        </p>
      </div>
    );
  }

  const grouped = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.session_date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, MileageLogEntry[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dateKey, dayEntries]) => {
        const totalDistance = dayEntries.reduce((sum, e) => sum + e.distance_km, 0);
        
        return (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(dateKey), "EEE, d MMM yyyy")}
              </div>
              <span className="text-sm font-semibold text-primary">
                {kmToMiles(totalDistance).toFixed(1)} mi
              </span>
            </div>
            
            <div className="space-y-2">
              {dayEntries.map(entry => (
                <InstructorCard key={entry.id} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {entry.pupil_name ? (
                          <>
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{entry.pupil_name}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-muted-foreground">
                              Tracked Route
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(entry.session_date), "HH:mm")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-sm">
                        {kmToMiles(entry.distance_km).toFixed(1)} mi
                      </span>
                    </div>
                  </div>
                </InstructorCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}