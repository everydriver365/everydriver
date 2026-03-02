import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Brain, Trophy, XCircle } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PerformanceDashboard } from "@/components/instructor/PerformanceDashboard";
import { SmartInsightsPanel } from "@/components/instructor/SmartInsightsPanel";
import { PassRateDashboard } from "@/components/instructor/PassRateDashboard";
import { CancellationAnalytics } from "@/components/instructor/CancellationAnalytics";
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
          <TabsList className={`grid w-full ${instructor?.cancellation_analytics_enabled !== false ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span> Insights
            </TabsTrigger>
            <TabsTrigger value="passrate" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Pass Rate
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            {instructor?.cancellation_analytics_enabled !== false && (
              <TabsTrigger value="cancellations" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Cancellations
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="insights" className="mt-4">
            <SmartInsightsPanel instructorId={instructor.id} />
          </TabsContent>
          <TabsContent value="passrate" className="mt-4">
            <PassRateDashboard instructorId={instructor.id} />
          </TabsContent>
          <TabsContent value="metrics" className="mt-4">
            <PerformanceDashboard instructorId={instructor.id} />
          </TabsContent>
          {instructor?.cancellation_analytics_enabled !== false && (
            <TabsContent value="cancellations" className="mt-4">
              <CancellationAnalytics instructorId={instructor.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
