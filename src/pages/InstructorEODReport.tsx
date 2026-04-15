import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { IOSPageWrapper, IOSPageTitle } from "@/components/instructor/IOSPageWrapper";
import { EnhancedEODReport } from "@/components/instructor/EnhancedEODReport";
import { FileText } from "lucide-react";

export default function InstructorEODReportPage() {
  return (
    <InstructorPortalLayout>
      <IOSPageWrapper>
        <IOSPageTitle
          icon={<FileText className="h-3.5 w-3.5 text-blue-600" />}
          iconBg="bg-blue-500/10"
          title="End of Day Report"
        />
        <EnhancedEODReport />
      </IOSPageWrapper>
    </InstructorPortalLayout>
  );
}
