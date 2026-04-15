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
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-5 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-white/20 rounded-[10px] backdrop-blur-md">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.02em]">Health & Wellness</h1>
                <p className="text-[13px] text-white/60">Track your wellbeing</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white/15 backdrop-blur-md rounded-[10px] p-2.5 text-center">
                <Scale className="h-4 w-4 mx-auto mb-0.5 text-white/80" />
                <p className="text-[10px] text-white/60">Weight</p>
                <p className="font-semibold text-xs">Track</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-[10px] p-2.5 text-center">
                <Droplets className="h-4 w-4 mx-auto mb-0.5 text-white/80" />
                <p className="text-[10px] text-white/60">Water</p>
                <p className="font-semibold text-xs">{waterProgress}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-[10px] p-2.5 text-center">
                <Heart className="h-4 w-4 mx-auto mb-0.5 text-white/80" />
                <p className="text-[10px] text-white/60">BP</p>
                <p className="font-semibold text-xs">Log</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-[10px] p-2.5 text-center">
                <Activity className="h-4 w-4 mx-auto mb-0.5 text-white/80" />
                <p className="text-[10px] text-white/60">Glucose</p>
                <p className="font-semibold text-xs">Log</p>
              </div>
            </div>
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
