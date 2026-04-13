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
import SchoolCoursesSection from "@/components/school/SchoolCoursesSection";
import SchoolBNPLSection from "@/components/school/SchoolBNPLSection";
import SchoolPaymentGatewaysSection from "@/components/school/SchoolPaymentGatewaysSection";
import SchoolEnquiriesSection from "@/components/school/SchoolEnquiriesSection";
import SchoolMessagesSection from "@/components/school/SchoolMessagesSection";
import SchoolLiveMapSection from "@/components/school/SchoolLiveMapSection";
import SchoolComplianceSection from "@/components/school/SchoolComplianceSection";
import SchoolRevenueAnalyticsSection from "@/components/school/SchoolRevenueAnalyticsSection";
import SchoolDiscountCodesSection from "@/components/school/SchoolDiscountCodesSection";
import SchoolLeaderboardSection from "@/components/school/SchoolLeaderboardSection";
import SchoolBookingPagesSection from "@/components/school/SchoolBookingPagesSection";
import SchoolCampaignsSection from "@/components/school/SchoolCampaignsSection";
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
      case "live-map":
        return <SchoolLiveMapSection instructorIds={instructorIds} />;
      case "revenue-analytics":
        return <SchoolRevenueAnalyticsSection instructorIds={instructorIds} />;
      case "leaderboard":
        return <SchoolLeaderboardSection instructorIds={instructorIds} />;
      case "instructors":
        return <SchoolInstructorsSection schoolId={school.id} onRefresh={noop} />;
      case "pupils":
        return <SchoolPupilsSection instructorIds={instructorIds} />;
      case "bookings":
        return <SchoolBookingsSection instructorIds={instructorIds} />;
      case "calendar":
        return <SchoolCalendarSection instructorIds={instructorIds} />;
      case "courses":
        return <SchoolCoursesSection schoolId={school.id} instructorIds={demoSchoolInstructorIds} />;
      case "enquiries":
        return <SchoolEnquiriesSection instructorIds={instructorIds} />;
      case "messages":
        return <SchoolMessagesSection instructorIds={instructorIds} />;
      case "compliance":
        return <SchoolComplianceSection instructorIds={instructorIds} />;
      case "payments":
        return <SchoolPaymentsSection instructorIds={instructorIds} />;
      case "payment-gateways":
        return <SchoolPaymentGatewaysSection school={school} onRefresh={noop} />;
      case "bnpl":
        return <SchoolBNPLSection school={school} onRefresh={noop} />;
      case "payroll":
        return <SchoolPayrollSection instructorIds={instructorIds} schoolId={school.id} />;
      case "reports":
        return <SchoolReportsSection instructorIds={instructorIds} schoolName={school.name} />;
      case "fleet":
        return <SchoolFleetSection instructorIds={instructorIds} />;
      case "test-results":
        return <SchoolTestResultsSection instructorIds={instructorIds} />;
      case "discount-codes":
        return <SchoolDiscountCodesSection schoolId={school.id} />;
      case "campaigns":
        return <SchoolCampaignsSection schoolId={school.id} />;
      case "profile":
        return <SchoolProfileSection school={school} onRefresh={noop} />;
      case "branding":
        return <SchoolBrandingSection school={school} onRefresh={noop} />;
      case "booking-page":
        return <SchoolBookingPageSection school={school} onRefresh={noop} />;
      case "booking-pages":
        return <SchoolBookingPagesSection instructorIds={instructorIds} schoolId={school.id} />;
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
