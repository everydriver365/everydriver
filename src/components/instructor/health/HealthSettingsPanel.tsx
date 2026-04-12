import { Settings, Scale, Droplets, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInstructorHealth } from "@/hooks/useInstructorHealth";

export function HealthSettingsPanel() {
  const { settings, updateSettings, isUpdatingSettings } = useInstructorHealth();

  const handleWeightUnitChange = (value: string) => {
    updateSettings({ weight_unit: value as "kg" | "lbs" | "stone" });
  };

  const handleWaterGoalChange = (value: string) => {
    updateSettings({ daily_water_goal: parseInt(value) });
  };

  const handleBreakReminderToggle = (checked: boolean) => {
    updateSettings({ break_reminder_enabled: checked });
  };

  const handleReminderIntervalChange = (value: string) => {
    updateSettings({ reminder_interval_minutes: parseInt(value) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-8 w-8 rounded-2xl bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          Health Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight Unit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="h-4 w-4 text-rose-500" />
            <div>
              <Label htmlFor="weight-unit" className="text-sm font-medium">
                Weight Unit
              </Label>
              <p className="text-xs text-muted-foreground">
                Display weight in kg, lbs, or stone
              </p>
            </div>
          </div>
          <Select
            value={settings?.weight_unit || "kg"}
            onValueChange={handleWeightUnitChange}
            disabled={isUpdatingSettings}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lbs">lbs</SelectItem>
              <SelectItem value="stone">stone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Water Goal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="h-4 w-4 text-sky-500" />
            <div>
              <Label htmlFor="water-goal" className="text-sm font-medium">
                Daily Water Goal
              </Label>
              <p className="text-xs text-muted-foreground">
                Glasses of water (250ml each)
              </p>
            </div>
          </div>
          <Select
            value={String(settings?.daily_water_goal || 8)}
            onValueChange={handleWaterGoalChange}
            disabled={isUpdatingSettings}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 5, 6, 7, 8, 9, 10, 12].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} glasses
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Break Reminders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-emerald-500" />
            <div>
              <Label htmlFor="break-reminder" className="text-sm font-medium">
                Break Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Show break suggestions on home
              </p>
            </div>
          </div>
          <Switch
            id="break-reminder"
            checked={settings?.break_reminder_enabled ?? true}
            onCheckedChange={handleBreakReminderToggle}
            disabled={isUpdatingSettings}
          />
        </div>

        {/* Reminder Interval - only show if reminders enabled */}
        {(settings?.break_reminder_enabled ?? true) && (
          <div className="flex items-center justify-between pl-7">
            <div>
              <Label htmlFor="reminder-interval" className="text-sm font-medium">
                Check Interval
              </Label>
              <p className="text-xs text-muted-foreground">
                How often to check for breaks
              </p>
            </div>
            <Select
              value={String(settings?.reminder_interval_minutes || 60)}
              onValueChange={handleReminderIntervalChange}
              disabled={isUpdatingSettings}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
