import { useState } from "react";
import { Heart, Scale, Droplets, Lightbulb, Coffee, Activity, MessageSquare, BookOpen } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
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

export default function InstructorHealth() {
  const [activeTab, setActiveTab] = useState("overview");
  const { todayWaterLog, waterGoal } = useInstructorHealth();

  const waterProgress = todayWaterLog
    ? Math.round((todayWaterLog.glasses_count / waterGoal) * 100)
    : 0;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24" style={{ fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
        {/* iOS Page Title */}
        <div className="flex items-center gap-2.5">
          <div className="h-[29px] w-[29px] rounded-[7px] bg-rose-500/10 flex items-center justify-center">
            <Heart className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Health & Wellness</h1>
            <p className="text-[13px] text-muted-foreground">
              Track your wellbeing and connect with other instructors
            </p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-[10px] border border-border/40 p-2.5 text-center">
            <Scale className="h-4 w-4 mx-auto mb-0.5 text-rose-500" />
            <p className="text-[10px] text-muted-foreground">Weight</p>
            <p className="font-semibold text-xs">Track</p>
          </div>
          <div className="bg-card rounded-[10px] border border-border/40 p-2.5 text-center">
            <Droplets className="h-4 w-4 mx-auto mb-0.5 text-sky-500" />
            <p className="text-[10px] text-muted-foreground">Water</p>
            <p className="font-semibold text-xs">{waterProgress}%</p>
          </div>
          <div className="bg-card rounded-[10px] border border-border/40 p-2.5 text-center">
            <Heart className="h-4 w-4 mx-auto mb-0.5 text-red-500" />
            <p className="text-[10px] text-muted-foreground">BP</p>
            <p className="font-semibold text-xs">Log</p>
          </div>
          <div className="bg-card rounded-[10px] border border-border/40 p-2.5 text-center">
            <Activity className="h-4 w-4 mx-auto mb-0.5 text-purple-500" />
            <p className="text-[10px] text-muted-foreground">Glucose</p>
            <p className="font-semibold text-xs">Log</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <IOSSegmentedControl
            segments={[
              { value: "overview", label: "Overview" },
              { value: "vitals", label: "Vitals" },
              { value: "forum", label: "Forum" },
              { value: "support", label: "Support" },
              { value: "tips", label: "Tips" },
              { value: "settings", label: "Settings" },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />

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
