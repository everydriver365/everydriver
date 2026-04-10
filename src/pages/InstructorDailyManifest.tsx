import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { DailyManifest } from "@/components/instructor/DailyManifest";
import { ClipboardList } from "lucide-react";

export default function InstructorDailyManifestPage() {
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <InstructorPageHeader lucideIcon={ClipboardList} title="Daily Manifest" />
        <DailyManifest />
      </div>
    </InstructorPortalLayout>
  );
}
