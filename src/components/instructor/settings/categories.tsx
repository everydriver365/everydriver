import {
  User, Briefcase, CreditCard, Calendar, Car, MessageCircle, Plug, Settings as SettingsIcon,
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
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { ReminderSettings } from "@/components/instructor/ReminderSettings";
import { PupilBookingSettingsEditor } from "@/components/instructor/PupilBookingSettingsEditor";
import { CallAnsweringSettings } from "@/components/instructor/CallAnsweringSettings";
import NotificationPreferencesPanel from "@/components/instructor/notifications/NotificationPreferencesPanel";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { FamulorHub } from "@/components/famulor/FamulorHub";
import { DataExportManager } from "@/components/instructor/DataExportManager";
import { DashboardLayoutManager } from "@/components/instructor/DashboardLayoutManager";
import { AppearanceSettings } from "@/components/instructor/AppearanceSettings";
import { ResetStatsDialog } from "@/components/instructor/ResetStatsDialog";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";

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
      description: "Profile, vehicle, photos and compliance",
      icon: User,
      iconBg: "#DBEAFE",
      iconColor: "#1E40AF",
      sections: [
        {
          id: "profile",
          title: "Profile & contact details",
          description: "Photo, name, email, phone and bio",
          render: () => (
            <div className="space-y-6">
              <ProfileBasicsEditor instructorId={id} />
              <div className="border-t pt-6">
                <InstructorDetailsEditor instructorId={id} />
              </div>
            </div>
          ),
        },
        {
          id: "media",
          title: "Profile media",
          description: "Banner image, car photo and welcome video",
          render: () => <ProfileMediaEditor instructorId={id} />,
        },
        {
          id: "qualifications",
          title: "Qualifications & credentials",
          description: "ADI badge, DBS, licence and insurance documents",
          render: () => <QualificationsEditor instructorId={id} />,
        },
        {
          id: "standards-check",
          title: "DVSA Standards Check",
          description: "Date, result, trigger points and driving test link",
          render: () => <CompactStandardsCheck instructorId={id} />,
        },
        {
          id: "compliance",
          title: "Vehicle docs & CPD",
          description: "MOT, road tax and CPD logging",
          render: () => <ComplianceTracker instructorId={id} />,
        },
        {
          id: "security",
          title: "Login & security",
          description: "Change email, password and sign out everywhere",
          render: () => <AccountSecurityPanel />,
        },
        {
          id: "danger",
          title: "Plan, data & danger zone",
          description: "Plan & billing, data export, delete account",
          render: () => <AccountDangerZone instructorId={id} />,
        },
      ],
    },
    {
      id: "business",
      title: "Business",
      description: "Terms, policies and pupil-facing branding",
      icon: Briefcase,
      iconBg: "#F4F4F5",
      iconColor: "#52525B",
      sections: [
        {
          id: "terms",
          title: "Terms & Conditions",
          description: "Create the agreement pupils sign before lessons",
          render: () => <TermsConditionsEditor instructorId={id} />,
        },
        {
          id: "cancellation",
          title: "Cancellation policy",
          description: "Notice periods and charges",
          render: () => <CancellationPolicyEditor instructorId={id} />,
        },
        {
          id: "no-show",
          title: "No-show policy",
          description: "Fees for missed and late-cancelled lessons",
          render: () => <NoShowPolicySettings instructorId={id} />,
        },
        {
          id: "branding",
          title: "Pupil app branding",
          description: "Colours, logo and look in the pupil portal",
          render: () => <PupilAppBrandingEditor instructorId={id} />,
        },
        {
          id: "gdpr",
          title: "GDPR data retention",
          description: "Auto-flag stale pupil records",
          render: () => <GDPRRetentionWidget instructorId={id} />,
        },
      ],
    },
    {
      id: "bookings",
      title: "Bookings & Payments",
      description: "Courses, pricing and how pupils pay",
      icon: CreditCard,
      iconBg: "#ECFDF5",
      iconColor: "#059669",
      sections: [
        {
          id: "courses",
          title: "Courses you offer",
          description: "Toggle, price and order your lesson types",
          render: () => <InstructorCoursesManager instructorId={id} />,
        },
        {
          id: "booking-mode",
          title: "Booking mode",
          description: "How pupils pick a lesson time",
          render: () => (
            <BookingModeSelector
              instructorId={id}
              currentMode={(instructor as { booking_mode?: "pupil_choice" | "instructor_offer" })?.booking_mode || "pupil_choice"}
            />
          ),
        },
        {
          id: "deposits",
          title: "Deposit payments",
          description: "Take a deposit at booking",
          render: () => <DepositSettingsEditor instructorId={id} />,
        },
        {
          id: "commission",
          title: "Card service fee & QR codes",
          description: "Who pays the platform fee",
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
          title: "Square account",
          description: "Connect Square for automatic card payouts",
          render: () => (
            <SquareConnectSettings
              instructorId={id}
              squareMerchantId={(instructor as { square_merchant_id?: string })?.square_merchant_id}
              squareConnectedAt={(instructor as { square_connected_at?: string })?.square_connected_at}
              onUpdate={refreshInstructor}
            />
          ),
        },
        {
          id: "bnpl",
          title: "Buy now, pay later",
          description: "Klarna and Clearpay on your mini-website",
          render: () => <PaymentOptionsSettings instructorId={id} compact />,
        },
        {
          id: "discounts",
          title: "Discount codes",
          description: "Promo codes pupils can redeem",
          render: () => <InstructorDiscountCodesManager instructorId={id} />,
        },
        {
          id: "packages",
          title: "Lesson packages",
          description: "Pre-paid block bookings",
          render: () => <LessonPackageManager instructorId={id} />,
        },
        {
          id: "intake",
          title: "Intake questions",
          description: "Custom questions on the booking form",
          render: () => <IntakeQuestionsSettings instructorId={id} />,
        },
        {
          id: "pricing-rules",
          title: "Price adjustment rules",
          description: "Dynamic pricing by time, day or zone",
          render: () => <PricingRulesSettings instructorId={id} />,
        },
        {
          id: "referrals",
          title: "Referral programme",
          description: "Reward pupils for introducing friends",
          render: () => <ReferralSettingsCard instructorId={id} />,
        },
      ],
    },
    {
      id: "schedule",
      title: "Schedule",
      description: "Working hours, calendar and reminders",
      icon: Calendar,
      iconBg: "#DBEAFE",
      iconColor: "#1E40AF",
      sections: [
        {
          id: "hours",
          title: "Working hours",
          description: "Set the days and times you teach",
          render: () => <WorkingHoursEditor instructorId={id} />,
        },
        {
          id: "self-service",
          title: "Pupil self-service booking",
          description: "Let pupils book, cancel and reschedule themselves",
          render: () => <PupilBookingSettingsEditor instructorId={id} />,
        },
        {
          id: "calendar",
          title: "Google Calendar sync",
          description: "Two-way sync between lessons and your calendar",
          render: () => <GoogleServiceAccountSetup instructorId={id} />,
        },
        {
          id: "reminders",
          title: "Lesson reminders",
          description: "Automatic SMS, email and WhatsApp reminders",
          render: () => <ReminderSettings instructorId={id} />,
        },
      ],
    },
    {
      id: "vehicle",
      title: "Vehicle & Tracking",
      description: "GPS, routes, dashcam and mileage",
      icon: Car,
      iconBg: "#EDF2FE",
      iconColor: "#1A52A0",
      sections: [
        {
          id: "gps",
          title: "GPS tracking",
          description: "Configure live location and route recording",
          render: () => (
            <ExternalSection to="/instructor/settings/gps" label="Open GPS setup" />
          ),
        },
        {
          id: "routes",
          title: "Saved routes",
          description: "Browse the routes you've recorded",
          render: () => (
            <ExternalSection to="/instructor/routes" label="Open saved routes" />
          ),
        },
        {
          id: "fuel",
          title: "Fuel & MPG",
          description: "Track fuel costs and efficiency",
          render: () => (
            <ExternalSection to="/instructor/fuel" label="Open fuel tracking" />
          ),
        },
        {
          id: "mileage",
          title: "Mileage log",
          description: "HMRC-ready mileage for tax",
          render: () => (
            <ExternalSection to="/instructor/mileage" label="Open mileage log" />
          ),
        },
      ],
    },
    {
      id: "comms",
      title: "Communication",
      description: "Notifications, calls and messaging",
      icon: MessageCircle,
      iconBg: "#FEF3C7",
      iconColor: "#92400E",
      sections: [
        {
          id: "notification-prefs",
          title: "Notification preferences",
          description: "What you get notified about",
          render: () => <NotificationPreferencesPanel instructorId={id} />,
        },
        {
          id: "push",
          title: "Push notifications",
          description: "Enable push on this device",
          render: () => <PushNotificationSettings instructorId={id} />,
        },
        {
          id: "call-answering",
          title: "Call answering",
          description: "Choose how incoming pupil calls are answered",
          render: () => <CallAnsweringSettings instructorId={id} />,
        },
        {
          id: "famulor",
          title: "AI phone assistant",
          description: "Famulor calls, campaigns, agents and analytics",
          render: () => <FamulorHub scope="instructor" instructorId={id} />,
        },
        {
          id: "whatsapp",
          title: "WhatsApp Business",
          description: "Connect your WhatsApp account and templates",
          render: () => (
            <ExternalSection to="/instructor/settings/whatsapp" label="Open WhatsApp settings" />
          ),
        },
      ],
    },
    {
      id: "website",
      title: "Website & Mini-site",
      description: "Your share link, pages and theme",
      icon: Plug,
      iconBg: "#FFE4E6",
      iconColor: "#BE123C",
      sections: [
        {
          id: "share",
          title: "Share link",
          description: "Send pupils to your booking page",
          render: () => <MiniWebsiteShare instructorId={id} />,
        },
        {
          id: "pages",
          title: "Website pages",
          description: "Edit your 5-page mini-website",
          render: () => {
            const slug = (instructor as { app_slug?: string })?.app_slug;
            return slug
              ? <MiniWebsiteCMS instructorId={id} instructorSlug={slug} />
              : <p className="text-sm text-muted-foreground">Your website URL is being set up.</p>;
          },
        },
        {
          id: "theme",
          title: "Website theme",
          description: "Colours, fonts and style presets",
          render: () => (
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
          ),
        },
        {
          id: "test-centres",
          title: "Test centres & examiners",
          description: "Used on your mini-website and pupil app",
          render: () => <TestCentresAndExaminersManager instructorId={id} />,
        },
      ],
    },
    {
      id: "advanced",
      title: "Advanced & Account",
      description: "Layout, data, plan and danger zone",
      icon: SettingsIcon,
      iconBg: "#F4F4F5",
      iconColor: "#52525B",
      sections: [
        {
          id: "feature-toggles",
          title: "Optional features",
          description: "Turn portal modules on or off",
          render: () => <FeatureTogglesSettings instructorId={id} />,
        },
        {
          id: "layout",
          title: "Dashboard layout",
          description: "Customise your home tiles",
          render: () => <DashboardLayoutManager instructorId={id} />,
        },
        {
          id: "appearance",
          title: "Appearance",
          description: "Wallpaper and visual options",
          render: () => <AppearanceSettings instructorId={id} />,
        },
        {
          id: "export",
          title: "Data export & backup",
          description: "Download your data as CSV",
          render: () => <DataExportManager instructorId={id} />,
        },
        {
          id: "plan",
          title: "Plan & billing",
          description: "Subscription, invoices and add-ons",
          render: () => (
            <ExternalSection to="/instructor/billing" label="Open Plan & Billing" />
          ),
        },
        {
          id: "reset",
          title: "Reset statistics",
          description: "Clear lesson history, payments or progress",
          render: () => <ResetStatsDialog instructorId={id} />,
        },
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
