import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { ReferralSettingsCard } from "@/components/instructor/ReferralSettingsCard";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

export default function InstructorReferrals() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();

  if (!instructor) {
    return (
      <InstructorPortalLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Referrals</h1>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-lg mx-auto">
          <ReferralSettingsCard instructorId={instructor.id} />
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
