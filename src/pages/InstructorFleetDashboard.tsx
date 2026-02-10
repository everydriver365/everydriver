import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FleetDashboard } from "@/components/instructor/FleetDashboard";
import { UsageAnalytics } from "@/components/instructor/UsageAnalytics";
import { GeofenceEditor } from "@/components/instructor/GeofenceEditor";
import { GeofenceAlertsList } from "@/components/instructor/GeofenceAlertsList";
import { UnauthorisedMovementAlerts } from "@/components/instructor/UnauthorisedMovementAlerts";
import { RouteHeatmap } from "@/components/instructor/RouteHeatmap";
import { ScheduledReportsSettings } from "@/components/instructor/ScheduledReportsSettings";
import { TrackedLessons } from "@/components/instructor/TrackedLessons";
import { PupilProgressReportGenerator } from "@/components/instructor/PupilProgressReportGenerator";
import { FleetMileageTracker } from "@/components/instructor/FleetMileageTracker";
import { FleetLiveMap } from "@/components/instructor/FleetLiveMap";
import { Gauge, BarChart3, Shield, AlertTriangle, Flame, Mail, Lock, Crown, Play, FileText, Route, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function InstructorFleetDashboard() {
  const { instructor, subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const planSlug = subscription?.plan_slug || "free";
  const isFreePlan = planSlug === "free";
  const [pupils, setPupils] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("pupils")
      .select("id, name")
      .eq("instructor_id", instructor.id)
      .order("name")
      .then(({ data }) => {
        if (data) setPupils(data.filter(p => p.name));
      });
  }, [instructor?.id]);

  return (
    <InstructorPortalLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-24">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            Fleet Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm ml-10 hidden sm:block">Vehicle intelligence, alerts & analytics</p>
        </div>

        {isFreePlan ? (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Fleet Dashboard is a Pro Feature</h2>
                <p className="text-muted-foreground max-w-md">
                  Upgrade your plan to access real-time fleet analytics, geofencing, route heatmaps, unauthorised movement alerts and scheduled reports.
                </p>
              </div>
              <Button
                onClick={() => navigate("/instructor/plans")}
                className="gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade Your Plan
              </Button>
            </CardContent>
          </Card>
        ) : instructor?.id ? (
          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-9 gap-1 text-[10px]">
                <TabsTrigger value="overview" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Gauge className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="livemap" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Live Map</span>
                </TabsTrigger>
                <TabsTrigger value="lessons" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Play className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Lessons</span>
                </TabsTrigger>
                <TabsTrigger value="mileage" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Route className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Mileage</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <BarChart3 className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Flame className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Heatmap</span>
                </TabsTrigger>
                <TabsTrigger value="geofences" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Shield className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Geofences</span>
                </TabsTrigger>
                <TabsTrigger value="movement" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Reports</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-4">
              <FleetDashboard instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="livemap" className="mt-4 data-[state=inactive]:hidden" forceMount>
              <FleetLiveMap instructorId={instructor.id} isVisible={activeTab === "livemap"} />
            </TabsContent>
            <TabsContent value="lessons" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <TrackedLessons instructorId={instructor.id} />
                </div>
                <div>
                  <PupilProgressReportGenerator instructorId={instructor.id} pupils={pupils} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="mileage" className="mt-4">
              <FleetMileageTracker instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
            </TabsContent>
            <TabsContent value="heatmap" className="mt-4">
              <RouteHeatmap instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="geofences" className="mt-4">
              <div className="space-y-6">
                <GeofenceEditor instructorId={instructor.id} />
                <GeofenceAlertsList instructorId={instructor.id} />
              </div>
            </TabsContent>
            <TabsContent value="movement" className="mt-4">
              <UnauthorisedMovementAlerts instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <ScheduledReportsSettings instructorId={instructor.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </InstructorPortalLayout>
  );
}