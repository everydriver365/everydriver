import { useState, useEffect, useMemo } from "react";
import { SettingsSearchBar, SearchableSettingsItem } from "@/components/instructor/SettingsSearchBar";
import { User, Clock, Bell, Settings, Eye, Globe, ChevronRight, GraduationCap, BookOpen, Navigation, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";

interface SettingsCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  count?: number;
}

const settingsCategories: SettingsCategory[] = [
  { id: "profile", title: "Profile & Identity", subtitle: "Name, photo, vehicle & media", icon: User, iconColor: "text-blue-600", iconBg: "bg-blue-500" },
  { id: "teaching", title: "Compliance & Teaching", subtitle: "CPD, test centres, terms", icon: GraduationCap, iconColor: "text-emerald-600", iconBg: "bg-emerald-500" },
  { id: "courses", title: "Courses & Payments", subtitle: "Pricing, deposits, packages", icon: BookOpen, iconColor: "text-green-600", iconBg: "bg-green-500" },
  { id: "website", title: "Website & Branding", subtitle: "Mini-site, theme, pupil app", icon: Globe, iconColor: "text-cyan-600", iconBg: "bg-cyan-500" },
  { id: "scheduling", title: "Scheduling", subtitle: "Hours, calendar, reminders", icon: Clock, iconColor: "text-sky-600", iconBg: "bg-sky-500" },
  { id: "tracking", title: "Tracking & Routes", subtitle: "GPS, saved routes", icon: Navigation, iconColor: "text-amber-600", iconBg: "bg-amber-500" },
  { id: "preferences", title: "Preferences & Data", subtitle: "Appearance, export, GDPR", icon: Settings, iconColor: "text-gray-600", iconBg: "bg-gray-500" },
];

const searchableItems: SearchableSettingsItem[] = [
  { id: "profile", title: "Profile", description: "Your public instructor profile", category: "Profile & Identity" },
  { id: "details", title: "Vehicle & Qualifications", description: "Car details, skills & social links", category: "Profile & Identity" },
  { id: "images", title: "Images & Media", description: "Car photo, QR code & video", category: "Profile & Identity" },
  { id: "compliance", title: "Compliance & CPD", description: "Track ADI badge, insurance, MOT & CPD hours", category: "Compliance & Teaching" },
  { id: "test-centres", title: "Test Centres & Examiners", description: "Manage test centres and examiners", category: "Compliance & Teaching" },
  { id: "terms", title: "Terms & Conditions", description: "Create terms for pupils to sign", category: "Compliance & Teaching" },
  { id: "courses", title: "My Courses", description: "Manage your course offerings & pricing", category: "Courses & Payments" },
  { id: "booking-mode", title: "Booking Mode", description: "How pupils book lessons", category: "Courses & Payments" },
  { id: "deposits", title: "Deposit Payments", description: "Accept deposits on bookings", category: "Courses & Payments" },
  { id: "commission", title: "Card Commission & QR Codes", description: "Who pays the fee + upload QR codes", category: "Courses & Payments" },
  { id: "square-connect", title: "Square Account", description: "Connect for automatic payouts", category: "Courses & Payments" },
  { id: "referrals", title: "Referral Programme", description: "Configure pupil referral rewards", category: "Courses & Payments" },
  { id: "bnpl", title: "Buy Now, Pay Later", description: "Klarna & Clearpay on your mini-website", category: "Courses & Payments" },
  { id: "discount-codes", title: "Discount Codes", description: "Create promo codes for pupils", category: "Courses & Payments" },
  { id: "lesson-packages", title: "Lesson Packages", description: "Pre-paid block booking packages", category: "Courses & Payments" },
  { id: "intake-questions", title: "Intake Questions", description: "Custom questions on booking forms", category: "Courses & Payments" },
  { id: "pricing-rules", title: "Price Adjustment Rules", description: "Dynamic pricing by time, day & zone", category: "Courses & Payments" },
  { id: "mini-website", title: "Share Link", description: "Share your instructor profile", category: "Website & Branding" },
  { id: "website-pages", title: "Website Pages", description: "Edit your 5-page mini-website", category: "Website & Branding" },
  { id: "website-theme", title: "Website Theme", description: "Colors, fonts & style presets", category: "Website & Branding" },
  { id: "branding", title: "Pupil App Branding", description: "Customise your pupil portal", category: "Website & Branding" },
  { id: "pupil-self-service", title: "Pupil Self-Service Booking", description: "Let pupils book, cancel & reschedule", category: "Scheduling" },
  { id: "working-hours", title: "Working Hours", description: "Set your availability", category: "Scheduling" },
  { id: "calendar", title: "Calendar Sync", description: "Sync lessons to your calendar", category: "Scheduling" },
  { id: "cancellation", title: "Cancellation Policy", description: "Set notice period & charges", category: "Scheduling" },
  { id: "no-show-policy", title: "No-Show Policy", description: "Set fees for no-shows & late cancellations", category: "Scheduling" },
  { id: "reminders", title: "Lesson Reminders", description: "Automatic pupil reminders before lessons", category: "Scheduling" },
  { id: "gps-mobile", title: "Mobile GPS Tracking", description: "Link your GPS Gate account", category: "Tracking & Routes" },
  { id: "routes", title: "Saved Routes", description: "View and manage your recorded driving routes", category: "Tracking & Routes" },
  { id: "demo-mode", title: "Demo Mode", description: "Preview the app with sample data", category: "Preferences & Data" },
  { id: "appearance", title: "Appearance", description: "Layout, hero image & wallpaper", category: "Preferences & Data" },
  { id: "dashboard-layout", title: "Dashboard Layout", description: "Customize your home screen tiles", category: "Preferences & Data" },
  { id: "notifications", title: "Push Notifications", description: "Manage notification preferences", category: "Preferences & Data" },
  { id: "gdpr", title: "GDPR Data Retention", description: "Auto-flag stale pupil records", category: "Preferences & Data" },
  { id: "data-backup", title: "Data Export & Backup", description: "Download your data for backup", category: "Preferences & Data" },
  { id: "reset-stats", title: "Reset Statistics", description: "Clear lesson history, payments, or progress", category: "Preferences & Data" },
];

const catTitleToId: Record<string, string> = {
  "Profile & Identity": "profile",
  "Compliance & Teaching": "teaching",
  "Courses & Payments": "courses",
  "Website & Branding": "website",
  "Scheduling": "scheduling",
  "Tracking & Routes": "tracking",
  "Preferences & Data": "preferences",
};

export default function InstructorSettings() {
  const navigate = useNavigate();
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;

  const [isActive, setIsActive] = useState<boolean>(true);
  const [heyEdEnabled, setHeyEdEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`hey-ed-always-listen-${instructorId}`) === "true";
  });

  useEffect(() => {
    if (authInstructor) {
      setIsActive(authInstructor.is_active ?? true);
    }
  }, [authInstructor]);

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!instructorId) return;
    setIsActive(isVisible);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", instructorId);
      if (error) throw error;
      await refreshInstructor();
      toast({
        title: isVisible ? "Now visible" : "Hidden from website",
        description: isVisible
          ? "Your profile is now listed on the main website"
          : "You won't appear in course searches but can still use all features",
      });
    } catch (error) {
      setIsActive(!isVisible);
      console.error("Error updating visibility:", error);
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const basePath = window.location.pathname.includes("/every-instructor") ? "/every-instructor/settings" : "/instructor/settings";

  const handleSearchSelect = (itemId: string, categoryTitle: string) => {
    const categoryId = catTitleToId[categoryTitle] || "profile";
    navigate(`${basePath}/${categoryId}?open=${itemId}`);
  };

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* iOS Large Title */}
        <div className="px-1 pt-1 pb-2">
          <h1 className="text-[34px] font-bold text-foreground leading-tight tracking-tight">Settings</h1>
        </div>

        {/* Search */}
        <SettingsSearchBar items={searchableItems} onSelect={handleSearchSelect} />

        {/* Quick Toggles */}
        <div>
          <div className="px-4 pb-1.5">
            <span className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide">Quick Toggles</span>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-sm overflow-hidden divide-y divide-border/40">
            {/* Visibility */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-[29px] w-[29px] rounded-[7px] bg-violet-500 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-foreground">Listed on Website</p>
                  <p className="text-[13px] text-muted-foreground">Appear in course searches</p>
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={handleVisibilityToggle} />
            </div>
            {/* Hey ED */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-[29px] w-[29px] rounded-[7px] bg-indigo-500 flex items-center justify-center shrink-0">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-normal text-foreground">"Hey ED" Always Listening</p>
                  <p className="text-[13px] text-muted-foreground">Activate ED hands-free</p>
                </div>
              </div>
              <Switch
                checked={heyEdEnabled}
                onCheckedChange={(checked) => {
                  setHeyEdEnabled(checked);
                  localStorage.setItem(`hey-ed-always-listen-${instructorId}`, String(checked));
                  toast({
                    title: checked ? '"Hey ED" enabled' : '"Hey ED" disabled',
                    description: checked ? "ED will listen for your voice in the background" : "Tap the Ask ED button to activate",
                  });
                }}
              />
            </div>
            {/* Feature Toggles */}
            <div className="px-3">
              <FeatureTogglesSettings instructorId={instructorId} />
            </div>
          </div>
          {!isActive && (
            <div className="mt-2 mx-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">You're currently hidden from the website.</p>
            </div>
          )}
        </div>

        {/* Category Navigation */}
        <div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-sm overflow-hidden divide-y divide-border/40">
            {settingsCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`${basePath}/${cat.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/50 transition-colors"
                >
                  <div className={cn("h-[29px] w-[29px] rounded-[7px] flex items-center justify-center shrink-0", cat.iconBg)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-foreground">{cat.title}</p>
                    <p className="text-[13px] text-muted-foreground">{cat.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
