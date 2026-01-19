import { useState } from "react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "@/components/instructor/AccountSettings";
import { EarningsCalculator } from "@/components/instructor/EarningsCalculator";
import { Settings, TrendingUp } from "lucide-react";

export default function InstructorAccounts() {
  const { instructor } = useInstructorAuth();
  const [activeTab, setActiveTab] = useState("earnings");

  if (!instructor?.id) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="earnings" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <EarningsCalculator instructorId={instructor.id} />
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings instructorId={instructor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
