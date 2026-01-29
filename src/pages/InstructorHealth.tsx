import { useState } from "react";
import { Heart, Scale, Droplets, Lightbulb, Coffee } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { WeightTracker } from "@/components/instructor/health/WeightTracker";
import { WaterIntakeTracker } from "@/components/instructor/health/WaterIntakeTracker";
import { HealthTipsFeed } from "@/components/instructor/health/HealthTipsFeed";
import { BreakReminderWidget } from "@/components/instructor/health/BreakReminderWidget";
import { HealthSettingsPanel } from "@/components/instructor/health/HealthSettingsPanel";
import { useInstructorHealth } from "@/hooks/useInstructorHealth";

export default function InstructorHealth() {
  const [activeTab, setActiveTab] = useState("overview");
  const { todayWaterLog, waterGoal } = useInstructorHealth();

  const waterProgress = todayWaterLog
    ? Math.round((todayWaterLog.glasses_count / waterGoal) * 100)
    : 0;

  return (
    <InstructorPortalLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Heart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h1 className="text-xl font-bold">Health & Wellness</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your wellbeing and stay healthy on the road
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border p-3 text-center">
            <Scale className="h-5 w-5 mx-auto mb-1 text-rose-500" />
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="font-semibold text-sm">Track</p>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center">
            <Droplets className="h-5 w-5 mx-auto mb-1 text-sky-500" />
            <p className="text-xs text-muted-foreground">Water</p>
            <p className="font-semibold text-sm">{waterProgress}%</p>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center">
            <Coffee className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Breaks</p>
            <p className="font-semibold text-sm">Today</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="weight" className="text-xs">
              Weight
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              Tips
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Break Reminder */}
            <BreakReminderWidget />

            {/* Water Intake */}
            <WaterIntakeTracker />

            {/* Weight Tracker */}
            <WeightTracker />
          </TabsContent>

          <TabsContent value="weight" className="mt-4 space-y-4">
            <WeightTracker />
            
            {/* Weight Tips */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-medium text-sm mb-2">💡 Weight Tracking Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Weigh yourself at the same time each day for consistency</li>
                <li>• Morning, before breakfast, is usually best</li>
                <li>• Don't worry about daily fluctuations - focus on trends</li>
                <li>• Stay hydrated - dehydration can affect readings</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-4">
            <HealthTipsFeed />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <HealthSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
