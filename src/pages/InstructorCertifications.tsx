import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { CertificationTracker } from "@/components/instructor/CertificationTracker";
import { Award } from "lucide-react";

export default function InstructorCertificationsPage() {
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <InstructorPageHeader lucideIcon={Award} title="Certifications & Progress" />
        <CertificationTracker />
      </div>
    </InstructorPortalLayout>
  );
}
