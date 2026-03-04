import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, Briefcase, Home, Calendar, TrendingUp, 
  PoundSterling, MapPin,
  Plus, Trash2, Edit2, Check, X
} from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { useMileageLogs, MileageLog } from "@/hooks/useMileageLogs";
import { kmToMiles } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { AddMileageDialog } from "./AddMileageDialog";

type DateRange = "month" | "year" | "all";

export function AutoMileageLog() {
  const [dateRange, setDateRange] = useState<DateRange>("month");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPurpose, setEditingPurpose] = useState<string | null>(null);
  const [purposeValue, setPurposeValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "year":
        return { from: startOfYear(now), to: endOfYear(now) };
      default:
        return undefined;
    }
  };

  const { logs, summary, isLoading, updateTripType, updatePurpose, deleteEntry } = useMileageLogs(getDateFilter());

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const dateKey = log.log_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, MileageLog[]>);

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handleToggleTripType = (log: MileageLog) => {
    const newType = log.trip_type === "business" ? "personal" : "business";
    updateTripType.mutate({ id: log.id, tripType: newType });
  };

  const handleSavePurpose = (id: string) => {
    updatePurpose.mutate({ id, purpose: purposeValue });
    setEditingPurpose(null);
  };

  const calculateHMRCAllowance = (businessMiles: number): number => {
    // HMRC rates: 45p for first 10,000 miles, 25p thereafter
    if (businessMiles <= 10000) {
      return businessMiles * 0.45;
    }
    return (10000 * 0.45) + ((businessMiles - 10000) * 0.25);
  };

  const hmrcAllowance = calculateHMRCAllowance(summary.totalBusiness);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Cards - Compact grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-300">Business</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-800 dark:text-green-200">
              {summary.totalBusiness.toFixed(0)} mi
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">
              {summary.businessPercentage.toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-primary/20 dark:border-primary/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs font-medium text-primary">Personal</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {summary.totalPersonal.toFixed(0)} mi
            </p>
            <p className="text-[10px] sm:text-xs text-primary/70">
              {(100 - summary.businessPercentage).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HMRC Tax Deduction Card - Compact */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <PoundSterling className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
                  HMRC Allowance
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-800 dark:text-amber-200">
                £{hmrcAllowance.toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                {summary.totalBusiness.toFixed(0)} business mi
              </p>
            </div>
            <div className="text-right text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 shrink-0">
              <p>45p first 10k</p>
              <p>25p after</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls - Compact */}
      <div className="flex items-center justify-between gap-2">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden xs:inline">Add</span> Manual
        </Button>
      </div>

      {/* Mileage Log List */}
      <div className="space-y-2">
        {Object.keys(groupedLogs).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No mileage logged yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Complete a GPS tracking session to auto-log mileage
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedLogs).map(([dateKey, dayLogs]) => {
            const isExpanded = expandedDates.has(dateKey);
            const dayTotal = dayLogs.reduce((sum, l) => sum + kmToMiles(l.distance_km), 0);
            const businessCount = dayLogs.filter(l => l.trip_type === "business").length;

            return (
              <Card key={dateKey} className="overflow-hidden">
                <button
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => toggleDate(dateKey)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">
                        {format(new Date(dateKey), "EEE, d MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayLogs.length} trip{dayLogs.length !== 1 ? "s" : ""} • {businessCount} business
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">
                      {dayTotal.toFixed(1)} mi
                    </span>
                    <ExpandChevron isExpanded={isExpanded} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t divide-y">
                    {dayLogs.map((log) => (
                      <div key={log.id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={log.trip_type === "business" ? "default" : "secondary"}
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  log.trip_type === "business" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20"
                                )}
                                onClick={() => handleToggleTripType(log)}
                              >
                                {log.trip_type === "business" ? (
                                  <Briefcase className="h-3 w-3 mr-1" />
                                ) : (
                                  <Home className="h-3 w-3 mr-1" />
                                )}
                                {log.trip_type}
                              </Badge>
                              
                              {log.is_auto_logged && (
                                <Badge variant="outline" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                              
                              {log.pupil?.name && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {log.pupil.name}
                                </span>
                              )}
                            </div>

                            {editingPurpose === log.id ? (
                              <div className="flex items-center gap-1 mt-2">
                                <Input
                                  value={purposeValue}
                                  onChange={(e) => setPurposeValue(e.target.value)}
                                  placeholder="Purpose"
                                  className="h-7 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleSavePurpose(log.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingPurpose(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <p 
                                className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground flex items-center gap-1"
                                onClick={() => {
                                  setEditingPurpose(log.id);
                                  setPurposeValue(log.purpose || "");
                                }}
                              >
                                {log.purpose || "Add purpose..."}
                                <Edit2 className="h-3 w-3" />
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {kmToMiles(log.distance_km).toFixed(1)} mi
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete mileage entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this mileage record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteEntry.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Manual Entry Dialog */}
      <AddMileageDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
