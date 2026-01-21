import { GapsFiller } from "@/components/instructor/GapsFiller";
import { WaitlistManager } from "@/components/instructor/WaitlistManager";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MapPin, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InstructorGaps() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;

  if (!instructorId) {
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Gaps & Waitlist</h1>
        </div>

        <Tabs defaultValue="gaps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gaps" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Fill Gaps
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Waitlist
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gaps" className="mt-4">
            <GapsFiller instructorId={instructorId} />
          </TabsContent>
          <TabsContent value="waitlist" className="mt-4">
            <WaitlistManager instructorId={instructorId} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
