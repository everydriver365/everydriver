import {
  User, Briefcase, CreditCard, Calendar, Car, MessageCircle, Plug, Settings as SettingsIcon, MapPin,
} from "lucide-react";
import type { SettingsCategory } from "./SettingsLayout";

import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";
import { ProfileBasicsEditor } from "@/components/instructor/ProfileBasicsEditor";
import { ProfileMediaEditor } from "@/components/instructor/ProfileMediaEditor";
import { AccountSecurityPanel } from "@/components/instructor/AccountSecurityPanel";
import { AccountDangerZone } from "@/components/instructor/AccountDangerZone";
import { CompactStandardsCheck } from "@/components/instructor/CompactStandardsCheck";
import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";
import { QualificationsEditor } from "@/components/instructor/settings/QualificationsEditor";
import { TestCentresAndExaminersManager } from "@/components/instructor/TestCentresAndExaminersManager";
import { TermsConditionsEditor } from "@/components/instructor/TermsConditionsEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { NoShowPolicySettings } from "@/components/instructor/NoShowPolicySettings";
import { GDPRRetentionWidget } from "@/components/instructor/GDPRRetentionWidget";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { MiniWebsiteShare } from "@/components/instructor/MiniWebsiteShare";
import { MiniWebsiteCMS } from "@/components/instructor/MiniWebsiteCMS";
import { MiniWebsiteThemeEditor } from "@/components/instructor/MiniWebsiteThemeEditor";
import { InstructorCoursesManager } from "@/components/instructor/InstructorCoursesManager";
import { BookingModeSelector } from "@/components/instructor/BookingModeSelector";
import { DepositSettingsEditor } from "@/components/instructor/DepositSettingsEditor";
import { CommissionPayerSettings } from "@/components/instructor/CommissionPayerSettings";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { ReferralSettingsCard } from "@/components/instructor/ReferralSettingsCard";
import { PaymentOptionsSettings } from "@/components/instructor/PaymentOptionsSettings";
import { InstructorDiscountCodesManager } from "@/components/instructor/InstructorDiscountCodesManager";
import { LessonPackageManager } from "@/components/instructor/LessonPackageManager";
import { IntakeQuestionsSettings } from "@/components/instructor/IntakeQuestionsSettings";
import { PricingRulesSettings } from "@/components/instructor/PricingRulesSettings";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { IcsCalendarSync } from "@/components/instructor/IcsCalendarSync";
import { ReminderSettings } from "@/components/instructor/ReminderSettings";
import { PupilBookingSettingsEditor } from "@/components/instructor/PupilBookingSettingsEditor";
import { StartDateOnlyBookingEditor } from "@/components/instructor/StartDateOnlyBookingEditor";
import { LessonLengthBufferEditor } from "@/components/instructor/settings/LessonLengthBufferEditor";
import { CallAnsweringSettings } from "@/components/instructor/CallAnsweringSettings";
import NotificationPreferencesPanel from "@/components/instructor/notifications/NotificationPreferencesPanel";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { FamulorHub } from "@/components/famulor/FamulorHub";
import { DataExportManager } from "@/components/instructor/DataExportManager";
import { DashboardLayoutManager } from "@/components/instructor/DashboardLayoutManager";
import { AppearanceSettings } from "@/components/instructor/AppearanceSettings";
import { ResetStatsDialog } from "@/components/instructor/ResetStatsDialog";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";
import { HourlyRateSection, CoverageSection, PostcodeRatesSection, RateModifiersSection } from "./RatesCoverageSections";

/**
 * Returns the 8 settings categories for the instructor portal.
 *
 * Each section embeds an existing, working manager component — this
 * keeps RLS, save handlers, and validation behaviour intact while
 * giving the user a single, organised hub.
 */
export function useSettingsCategories(): SettingsCategory[] {
  const { instructor, refreshInstructor } = useInstructorAuth();
  const id = instructor?.id;

  if (!id) return [];

  return [
    {
      id: "account",
      title: "Account",
      description: "Your profile, credentials and account security",
      icon: User,
      iconBg: "#DBEAFE",
      iconColor: "#1E40AF",
      sections: [
        {
          id: "profile",
          title: "Profile & contact",
          render: () => (
            <div className="space-y-6">
              <ProfileBasicsEditor instructorId={id} />
              <div className="border-t pt-6">
                <InstructorDetailsEditor instructorId={id} />
              </div>
            </div>
          ),
        },
        { id: "media", title: "Profile media", render: () => <ProfileMediaEditor instructorId={id} /> },
        { id: "qualifications", title: "Qualifications & credentials", render: () => <QualificationsEditor instructorId={id} /> },
        { id: "standards-check", title: "DVSA Standards Check", render: () => <CompactStandardsCheck instructorId={id} /> },
        { id: "compliance", title: "Vehicle docs & CPD", render: () => <ComplianceTracker instructorId={id} /> },
        { id: "security", title: "Login & security", render: () => <AccountSecurityPanel /> },
      ],
    },
    {
      id: "business",
      title: "Business",
      description: "Rates, coverage, courses, policies and branding",
      icon: Briefcase,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      sections: [
        {
          id: "hourly-rate",
          title: "Hourly rate & surcharges",
          render: () => (
            <div className="space-y-6">
              <HourlyRateSection instructorId={id} />
              <div className="border-t pt-6">
                <RateModifiersSection instructorId={id} />
              </div>
            </div>
          ),
        },
        { id: "coverage", title: "Coverage area", render: () => <CoverageSection instructorId={id} /> },
        { id: "postcode-rates", title: "Postcode rates", render: () => <PostcodeRatesSection instructorId={id} /> },
        {
          id: "courses",
          title: "Courses & packages",
          render: () => (
            <div className="space-y-6">
              <InstructorCoursesManager instructorId={id} />
              <div className="border-t pt-6">
                <LessonPackageManager instructorId={id} />
              </div>
            </div>
          ),
        },
        { id: "discounts", title: "Discount codes", render: () => <InstructorDiscountCodesManager instructorId={id} /> },
        {
          id: "terms",
          title: "Terms & cancellation policy",
          render: () => (
            <div className="space-y-6">
              <TermsConditionsEditor instructorId={id} />
              <div className="border-t pt-6">
                <CancellationPolicyEditor instructorId={id} />
              </div>
              <div className="border-t pt-6">
                <NoShowPolicySettings instructorId={id} />
              </div>
            </div>
          ),
        },
        { id: "test-centres", title: "Test centres & examiners", render: () => <TestCentresAndExaminersManager instructorId={id} /> },
        { id: "referrals", title: "Referrals", render: () => <ReferralSettingsCard instructorId={id} /> },
      ],
    },
    {
      id: "bookings",
      title: "Booking & payments",
      description: "How pupils book, pay and what options they see",
      icon: CreditCard,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
      sections: [
        {
          id: "booking-mode",
          title: "Booking mode",
          render: () => (
            <BookingModeSelector
              instructorId={id}
              currentMode={(instructor as { booking_mode?: "pupil_choice" | "instructor_offer" })?.booking_mode || "pupil_choice"}
            />
          ),
        },
        { id: "lesson-length", title: "Lesson length & buffer", render: () => <LessonLengthBufferEditor instructorId={id} /> },
        { id: "self-service", title: "Pupil self-service", render: () => <PupilBookingSettingsEditor instructorId={id} /> },
        { id: "intake", title: "Intake questions", render: () => <IntakeQuestionsSettings instructorId={id} /> },
        { id: "pricing-rules", title: "Pricing rules", render: () => <PricingRulesSettings instructorId={id} /> },
        { id: "deposits", title: "Deposit settings", render: () => <DepositSettingsEditor instructorId={id} /> },
        { id: "payment-options", title: "Payment options", render: () => <PaymentOptionsSettings instructorId={id} /> },
        {
          id: "commission",
          title: "Commission payer",
          render: () => (
            <CommissionPayerSettings
              instructorId={id}
              initialPayer={(instructor as { commission_payer?: string })?.commission_payer}
              initialSplitPercent={(instructor as { commission_split_percent?: number })?.commission_split_percent}
            />
          ),
        },
        {
          id: "square",
          title: "Square",
          render: () => (
            <SquareConnectSettings
              instructorId={id}
              squareMerchantId={(instructor as { square_merchant_id?: string })?.square_merchant_id}
              squareConnectedAt={(instructor as { square_connected_at?: string })?.square_connected_at}
              onUpdate={refreshInstructor}
            />
          ),
        },
      ],
    },
    {
      id: "schedule",
      title: "Schedule",
      description: "Working hours, calendar sync and reminders",
      icon: Calendar,
      iconBg: "#EDE9FE",
      iconColor: "#7C3AED",
      sections: [
        { id: "hours", title: "Working hours", render: () => <WorkingHoursEditor instructorId={id} /> },
        { id: "calendar", title: "Calendar sync", render: () => <IcsCalendarSync instructorId={id} /> },
        { id: "reminders", title: "Lesson reminders", render: () => <ReminderSettings instructorId={id} /> },
      ],
    },
    {
      id: "pupil-portal",
      title: "Pupil portal & branding",
      description: "How your pupil-facing portal looks and works",
      icon: Car,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      sections: [
        { id: "branding", title: "Pupil app branding", render: () => <PupilAppBrandingEditor instructorId={id} /> },
        {
          id: "mini-website",
          title: "Mini website",
          render: () => {
            const slug = (instructor as { app_slug?: string })?.app_slug;
            return (
              <div className="space-y-6">
                <MiniWebsiteShare instructorId={id} />
                <div className="border-t pt-6">
                  {slug
                    ? <MiniWebsiteCMS instructorId={id} instructorSlug={slug} />
                    : <p className="text-sm text-muted-foreground">Your website URL is being set up.</p>}
                </div>
                <div className="border-t pt-6">
                  <MiniWebsiteThemeEditor
                    instructorId={id}
                    currentSettings={{
                      website_theme: (instructor as { website_theme?: string })?.website_theme,
                      website_font: (instructor as { website_font?: string })?.website_font,
                      website_header_style: (instructor as { website_header_style?: string })?.website_header_style,
                      brand_colour: (instructor as { brand_colour?: string })?.brand_colour,
                    }}
                    onUpdate={refreshInstructor}
                  />
                </div>
              </div>
            );
          },
        },
      ],
    },
    {
      id: "comms",
      title: "Notifications & communications",
      description: "Push, SMS, WhatsApp and AI call answering",
      icon: MessageCircle,
      iconBg: "#E0F2FE",
      iconColor: "#0284C7",
      sections: [
        { id: "notification-prefs", title: "Notification preferences", render: () => <NotificationPreferencesPanel instructorId={id} /> },
        { id: "push", title: "Push notifications", render: () => <PushNotificationSettings instructorId={id} /> },
        {
          id: "ai-call",
          title: "AI call answering",
          render: () => (
            <div className="space-y-6">
              <CallAnsweringSettings instructorId={id} />
              <div className="border-t pt-6">
                <FamulorHub scope="instructor" instructorId={id} />
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "integrations",
      title: "Integrations & data",
      description: "Accounting, features, appearance and data",
      icon: Plug,
      iconBg: "#F4F4F5",
      iconColor: "#52525B",
      sections: [
        { id: "layout", title: "Dashboard layout", render: () => <DashboardLayoutManager instructorId={id} /> },
        { id: "appearance", title: "Appearance", render: () => <AppearanceSettings instructorId={id} /> },
        { id: "feature-toggles", title: "Feature toggles", render: () => <FeatureTogglesSettings instructorId={id} /> },
        { id: "export", title: "Data export", render: () => <DataExportManager instructorId={id} /> },
        { id: "gdpr", title: "GDPR & data retention", render: () => <GDPRRetentionWidget instructorId={id} /> },
        { id: "plan", title: "Plan & billing", render: () => <ExternalSection to="/instructor/billing" label="Open Plan & Billing" /> },
        { id: "reset", title: "Reset statistics", render: () => <ResetStatsDialog instructorId={id} /> },
        { id: "delete", title: "Delete account", render: () => <AccountDangerZone instructorId={id} /> },
      ],
    },
  ];
}

function ExternalSection({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="outline">
      <Link to={to}>{label}</Link>
    </Button>
  );
}
