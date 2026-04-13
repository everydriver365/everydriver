import { useState } from "react";
import { SchoolLayout } from "@/components/school/SchoolLayout";
import { useSchoolAuth } from "@/context/SchoolAuthContext";
import { useNavigate } from "react-router-dom";
import { useSchoolData } from "@/hooks/useSchoolData";
import { SchoolDemoProvider } from "@/context/SchoolDemoContext";
import { Loader2 } from "lucide-react";
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
import SchoolFranchiseFeesSection from "@/components/school/SchoolFranchiseFeesSection";
import SchoolSubscriptionSection from "@/components/school/SchoolSubscriptionSection";
import SchoolPupilProgressSection from "@/components/school/SchoolPupilProgressSection";
import SchoolWebsiteSection from "@/components/school/SchoolWebsiteSection";
import SchoolPassRatesSection from "@/components/school/SchoolPassRatesSection";

export default function SchoolPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { signOut } = useSchoolAuth();
  const navigate = useNavigate();
  const { school, instructorIds, loading, refetch } = useSchoolData();

  const handleLogout = async () => {
    await signOut();
    navigate("/school/login");
  };

  if (loading) {
    return (
      <SchoolLayout activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} instructorIds={instructorIds}>
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </SchoolLayout>
    );
  }

  if (!school) {
    return (
      <SchoolLayout activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} instructorIds={instructorIds}>
        <div className="text-center py-20">
          <p className="text-muted-foreground">No school found for this account.</p>
        </div>
      </SchoolLayout>
    );
  }

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
      case "pupil-progress":
        return <SchoolPupilProgressSection instructorIds={instructorIds} />;
      case "instructors":
        return <SchoolInstructorsSection schoolId={school.id} onRefresh={refetch} />;
      case "pupils":
        return <SchoolPupilsSection instructorIds={instructorIds} />;
      case "bookings":
        return <SchoolBookingsSection instructorIds={instructorIds} />;
      case "calendar":
        return <SchoolCalendarSection instructorIds={instructorIds} />;
      case "courses":
        return <SchoolCoursesSection schoolId={school.id} instructorIds={instructorIds} />;
      case "enquiries":
        return <SchoolEnquiriesSection instructorIds={instructorIds} />;
      case "messages":
        return <SchoolMessagesSection instructorIds={instructorIds} />;
      case "compliance":
        return <SchoolComplianceSection instructorIds={instructorIds} />;
      case "payments":
        return <SchoolPaymentsSection instructorIds={instructorIds} />;
      case "payment-gateways":
        return <SchoolPaymentGatewaysSection school={school} onRefresh={refetch} />;
      case "bnpl":
        return <SchoolBNPLSection school={school} onRefresh={refetch} />;
      case "payroll":
        return <SchoolPayrollSection instructorIds={instructorIds} schoolId={school.id} />;
      case "reports":
        return <SchoolReportsSection instructorIds={instructorIds} schoolName={school.name} />;
      case "fleet":
        return <SchoolFleetSection instructorIds={instructorIds} />;
      case "test-results":
        return <SchoolTestResultsSection instructorIds={instructorIds} />;
      case "pass-rates":
        return <SchoolPassRatesSection instructorIds={instructorIds} />;
      case "discount-codes":
        return <SchoolDiscountCodesSection schoolId={school.id} />;
      case "campaigns":
        return <SchoolCampaignsSection schoolId={school.id} />;
      case "profile":
        return <SchoolProfileSection school={school} onRefresh={refetch} />;
      case "branding":
        return <SchoolBrandingSection school={school} onRefresh={refetch} />;
      case "booking-page":
        return <SchoolBookingPageSection school={school} onRefresh={refetch} />;
      case "booking-pages":
        return <SchoolBookingPagesSection instructorIds={instructorIds} schoolId={school.id} />;
      case "notifications":
        return <SchoolNotificationsSection school={school} onRefresh={refetch} />;
      case "franchise-fees":
        return <SchoolFranchiseFeesSection schoolId={school.id} />;
      case "subscription":
        return <SchoolSubscriptionSection instructorIds={instructorIds} schoolName={school.name} />;
      case "website":
        return <SchoolWebsiteSection school={school} onRefresh={refetch} />;
      default:
        return null;
    }
  };

  return (
    <SchoolDemoProvider isDemo={false}>
      <SchoolLayout activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} instructorIds={instructorIds} enabledFeatures={school.enabled_features} schoolId={school.id} notificationPreferences={school.notification_preferences as Record<string, boolean> | null}>
        {renderSection()}
      </SchoolLayout>
    </SchoolDemoProvider>
  );
}
