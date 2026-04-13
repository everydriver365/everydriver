import { useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { SchoolDemoProvider } from "@/context/SchoolDemoContext";
import {
  demoSchool,
  demoSchoolInstructorIds,
} from "@/data/demoSchoolData";
import SchoolDashboardSection from "@/components/school/SchoolDashboardSection";
import SchoolInstructorsSection from "@/components/school/SchoolInstructorsSection";
import SchoolPupilsSection from "@/components/school/SchoolPupilsSection";
import SchoolBookingsSection from "@/components/school/SchoolBookingsSection";
import SchoolCalendarSection from "@/components/school/SchoolCalendarSection";
import SchoolPaymentsSection from "@/components/school/SchoolPaymentsSection";
import SchoolPayrollSection from "@/components/school/SchoolPayrollSection";
import SchoolReportsSection from "@/components/school/SchoolReportsSection";
import SchoolFleetSection from "@/components/school/SchoolFleetSection";
import SchoolTestResultsSection from "@/components/school/SchoolTestResultsSection";
import SchoolProfileSection from "@/components/school/SchoolProfileSection";
import SchoolBrandingSection from "@/components/school/SchoolBrandingSection";
import SchoolBookingPageSection from "@/components/school/SchoolBookingPageSection";
import SchoolNotificationsSection from "@/components/school/SchoolNotificationsSection";
import type { SchoolRecord } from "@/hooks/useSchoolData";

export default function DemoSchoolPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const school = demoSchool as unknown as SchoolRecord;
  const instructorIds = demoSchoolInstructorIds;
  const noop = () => {};

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <SchoolDashboardSection instructorIds={instructorIds} schoolName={school.name} />;
      case "instructors":
        return <SchoolInstructorsSection schoolId={school.id} onRefresh={noop} />;
      case "pupils":
        return <SchoolPupilsSection instructorIds={instructorIds} />;
      case "bookings":
        return <SchoolBookingsSection instructorIds={instructorIds} />;
      case "calendar":
        return <SchoolCalendarSection instructorIds={instructorIds} />;
      case "payments":
        return <SchoolPaymentsSection instructorIds={instructorIds} />;
      case "payroll":
        return <SchoolPayrollSection instructorIds={instructorIds} schoolId={school.id} />;
      case "reports":
        return <SchoolReportsSection instructorIds={instructorIds} schoolName={school.name} />;
      case "fleet":
        return <SchoolFleetSection instructorIds={instructorIds} />;
      case "test-results":
        return <SchoolTestResultsSection instructorIds={instructorIds} />;
      case "profile":
        return <SchoolProfileSection school={school} onRefresh={noop} />;
      case "branding":
        return <SchoolBrandingSection school={school} onRefresh={noop} />;
      case "booking-page":
        return <SchoolBookingPageSection school={school} onRefresh={noop} />;
      case "notifications":
        return <SchoolNotificationsSection school={school} onRefresh={noop} />;
      default:
        return null;
    }
  };

  return (
    <SchoolDemoProvider isDemo={true}>
      <SchoolLayout activeSection={activeSection} onSectionChange={setActiveSection} onLogout={noop} instructorIds={instructorIds}>
        {renderSection()}
      </SchoolLayout>
    </SchoolDemoProvider>
  );
}
