import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FleetDashboard } from "@/components/instructor/FleetDashboard";
import { GeofenceEditor } from "@/components/instructor/GeofenceEditor";
import { GeofenceAlertsList } from "@/components/instructor/GeofenceAlertsList";
import { UnauthorisedMovementAlerts } from "@/components/instructor/UnauthorisedMovementAlerts";
import { RouteHeatmap } from "@/components/instructor/RouteHeatmap";
import { ScheduledReportsSettings } from "@/components/instructor/ScheduledReportsSettings";
import { TrackedLessons } from "@/components/instructor/TrackedLessons";
import { PupilProgressReportGenerator } from "@/components/instructor/PupilProgressReportGenerator";
import { FleetMileageTracker } from "@/components/instructor/FleetMileageTracker";
import { FleetLiveMap } from "@/components/instructor/FleetLiveMap";
import { DashcamGalleryView } from "@/components/instructor/dashcam/DashcamGalleryView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";
import { cn } from "@/lib/utils";

import {
  Gauge, MapPin, Play, Route, Flame, Shield, AlertTriangle, Camera,
  Mail, Lock, Crown, Activity, CircleDot, Wrench, ShieldAlert,
  Fuel, Zap, ChevronRight,
} from "lucide-react";

// Geotab-specific tab components
import { GeotabTripHistory } from "@/components/instructor/geotab/GeotabTripHistory";
import { GeotabDiagnosticsTab } from "@/components/instructor/geotab/GeotabDiagnosticsTab";
import { GeotabExtendedDiagnosticsTab } from "@/components/instructor/geotab/GeotabExtendedDiagnosticsTab";
import { GeotabFaultCodesTab } from "@/components/instructor/geotab/GeotabFaultCodesTab";
import { GeotabContextualSpeedTab } from "@/components/instructor/geotab/GeotabContextualSpeedTab";
import { GeotabDriverBehaviourTab } from "@/components/instructor/geotab/GeotabDriverBehaviourTab";
import { GeotabFuelTab } from "@/components/instructor/geotab/GeotabFuelTab";
import { GeotabImpactTab } from "@/components/instructor/geotab/GeotabImpactTab";

interface TabDef {
  id: string;
  icon: React.ElementType;
  label: string;
  category: string;
}

const GENERAL_TABS: TabDef[] = [
  { id: "overview", icon: Gauge, label: "Overview", category: "general" },
  { id: "livemap", icon: MapPin, label: "Live Map", category: "general" },
  { id: "lessons", icon: Play, label: "Lessons", category: "general" },
  { id: "mileage", icon: Route, label: "Mileage", category: "general" },
  { id: "heatmap", icon: Flame, label: "Heatmap", category: "general" },
  { id: "geofences", icon: Shield, label: "Geofences", category: "general" },
  { id: "movement", icon: AlertTriangle, label: "Alerts", category: "general" },
  { id: "dashcam", icon: Camera, label: "Dashcam", category: "general" },
  { id: "reports", icon: Mail, label: "Reports", category: "general" },
];

const GEOTAB_TABS: TabDef[] = [
  { id: "trips", icon: Route, label: "Trips", category: "geotab" },
  { id: "diagnostics", icon: Activity, label: "Diagnostics", category: "geotab" },
  { id: "sensors", icon: CircleDot, label: "Sensors", category: "geotab" },
  { id: "faults", icon: Wrench, label: "Faults", category: "geotab" },
  { id: "speeding", icon: Gauge, label: "Speeding", category: "geotab" },
  { id: "behaviour", icon: ShieldAlert, label: "Behaviour", category: "geotab" },
  { id: "fuel", icon: Fuel, label: "Fuel", category: "geotab" },
  { id: "impact", icon: Zap, label: "Impact", category: "geotab" },
];

export default function InstructorFleetDashboard() {
  const { instructor, subscription } = useInstructorAuth();
  const navigate = useNavigate();
  const planSlug = subscription?.plan_slug || "free";
  const isFreePlan = planSlug === "free";
  const [pupils, setPupils] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const { activeProvider } = useActiveTrackingProvider(instructor?.id);
  const isGeotab = false; // Geotab removed — Radius only

  const allTabs = GENERAL_TABS;
  const currentTabDef = allTabs.find(t => t.id === activeTab);

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
      <div className="pb-24">
        {/* ── Apple Health header ── */}
        <div className="px-5 pt-6 pb-4">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.12em] font-semibold mb-0.5">
            Telematics
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-foreground leading-tight tracking-tight">
              Vehicle Health
            </h1>
            {isGeotab && (
              <Badge variant="secondary" className="bg-success/10 text-success border-0 text-[10px] gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Geotab
              </Badge>
            )}
          </div>
        </div>

        {isFreePlan ? (
          <div className="px-5">
            <Card className="border-dashed border-2 border-muted-foreground/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-warning" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Telematics is a Pro Feature</h2>
                  <p className="text-muted-foreground max-w-md text-sm">
                    Upgrade your plan to access real-time fleet analytics, geofencing, route heatmaps, unauthorised movement alerts and scheduled reports.
                  </p>
                </div>
                <Button onClick={() => navigate("/instructor/plans")} className="gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade Your Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : instructor?.id ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* ── Tab navigation: category-grouped pill buttons ── */}
            <div className="px-5 space-y-3 mb-4">
              {/* General tabs */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-1.5 px-0.5">
                  General
                </p>
                <TabsList className="bg-transparent h-auto p-0 gap-1.5 flex flex-wrap">
                  {GENERAL_TABS.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=inactive]:shadow-none",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
                      )}
                    >
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Geotab tabs */}
              {isGeotab && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-1.5 px-0.5">
                    Geotab Deep Dive
                  </p>
                  <TabsList className="bg-transparent h-auto p-0 gap-1.5 flex flex-wrap">
                    {GEOTAB_TABS.map(tab => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border data-[state=inactive]:bg-card data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-border data-[state=inactive]:shadow-none",
                          "data-[state=active]:bg-chart-1 data-[state=active]:text-white data-[state=active]:border-chart-1 data-[state=active]:shadow-md"
                        )}
                      >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              )}
            </div>

            {/* ── Tab content ── */}
            <div className="px-4 sm:px-5">
              <TabsContent value="overview" className="mt-0">
                <FleetDashboard instructorId={instructor.id} onTabChange={setActiveTab} />
              </TabsContent>
              <TabsContent value="livemap" className="mt-0 data-[state=inactive]:hidden" forceMount>
                <FleetLiveMap instructorId={instructor.id} isVisible={activeTab === "livemap"} />
              </TabsContent>
              <TabsContent value="lessons" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <TrackedLessons instructorId={instructor.id} />
                  </div>
                  <div>
                    <PupilProgressReportGenerator instructorId={instructor.id} pupils={pupils} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="mileage" className="mt-0">
                <FleetMileageTracker instructorId={instructor.id} />
              </TabsContent>
              <TabsContent value="heatmap" className="mt-0">
                <RouteHeatmap instructorId={instructor.id} />
              </TabsContent>
              <TabsContent value="geofences" className="mt-0">
                <div className="space-y-6">
                  <GeofenceEditor instructorId={instructor.id} />
                  <GeofenceAlertsList instructorId={instructor.id} />
                </div>
              </TabsContent>
              <TabsContent value="movement" className="mt-0">
                <UnauthorisedMovementAlerts instructorId={instructor.id} />
              </TabsContent>
              <TabsContent value="dashcam" className="mt-0">
                <DashcamGalleryView instructorId={instructor.id} />
              </TabsContent>
              <TabsContent value="reports" className="mt-0">
                <ScheduledReportsSettings instructorId={instructor.id} />
              </TabsContent>

              {/* Geotab-specific tab content */}
              {isGeotab && (
                <>
                  <TabsContent value="trips" className="mt-0">
                    <GeotabTripHistory instructorId={instructor.id} />
                  </TabsContent>
                  <TabsContent value="diagnostics" className="mt-0">
                    <GeotabDiagnosticsTab />
                  </TabsContent>
                  <TabsContent value="sensors" className="mt-0">
                    <GeotabExtendedDiagnosticsTab />
                  </TabsContent>
                  <TabsContent value="faults" className="mt-0">
                    <GeotabFaultCodesTab />
                  </TabsContent>
                  <TabsContent value="speeding" className="mt-0">
                    <GeotabContextualSpeedTab />
                  </TabsContent>
                  <TabsContent value="behaviour" className="mt-0">
                    <GeotabDriverBehaviourTab />
                  </TabsContent>
                  <TabsContent value="fuel" className="mt-0">
                    <GeotabFuelTab />
                  </TabsContent>
                  <TabsContent value="impact" className="mt-0">
                    <GeotabImpactTab />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        ) : (
          <p className="text-muted-foreground px-5">Loading...</p>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
