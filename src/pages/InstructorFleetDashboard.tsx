import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { FleetDashboard } from "@/components/instructor/FleetDashboard";
import { UsageAnalytics } from "@/components/instructor/UsageAnalytics";
import { Gauge, BarChart3 } from "lucide-react";

export default function InstructorFleetDashboard() {
  const { instructor } = useInstructorAuth();

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
          <p className="text-muted-foreground text-sm ml-10">Vehicle intelligence & usage analytics</p>
        </div>

        {instructor?.id ? (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <FleetDashboard instructorId={instructor.id} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <UsageAnalytics instructorId={instructor.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
