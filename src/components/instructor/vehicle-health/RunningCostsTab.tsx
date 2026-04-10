import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fuel, TrendingUp, Calendar, Car, Briefcase, Home,
  PoundSterling, Gauge, Settings
} from "lucide-react";
import { useRunningCosts } from "@/hooks/useRunningCosts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function RunningCostsTab() {
  const navigate = useNavigate();
  const { summary, recentTrips, todayStats, isLoading } = useRunningCosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-24 rounded-none" />
          <Skeleton className="h-24 rounded-none" />
          <Skeleton className="h-24 rounded-none" />
        </div>
        <Skeleton className="h-32 rounded-none" />
        <Skeleton className="h-48 rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">This Week</span>
            </div>
            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              £{summary.thisWeek.fuelCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {summary.thisWeek.miles.toFixed(0)} mi
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-primary/20 dark:border-primary/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-primary">This Month</span>
            </div>
            <p className="text-lg font-bold text-primary">
              £{summary.thisMonth.fuelCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-primary/70">
              {summary.thisMonth.miles.toFixed(0)} mi
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300">Tax Year</span>
            </div>
            <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
              £{summary.taxYear.fuelCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-purple-600 dark:text-purple-400">
              {summary.taxYear.miles.toFixed(0)} mi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Cost Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Fuel Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-none bg-muted/50">
              <p className="text-[10px] text-muted-foreground">Cost/Mile</p>
              <p className="text-sm font-bold">
                {summary.costPerMile > 0 ? `${(summary.costPerMile * 100).toFixed(1)}p` : "—"}
              </p>
            </div>
            <div className="p-2 rounded-none bg-muted/50">
              <p className="text-[10px] text-muted-foreground">Vehicle MPG</p>
              <p className="text-sm font-bold">{summary.vehicleMpg}</p>
            </div>
            <div className="p-2 rounded-none bg-muted/50">
              <p className="text-[10px] text-muted-foreground">Fuel Price</p>
              <p className="text-sm font-bold">£{summary.fuelCostPerLitre.toFixed(2)}/L</p>
            </div>
          </div>

          {/* Today's stats */}
          {todayStats.todayMiles > 0 && (
            <div className="flex items-center justify-between p-2 rounded-none bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Today</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-primary">
                  {todayStats.todayMiles.toFixed(1)} mi
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ~£{todayStats.todayFuelCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => navigate("/instructor/settings")}
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Update MPG & Fuel Price
          </Button>
        </CardContent>
      </Card>

      {/* Recent Trips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" />
            Recent Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm">No trips logged recently</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrips.map(trip => (
                <div 
                  key={trip.id}
                  className="flex items-center justify-between p-2 rounded-none border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0",
                        trip.trip_type === "business"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-primary/10 text-primary dark:bg-primary/20"
                      )}
                    >
                      {trip.trip_type === "business" ? (
                        <Briefcase className="h-3 w-3" />
                      ) : (
                        <Home className="h-3 w-3" />
                      )}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {trip.pupil_name || trip.purpose || "Journey"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(trip.log_date), "EEE d MMM")}
                        {trip.created_at && (
                          <span className="ml-1">
                            • {format(new Date(trip.created_at), "HH:mm")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold">
                      {trip.distance_miles.toFixed(1)} mi
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      £{trip.fuel_cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
