import { useState } from "react";
import { Heart, Scale, Droplets, Lightbulb, Coffee, Activity, MessageSquare, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { WeightTracker } from "@/components/instructor/health/WeightTracker";
import { WaterIntakeTracker } from "@/components/instructor/health/WaterIntakeTracker";
import { HealthTipsFeed } from "@/components/instructor/health/HealthTipsFeed";
import { BreakReminderWidget } from "@/components/instructor/health/BreakReminderWidget";
import { HealthSettingsPanel } from "@/components/instructor/health/HealthSettingsPanel";
import { BloodPressureTracker } from "@/components/instructor/health/BloodPressureTracker";
import { BloodGlucoseTracker } from "@/components/instructor/health/BloodGlucoseTracker";
import { SupportHub } from "@/components/instructor/health/SupportHub";
import { InstructorForum } from "@/components/instructor/health/InstructorForum";
import { useInstructorHealth } from "@/hooks/useInstructorHealth";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
            Track your wellbeing and connect with other instructors
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-xl border p-2.5 text-center">
            <Scale className="h-4 w-4 mx-auto mb-0.5 text-rose-500" />
            <p className="text-[10px] text-muted-foreground">Weight</p>
            <p className="font-semibold text-xs">Track</p>
          </div>
          <div className="bg-card rounded-xl border p-2.5 text-center">
            <Droplets className="h-4 w-4 mx-auto mb-0.5 text-sky-500" />
            <p className="text-[10px] text-muted-foreground">Water</p>
            <p className="font-semibold text-xs">{waterProgress}%</p>
          </div>
          <div className="bg-card rounded-xl border p-2.5 text-center">
            <Heart className="h-4 w-4 mx-auto mb-0.5 text-red-500" />
            <p className="text-[10px] text-muted-foreground">BP</p>
            <p className="font-semibold text-xs">Log</p>
          </div>
          <div className="bg-card rounded-xl border p-2.5 text-center">
            <Activity className="h-4 w-4 mx-auto mb-0.5 text-purple-500" />
            <p className="text-[10px] text-muted-foreground">Glucose</p>
            <p className="font-semibold text-xs">Log</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 w-auto min-w-full">
              <TabsTrigger value="overview" className="text-xs px-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="vitals" className="text-xs px-3">
                Vitals
              </TabsTrigger>
              <TabsTrigger value="forum" className="text-xs px-3">
                Forum
              </TabsTrigger>
              <TabsTrigger value="support" className="text-xs px-3">
                Support
              </TabsTrigger>
              <TabsTrigger value="tips" className="text-xs px-3">
                Tips
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs px-3">
                Settings
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Break Reminder */}
            <BreakReminderWidget />

            {/* Water Intake */}
            <WaterIntakeTracker />

            {/* Weight Tracker */}
            <WeightTracker />

            {/* Blood Pressure Summary */}
            <BloodPressureTracker />
          </TabsContent>

          <TabsContent value="vitals" className="mt-4 space-y-4">
            {/* Blood Pressure */}
            <BloodPressureTracker />
            
            {/* Blood Glucose */}
            <BloodGlucoseTracker />

            {/* Weight */}
            <WeightTracker />
            
            {/* Health Tips */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="font-medium text-sm mb-2">💡 Vital Signs Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Take BP readings at the same time each day for consistency</li>
                <li>• Log fasting glucose first thing in the morning before eating</li>
                <li>• Stay relaxed for 5 minutes before taking blood pressure</li>
                <li>• Consult your GP if readings are consistently outside normal ranges</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="forum" className="mt-4">
            <InstructorForum />
          </TabsContent>

          <TabsContent value="support" className="mt-4">
            <SupportHub />
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
