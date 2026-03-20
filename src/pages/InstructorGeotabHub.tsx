import { useState, useEffect } from "react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Satellite, Gauge, MapPin, Route, Camera, FileText, Activity, Shield,
  Lock, Crown, AlertTriangle, Play, Fuel, Zap, ShieldAlert,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

// Tab components
import { GeotabOverviewTab } from "@/components/instructor/geotab/GeotabOverviewTab";
import { GeotabTripHistory } from "@/components/instructor/geotab/GeotabTripHistory";
import { GeotabReportsTab } from "@/components/instructor/geotab/GeotabReportsTab";
import { FleetLiveMap } from "@/components/instructor/FleetLiveMap";
import { GeofenceEditor } from "@/components/instructor/GeofenceEditor";
import { GeofenceAlertsList } from "@/components/instructor/GeofenceAlertsList";
import { GeotabDiagnosticsTab } from "@/components/instructor/geotab/GeotabDiagnosticsTab";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { GeotabDriverBehaviourTab } from "@/components/instructor/geotab/GeotabDriverBehaviourTab";
import { GeotabFuelTab } from "@/components/instructor/geotab/GeotabFuelTab";
import { GeotabImpactTab } from "@/components/instructor/geotab/GeotabImpactTab";


export default function InstructorGeotabHub() {
  const { instructor, subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const [hasGeotabDevice, setHasGeotabDevice] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const planSlug = subscription?.plan_slug || "free";
  const isFreePlan = planSlug === "free";

  useEffect(() => {
    if (!instructor?.id) return;
    supabase
      .from("gps_devices")
      .select("id")
      .eq("instructor_id", instructor.id)
      .eq("tracking_provider", "geotab")
      .limit(1)
      .then(({ data }) => {
        setHasGeotabDevice(!!data && data.length > 0);
      });
  }, [instructor?.id]);

  if (!instructor) {
    return (
      <InstructorPortalLayout>
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      </InstructorPortalLayout>
    );
  }

  if (hasGeotabDevice === false) {
    return (
      <InstructorPortalLayout>
        <div className="p-3 sm:p-6 pb-24">
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Geotab Not Available</h2>
                <p className="text-muted-foreground max-w-md">
                  You don't have a Geotab device assigned yet. Please contact your admin to have a tracker set up for your vehicle.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </InstructorPortalLayout>
    );
  }

  if (isFreePlan) {
    return (
      <InstructorPortalLayout>
        <div className="p-3 sm:p-6 pb-24">
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Geotab Hub is a Pro Feature</h2>
                <p className="text-muted-foreground max-w-md">
                  Upgrade your plan to access live tracking, trip history, dashcam footage, diagnostics and reports.
                </p>
              </div>
              <Button onClick={() => navigate("/instructor/plans")} className="gap-2">
                <Crown className="h-4 w-4" /> Upgrade Your Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 pb-24">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Satellite className="h-4 w-4 text-primary" />
            </div>
            Geotab Hub
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm ml-10 hidden sm:block">
            Vehicle tracking, trips, dashcam & diagnostics
          </p>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-11 gap-1 text-[10px]">
              <TabsTrigger value="overview" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Gauge className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="livemap" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Live Map</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Route className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Trips</span>
              </TabsTrigger>
              <TabsTrigger value="routes" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Play className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Routes</span>
              </TabsTrigger>
              <TabsTrigger value="dashcam" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Camera className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Dashcam</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Activity className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Diagnostics</span>
              </TabsTrigger>
              <TabsTrigger value="geofences" className="flex items-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Shield className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline sm:inline">Geofences</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-4">
            <GeotabOverviewTab />
          </TabsContent>

          <TabsContent value="livemap" className="mt-4 data-[state=inactive]:hidden" forceMount>
            <FleetLiveMap instructorId={instructor.id} isVisible={activeTab === "livemap"} />
          </TabsContent>

          <TabsContent value="trips" className="mt-4">
            <GeotabTripHistory instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="routes" className="mt-4">
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <Play className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">Trip Replay</h3>
                <p className="text-sm text-muted-foreground">
                  Select a trip from the Trips tab and click the play button to replay the route on the map.
                </p>
                <Button variant="outline" onClick={() => navigate("/instructor/trip-replay")}>
                  Open Trip Replay
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashcam" className="mt-4">
            <DashcamGalleryView instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <GeotabReportsTab instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-4">
            <GeotabDiagnosticsTab />
          </TabsContent>

          <TabsContent value="geofences" className="mt-4">
            <div className="space-y-6">
              <GeofenceEditor instructorId={instructor.id} />
              <GeofenceAlertsList instructorId={instructor.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
