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
      <div className="space-y-4 pb-24" style={{ fontFamily: "Inter, -apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="h-[29px] w-[29px] rounded-[7px] flex items-center justify-center" style={{ backgroundColor: "#E8ECF1" }}>
              <Heart className="h-3.5 w-3.5" style={{ color: "#2A394F" }} />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: "#18181B" }}>Health & Wellness</h1>
              <p className="text-[13px]" style={{ color: "#71717A" }}>Track your wellbeing</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { Icon: Scale, label: "Weight", value: "Track" },
            { Icon: Droplets, label: "Water", value: `${waterProgress}%` },
            { Icon: Heart, label: "BP", value: "Log" },
            { Icon: Activity, label: "Glucose", value: "Log" },
          ].map(({ Icon, label, value }) => (
            <div
              key={label}
              style={{ background: "#FFFFFF", borderRadius: 14, boxShadow: "0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)", padding: 10 }}
              className="text-center"
            >
              <Icon className="h-4 w-4 mx-auto mb-0.5" style={{ color: "#2A394F" }} />
              <p className="text-[10px]" style={{ color: "#71717A" }}>{label}</p>
              <p className="font-semibold text-xs" style={{ color: "#18181B" }}>{value}</p>
            </div>
          ))}
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
