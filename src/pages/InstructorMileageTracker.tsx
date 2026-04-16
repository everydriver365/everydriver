import { useState } from "react";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear } from "date-fns";
import { 
  Car, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter,
  Fuel,
  PoundSterling,
  TrendingUp,
  MapPin,
  User,
  Briefcase,
  Home,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useMileageLogs, MileageLog } from "@/hooks/useMileageLogs";
import { AddMileageDialog } from "@/components/instructor/vehicle-health/AddMileageDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


// HMRC mileage rates
const HMRC_FIRST_10K_RATE = 0.45; // 45p per mile for first 10,000 miles
const HMRC_OVER_10K_RATE = 0.25; // 25p per mile thereafter

function calculateHMRCDeduction(businessMiles: number): number {
  if (businessMiles <= 10000) {
    return businessMiles * HMRC_FIRST_10K_RATE;
  }
  return (10000 * HMRC_FIRST_10K_RATE) + ((businessMiles - 10000) * HMRC_OVER_10K_RATE);
}

export default function InstructorMileageTracker() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Calculate date range based on view mode
  const dateRange = viewMode === "month" 
    ? { from: startOfMonth(currentDate), to: endOfMonth(currentDate) }
    : { from: startOfYear(currentDate), to: endOfYear(currentDate) };
  
  const { logs, summary, isLoading, updateTripType, deleteEntry } = useMileageLogs(dateRange);

  const navigatePeriod = (direction: "prev" | "next") => {
    setCurrentDate(prev => 
      viewMode === "month"
        ? direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
        : direction === "prev" ? subMonths(prev, 12) : addMonths(prev, 12)
    );
  };

  const formatPeriod = () => {
    return viewMode === "month"
      ? format(currentDate, "MMMM yyyy")
      : `Tax Year ${currentDate.getFullYear()}/${currentDate.getFullYear() + 1}`;
  };

  const hmrcDeduction = calculateHMRCDeduction(summary.totalBusiness);

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Distance (mi)", "Trip Type", "Purpose", "From", "To", "Pupil", "Fuel Cost"];
    const rows = logs.map(log => [
      format(new Date(log.log_date), "dd/MM/yyyy"),
      (log.distance_km * 0.621371).toFixed(2),
      log.trip_type,
      log.purpose || "",
      log.start_location || "",
      log.end_location || "",
      log.pupil?.name || "",
      log.estimated_fuel_cost_gbp?.toFixed(2) || ""
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mileage-${format(dateRange.from, "yyyy-MM")}-to-${format(dateRange.to, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-bold">Mileage Tracker</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Track miles for HMRC tax deductions</p>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            + Add Entry
          </Button>
        </div>


        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "month" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Monthly
          </Button>
          <Button 
            variant={viewMode === "year" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("year")}
          >
            Tax Year
          </Button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
          <Button variant="ghost" size="icon" onClick={() => navigatePeriod("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{formatPeriod()}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigatePeriod("next")}
            disabled={viewMode === "month" 
              ? currentDate >= startOfMonth(new Date())
              : currentDate.getFullYear() >= new Date().getFullYear()
            }
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* HMRC Tax Deduction Card */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">HMRC Mileage Allowance</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  £{hmrcDeduction.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.totalBusiness.toFixed(1)} business miles × 
                  {summary.totalBusiness <= 10000 ? " 45p" : " (45p first 10k, 25p after)"}
                </p>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-blue-500/5 to-sky-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Business</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {summary.totalBusiness.toFixed(1)} mi
                  </p>
                  <Progress 
                    value={summary.businessPercentage} 
                    className="h-1.5 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.businessPercentage.toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-gray-500/5 to-slate-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-gray-600" />
                    <span className="text-xs text-muted-foreground">Personal</span>
                  </div>
                  <p className="text-xl font-bold text-gray-600">
                    {summary.totalPersonal.toFixed(1)} mi
                  </p>
                  <Progress 
                    value={100 - summary.businessPercentage} 
                    className="h-1.5 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(100 - summary.businessPercentage).toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Total & Fuel */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Miles</span>
                  </div>
                  <p className="text-xl font-bold">{summary.totalMiles.toFixed(1)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Fuel className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Est. Fuel Cost</span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    £{summary.totalFuelCost.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <Button variant="outline" className="w-full" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export for HMRC (CSV)
            </Button>

            {/* Trip Log */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Trip Log ({logs.length})
                </h2>
              </div>

              {logs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No trips recorded for this period</p>
                    <Button variant="link" onClick={() => setShowAddDialog(true)}>
                      Add a manual entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <MileageLogCard 
                      key={log.id} 
                      log={log} 
                      onUpdateTripType={(tripType) => updateTripType.mutate({ id: log.id, tripType })}
                      onDelete={() => deleteEntry.mutate(log.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AddMileageDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </InstructorPortalLayout>
  );
}

function MileageLogCard({ 
  log, 
  onUpdateTripType,
  onDelete 
}: { 
  log: MileageLog; 
  onUpdateTripType: (type: "business" | "personal") => void;
  onDelete: () => void;
}) {
  const distanceMiles = log.distance_km * 0.621371;
  
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {format(new Date(log.log_date), "EEE d MMM")}
              </span>
              <Badge 
                variant="outline" 
                className={cn(
                  "cursor-pointer text-xs",
                  log.trip_type === "business" 
                    ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" 
                    : "bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20"
                )}
                onClick={() => onUpdateTripType(log.trip_type === "business" ? "personal" : "business")}
              >
                {log.trip_type === "business" ? (
                  <Briefcase className="h-3 w-3 mr-1" />
                ) : (
                  <Home className="h-3 w-3 mr-1" />
                )}
                {log.trip_type}
              </Badge>
              {log.is_auto_logged && (
                <Badge variant="secondary" className="text-xs">Auto</Badge>
              )}
            </div>
            
            {log.pupil?.name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                {log.pupil.name}
              </div>
            )}
            
            {log.purpose && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {log.purpose}
              </p>
            )}
            
            {(log.start_location || log.end_location) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {log.start_location || "?"} → {log.end_location || "?"}
              </div>
            )}
          </div>
          
          <div className="text-right shrink-0">
            <p className="font-bold text-sm">{distanceMiles.toFixed(1)} mi</p>
            {log.estimated_fuel_cost_gbp && (
              <p className="text-xs text-muted-foreground">
                £{log.estimated_fuel_cost_gbp.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
