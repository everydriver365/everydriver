import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, Plus, Calendar, Gauge, AlertTriangle, 
  Clock, Trash2, CheckCircle2, History, Receipt
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useVehicleService, SERVICE_TYPE_LABELS, ServiceReminder, ServiceHistoryEntry } from "@/hooks/useVehicleService";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { AddServiceReminderDialog } from "./AddServiceReminderDialog";
import { LogServiceDialog } from "./LogServiceDialog";
import { VehicleCostSummary } from "./VehicleCostSummary";
import { kmToMiles } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
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

export function ServiceRemindersTab() {
  const { 
    reminders, 
    history, 
    isLoading, 
    deleteReminder, 
    toggleReminder,
    getReminderStatus 
  } = useVehicleService();
  const { vehicles } = useVehicleHealth();
  
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showLogService, setShowLogService] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ServiceReminder | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);

  const handleLogServiceForReminder = (reminder: ServiceReminder) => {
    setSelectedReminder(reminder);
    setShowLogService(true);
  };

  const handleDeleteReminder = async () => {
    if (!reminderToDelete) return;
    
    try {
      await deleteReminder.mutateAsync(reminderToDelete);
      toast({ title: "Reminder deleted" });
    } catch {
      toast({ title: "Failed to delete reminder", variant: "destructive" });
    }
    setReminderToDelete(null);
  };

  const handleToggleReminder = async (id: string, isActive: boolean) => {
    try {
      await toggleReminder.mutateAsync({ id, isActive });
    } catch {
      toast({ title: "Failed to update reminder", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact on mobile */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Service Reminders</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Track maintenance schedules and service history
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            onClick={() => setShowLogService(true)}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Log Service</span>
          </Button>
          <Button 
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            onClick={() => setShowAddReminder(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Add Reminder</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="reminders">
            Reminders ({reminders.filter(r => r.is_active).length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({history.length})
          </TabsTrigger>
          <TabsTrigger value="costs">
            <Receipt className="h-3.5 w-3.5 mr-1" />
            Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-4 mt-4">
          {reminders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-medium mb-1">No service reminders</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up reminders to track oil changes, MOT, and more
                </p>
                <Button onClick={() => setShowAddReminder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  status={getReminderStatus(reminder)}
                  onLogService={() => handleLogServiceForReminder(reminder)}
                  onToggle={(active) => handleToggleReminder(reminder.id, active)}
                  onDelete={() => setReminderToDelete(reminder.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ServiceHistoryList history={history} />
        </TabsContent>

        <TabsContent value="costs" className="mt-4">
          <VehicleCostSummary />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddServiceReminderDialog
        open={showAddReminder}
        onOpenChange={setShowAddReminder}
        vehicles={vehicles}
      />

      <LogServiceDialog
        open={showLogService}
        onOpenChange={(open) => {
          setShowLogService(open);
          if (!open) setSelectedReminder(null);
        }}
        vehicles={vehicles}
        preselectedReminder={selectedReminder}
      />

      <AlertDialog open={!!reminderToDelete} onOpenChange={() => setReminderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service reminder. Service history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReminder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReminderCard({
  reminder,
  status,
  onLogService,
  onToggle,
  onDelete,
}: {
  reminder: ServiceReminder;
  status: "overdue" | "due_soon" | "ok";
  onLogService: () => void;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  const serviceName = reminder.service_type === "other" 
    ? reminder.custom_name || "Other Service"
    : SERVICE_TYPE_LABELS[reminder.service_type];

  const daysUntil = reminder.next_due_date 
    ? differenceInDays(new Date(reminder.next_due_date), new Date())
    : null;

  const milesUntil = reminder.next_due_km && reminder.vehicle?.current_odometer_km
    ? kmToMiles(reminder.next_due_km - reminder.vehicle.current_odometer_km)
    : null;

  return (
    <Card className={`${!reminder.is_active ? "opacity-60" : ""} ${
      status === "overdue" ? "border-destructive" : 
      status === "due_soon" ? "border-orange-500" : ""
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{serviceName}</CardTitle>
                {reminder.auto_created && (
                  <Badge variant="outline" className="text-[10px]">Auto</Badge>
                )}
                {status === "overdue" && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
                {status === "due_soon" && (
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">Due Soon</Badge>
                )}
              </div>
            <p className="text-sm text-muted-foreground font-mono">
              {reminder.vehicle?.registration}
            </p>
          </div>
          <Switch
            checked={reminder.is_active}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Interval info */}
        <div className="flex flex-wrap gap-2 text-sm">
          {reminder.interval_months && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Every {reminder.interval_months} months
            </div>
          )}
          {reminder.interval_km && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gauge className="h-3.5 w-3.5" />
              Every {Math.round(kmToMiles(reminder.interval_km)).toLocaleString()} mi
            </div>
          )}
        </div>

        {/* Next due */}
        <div className="bg-muted/50 rounded-2xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Next Due</p>
          <div className="flex flex-wrap gap-3">
            {reminder.next_due_date && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${
                  daysUntil !== null && daysUntil < 0 ? "text-destructive" :
                  daysUntil !== null && daysUntil <= 14 ? "text-warning" : ""
                }`}>
                  {format(new Date(reminder.next_due_date), "d MMM yyyy")}
                  {daysUntil !== null && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d`})
                    </span>
                  )}
                </span>
              </div>
            )}
            {reminder.next_due_km && (
              <div className="flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm font-medium ${
                  milesUntil !== null && milesUntil <= 0 ? "text-destructive" :
                  milesUntil !== null && milesUntil <= 300 ? "text-warning" : ""
                }`}>
                  {Math.round(kmToMiles(reminder.next_due_km)).toLocaleString()} mi
                  {milesUntil !== null && (
                    <span className="text-muted-foreground font-normal ml-1">
                      ({milesUntil <= 0 ? "overdue" : `${Math.round(milesUntil).toLocaleString()} mi left`})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Last service */}
        {reminder.last_service_date && (
          <p className="text-xs text-muted-foreground">
            Last serviced: {format(new Date(reminder.last_service_date), "d MMM yyyy")}
            {reminder.last_service_km && ` at ${Math.round(kmToMiles(reminder.last_service_km)).toLocaleString()} mi`}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onLogService}
            disabled={!reminder.is_active}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Log Service
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceHistoryList({ history }: { history: ServiceHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-medium mb-1">No service history</h3>
          <p className="text-sm text-muted-foreground">
            Service records will appear here when you log them
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const serviceName = entry.service_type === "other"
          ? entry.custom_name || "Other Service"
          : SERVICE_TYPE_LABELS[entry.service_type];

        return (
          <Card key={entry.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{serviceName}</h4>
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.vehicle?.registration}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span>{format(new Date(entry.service_date), "d MMM yyyy")}</span>
                    {entry.odometer_km && (
                      <span>{Math.round(kmToMiles(entry.odometer_km)).toLocaleString()} mi</span>
                    )}
                    {entry.provider && <span>{entry.provider}</span>}
                  </div>
                  {entry.notes && (
                    <p className="text-sm mt-2 text-muted-foreground">{entry.notes}</p>
                  )}
                </div>
                {entry.cost_gbp && (
                  <div className="text-right">
                    <span className="font-medium">£{entry.cost_gbp.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
