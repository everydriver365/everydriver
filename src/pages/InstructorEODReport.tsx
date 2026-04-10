import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { EnhancedEODReport } from "@/components/instructor/EnhancedEODReport";
import { FileText } from "lucide-react";

export default function InstructorEODReportPage() {
  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <InstructorPageHeader lucideIcon={FileText} title="End of Day Report" />
        <EnhancedEODReport />
      </div>
    </InstructorPortalLayout>
  );
}
