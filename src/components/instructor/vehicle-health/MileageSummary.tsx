import { TrendingUp, Calendar, Fuel, Route } from "lucide-react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { MileageLogEntry, InstructorVehicle } from "@/hooks/useVehicleHealth";
import { format, startOfWeek, startOfMonth, isWithinInterval, subDays } from "date-fns";
import { kmToMiles } from "@/lib/utils";

interface MileageSummaryProps {
  entries: MileageLogEntry[];
  vehicles: InstructorVehicle[];
}

export function MileageSummary({ entries, vehicles }: MileageSummaryProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);

  const totalMileage = vehicles.reduce((sum, v) => sum + (v.current_odometer_km || 0), 0);
  
  const weekMileage = entries
    .filter(e => new Date(e.session_date) >= weekStart)
    .reduce((sum, e) => sum + e.distance_km, 0);

  const monthMileage = entries
    .filter(e => new Date(e.session_date) >= monthStart)
    .reduce((sum, e) => sum + e.distance_km, 0);

  const avgPerDay = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.distance_km, 0) / 
      Math.max(1, Math.ceil((today.getTime() - new Date(entries[entries.length - 1]?.session_date || today).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <InstructorCard>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Route className="h-4 w-4" />
          <span className="text-xs">Total Fleet</span>
        </div>
        <p className="text-xl font-bold">
          {Math.round(kmToMiles(totalMileage)).toLocaleString()}
          <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
        </p>
      </InstructorCard>

      <InstructorCard>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-xs">This Week</span>
        </div>
        <p className="text-xl font-bold">
          {kmToMiles(weekMileage).toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
        </p>
      </InstructorCard>

      <InstructorCard>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs">This Month</span>
        </div>
        <p className="text-xl font-bold">
          {kmToMiles(monthMileage).toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
        </p>
      </InstructorCard>

      <InstructorCard>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Fuel className="h-4 w-4" />
          <span className="text-xs">Avg/Day</span>
        </div>
        <p className="text-xl font-bold">
          {kmToMiles(avgPerDay).toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
        </p>
      </InstructorCard>
    </div>
  );
}