import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Brain, Trophy, XCircle, BarChart3, UserMinus } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PerformanceDashboard } from "@/components/instructor/PerformanceDashboard";
import { SmartInsightsPanel } from "@/components/instructor/SmartInsightsPanel";
import { PassRateDashboard } from "@/components/instructor/PassRateDashboard";
import { CancellationAnalytics } from "@/components/instructor/CancellationAnalytics";
import { RevenuePerPupilChart } from "@/components/instructor/analytics/RevenuePerPupilChart";
import { BusiestHoursHeatmap } from "@/components/instructor/analytics/BusiestHoursHeatmap";
import { PupilProgressionTracker } from "@/components/instructor/analytics/PupilProgressionTracker";
import { ChurnAnalyticsChart } from "@/components/instructor/analytics/ChurnAnalyticsChart";
import { RetentionAlertsTile } from "@/components/instructor/dashboard/RetentionAlertsTile";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InstructorPerformance() {
  const { instructor, loading, user } = useInstructorAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("insights");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/instructor-app/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  if (!instructor?.id) {
    return null;
  }

  const showCancellations = instructor?.cancellation_analytics_enabled !== false;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Performance</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track your business metrics and AI-powered insights
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span> Insights
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="passrate" className="flex items-center gap-1.5 text-xs">
              <Trophy className="h-3.5 w-3.5" />
              Pass Rate
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex items-center gap-1.5 text-xs">
              <UserMinus className="h-3.5 w-3.5" />
              Retention
            </TabsTrigger>
            {showCancellations && (
              <TabsTrigger value="cancellations" className="flex items-center gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" />
                Cancellations
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="insights" className="mt-4">
            <SmartInsightsPanel instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <RevenuePerPupilChart instructorId={instructor.id} />
              <BusiestHoursHeatmap instructorId={instructor.id} />
            </div>
            <PupilProgressionTracker instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="passrate" className="mt-4">
            <PassRateDashboard instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <PerformanceDashboard instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="retention" className="mt-4 space-y-4">
            <RetentionAlertsTile instructorId={instructor.id} />
            <ChurnAnalyticsChart instructorId={instructor.id} />
          </TabsContent>

          {showCancellations && (
            <TabsContent value="cancellations" className="mt-4">
              <CancellationAnalytics instructorId={instructor.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
