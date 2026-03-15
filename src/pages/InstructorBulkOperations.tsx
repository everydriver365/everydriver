import { useState } from "react";
import { MessageSquare, CalendarSync, PoundSterling } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { BulkSMSTab } from "@/components/instructor/bulk-ops/BulkSMSTab";
import { BulkRescheduleTab } from "@/components/instructor/bulk-ops/BulkRescheduleTab";
import { BulkPriceUpdateTab } from "@/components/instructor/bulk-ops/BulkPriceUpdateTab";

export default function InstructorBulkOperations() {
  const { instructor } = useInstructorAuth();

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-xl font-bold">Bulk Operations</h1>
          <p className="text-sm text-muted-foreground">Manage multiple pupils and lessons at once</p>
        </div>

        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sms" className="gap-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="reschedule" className="gap-1 text-xs">
              <CalendarSync className="h-3.5 w-3.5" />
              Reschedule
            </TabsTrigger>
            <TabsTrigger value="price" className="gap-1 text-xs">
              <PoundSterling className="h-3.5 w-3.5" />
              Price
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sms">
            <BulkSMSTab instructorId={instructor?.id} />
          </TabsContent>
          <TabsContent value="reschedule">
            <BulkRescheduleTab instructorId={instructor?.id} />
          </TabsContent>
          <TabsContent value="price">
            <BulkPriceUpdateTab instructorId={instructor?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
