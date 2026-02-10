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
import { Gauge, BarChart3, Shield, AlertTriangle, Flame, Mail, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function InstructorFleetDashboard() {
  const { instructor, subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const planSlug = subscription?.plan_slug || "free";
  const isFreePlan = planSlug === "free";

  return (
    <InstructorPortalLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-primary" />
            </div>
            Fleet Dashboard
          </h1>
          <p className="text-muted-foreground text-sm ml-10">Vehicle intelligence, alerts & analytics</p>
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
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 text-[10px]">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="geofences" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Geofences
              </TabsTrigger>
              <TabsTrigger value="movement" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <FleetDashboard instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <UsageAnalytics instructorId={instructor.id} />
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