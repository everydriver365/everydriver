import { useState, useMemo, useEffect, useRef } from "react";
import { Loader2, ChevronRight, Lock, LogOut, Eye, Mic, ExternalLink, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { SectionLabel } from "@/components/instructor/ui/SectionLabel";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Settings, Camera, User, Calendar, Users, Award, Receipt, CreditCard,
  MapPin, Car, MessageCircle, HelpCircle, Briefcase, Route, Globe,
  TrendingUp, ArrowUpDown, Calculator, Heart, QrCode, CalendarPlus,
  Navigation, CheckSquare, StickyNote, FolderOpen, Star, Gauge, Megaphone,
  Clock, Bell, FileText, Palette, Layout, Sparkles, PoundSterling,
  BookOpen, Trash2, Database, FileSignature, Banknote, Shield, CalendarClock,
  ImageIcon, Video, ImagePlus, Paintbrush, Tag, ClipboardList, AlertTriangle,
  Gift, LayoutGrid, Satellite,
} from "lucide-react";

// Custom PNG icons (only Square logo still used for branded tile)
import squareLogo from "@/assets/square-logo.png";

import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useMenuFeatureGates } from "@/hooks/useMenuFeatureGates";
import { QuickTestResultForm } from "@/components/instructor/QuickTestResultForm";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { WarmTile, WarmTileGrid, type WarmTileCategory } from "@/components/instructor/WarmTile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { toast as uiToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Settings tile content components
import { CMSImageUpload } from "@/components/admin/CMSImageUpload";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { NoShowPolicySettings } from "@/components/instructor/NoShowPolicySettings";
import { ReferralSettingsCard } from "@/components/instructor/ReferralSettingsCard";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { PupilBookingSettingsEditor } from "@/components/instructor/PupilBookingSettingsEditor";
import { GoogleServiceAccountSetup } from "@/components/instructor/GoogleServiceAccountSetup";
import { DataExportManager } from "@/components/instructor/DataExportManager";
import { MiniWebsiteShare } from "@/components/instructor/MiniWebsiteShare";
import { MiniWebsiteCMS } from "@/components/instructor/MiniWebsiteCMS";
import { MiniWebsiteThemeEditor } from "@/components/instructor/MiniWebsiteThemeEditor";
import { TermsConditionsEditor } from "@/components/instructor/TermsConditionsEditor";
import { DepositSettingsEditor } from "@/components/instructor/DepositSettingsEditor";
import { BookingModeSelector } from "@/components/instructor/BookingModeSelector";
import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";
import { InstructorCoursesManager } from "@/components/instructor/InstructorCoursesManager";
import { InstructorDiscountCodesManager } from "@/components/instructor/InstructorDiscountCodesManager";
import { TestCentresAndExaminersManager } from "@/components/instructor/TestCentresAndExaminersManager";
import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";
import { ResetStatsDialog } from "@/components/instructor/ResetStatsDialog";
import { DashboardLayoutManager } from "@/components/instructor/DashboardLayoutManager";
import { AppearanceSettings } from "@/components/instructor/AppearanceSettings";
import { CommissionPayerSettings } from "@/components/instructor/CommissionPayerSettings";
import { SquareConnectSettings } from "@/components/instructor/SquareConnectSettings";
import { PaymentOptionsSettings } from "@/components/instructor/PaymentOptionsSettings";
import { LessonPackageManager } from "@/components/instructor/LessonPackageManager";
import { IntakeQuestionsSettings } from "@/components/instructor/IntakeQuestionsSettings";
import { PricingRulesSettings } from "@/components/instructor/PricingRulesSettings";
import { GDPRRetentionWidget } from "@/components/instructor/GDPRRetentionWidget";
import { ReminderSettings } from "@/components/instructor/ReminderSettings";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";
import { useDemoMode } from "@/context/DemoModeContext";

// ─── Types ───────────────────────────────────────────────────────────

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  path?: string;
  action?: () => void;
  gateKey?: string;
  iconSrc?: string;
  tintBg: string;
  tintColor: string;
}

interface InstructorProfile {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  car_image_url: string | null;
  payment_qr_url: string | null;
  payment_qr_url_pupil_pays: string | null;
  payment_qr_url_instructor_pays: string | null;
  commission_payer: string | null;
  commission_split_percent: number | null;
  welcome_video_url: string | null;
  hero_image_url: string | null;
  adi_certificate_url: string | null;
  is_active: boolean;
}

interface TileDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tintBg: string;
  tintColor: string;
  iconSrc?: string;
  category: string;
  externalUrl?: string;
}

// ─── Settings tile & category definitions ────────────────────────────

const settingsCategories = [
  { id: "profile", title: "Profile & Identity" },
  { id: "teaching", title: "Compliance & Teaching" },
  { id: "courses", title: "Courses & Payments" },
  { id: "website", title: "Website & Branding" },
  { id: "scheduling", title: "Scheduling" },
  { id: "tracking", title: "Tracking & Routes" },
  { id: "preferences", title: "Preferences & Data" },
];

const allTiles: TileDef[] = [
  { id: "profile", title: "Profile", description: "Your public instructor profile", icon: User, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "profile" },
  { id: "details", title: "Vehicle & Qualifications", description: "Car details, skills & social links", icon: Car, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "profile" },
  { id: "images", title: "Images & Media", description: "Car photo, QR code & video", icon: ImageIcon, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "profile" },
  { id: "compliance", title: "Compliance & CPD", description: "Track ADI badge, insurance, MOT & CPD hours", icon: Shield, tintBg: "#ECFDF5", tintColor: "#059669", category: "teaching" },
  { id: "test-centres", title: "Test Centres & Examiners", description: "Manage test centres and examiners", icon: MapPin, tintBg: "#FEF2F2", tintColor: "#DC2626", category: "teaching" },
  { id: "terms", title: "Terms & Conditions", description: "Create terms for pupils to sign", icon: FileSignature, tintBg: "#F4F4F5", tintColor: "#52525B", category: "teaching" },
  { id: "courses-mgr", title: "My Courses", description: "Manage your course offerings & pricing", icon: BookOpen, tintBg: "#ECFDF5", tintColor: "#059669", category: "courses" },
  { id: "booking-mode", title: "Booking Mode", description: "How pupils book lessons", icon: CalendarClock, tintBg: "#ECFDF5", tintColor: "#059669", category: "courses" },
  { id: "deposits", title: "Deposit Payments", description: "Accept deposits on bookings", icon: Banknote, tintBg: "#ECFDF5", tintColor: "#059669", category: "courses" },
  { id: "commission", title: "Card Commission & QR Codes", description: "Who pays the fee + upload QR codes", icon: CreditCard, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "courses" },
  { id: "square-connect", title: "Square Account", description: "Connect for automatic payouts", icon: CreditCard, tintBg: "#DBEAFE", tintColor: "#1E40AF", iconSrc: squareLogo, category: "courses" },
  { id: "referrals", title: "Referral Programme", description: "Configure pupil referral rewards", icon: Gift, tintBg: "#ECFDF5", tintColor: "#059669", category: "courses" },
  { id: "bnpl", title: "Buy Now, Pay Later", description: "Klarna & Clearpay on your mini-website", icon: CreditCard, tintBg: "#FFE4E6", tintColor: "#BE123C", category: "courses" },
  { id: "discount-codes", title: "Discount Codes", description: "Create promo codes for pupils", icon: Tag, tintBg: "#FEF3C7", tintColor: "#92400E", category: "courses" },
  { id: "lesson-packages", title: "Lesson Packages", description: "Pre-paid block booking packages", icon: BookOpen, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "courses" },
  { id: "intake-questions", title: "Intake Questions", description: "Custom questions on booking forms", icon: ClipboardList, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "courses" },
  { id: "pricing-rules", title: "Price Adjustment Rules", description: "Dynamic pricing by time, day & zone", icon: PoundSterling, tintBg: "#FEF3C7", tintColor: "#92400E", category: "courses" },
  { id: "mini-website", title: "Share Link", description: "Share your instructor profile", icon: Globe, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "website" },
  { id: "website-pages", title: "Website Pages", description: "Edit your 5-page mini-website", icon: Layout, tintBg: "#E8ECF1", tintColor: "#2A394F", category: "website" },
  { id: "website-theme", title: "Website Theme", description: "Colors, fonts & style presets", icon: Sparkles, tintBg: "#FFE4E6", tintColor: "#BE123C", category: "website" },
  { id: "branding", title: "Pupil App Branding", description: "Customise your pupil portal", icon: Palette, tintBg: "#FFE4E6", tintColor: "#BE123C", category: "website" },
  { id: "pupil-self-service", title: "Pupil Self-Service Booking", description: "Let pupils book, cancel & reschedule", icon: CalendarClock, tintBg: "#ECFDF5", tintColor: "#059669", category: "scheduling" },
  { id: "working-hours", title: "Working Hours", description: "Set your availability", icon: Clock, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "scheduling" },
  { id: "calendar", title: "Calendar Sync", description: "Sync lessons to your calendar", icon: Calendar, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "scheduling" },
  { id: "cancellation", title: "Cancellation Policy", description: "Set notice period & charges", icon: FileText, tintBg: "#F4F4F5", tintColor: "#52525B", category: "scheduling" },
  { id: "no-show-policy", title: "No-Show Policy", description: "Set fees for no-shows & late cancellations", icon: AlertTriangle, tintBg: "#FEF3C7", tintColor: "#92400E", category: "scheduling" },
  { id: "reminders", title: "Lesson Reminders", description: "Automatic pupil reminders before lessons", icon: Bell, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "scheduling" },
  { id: "gps-mobile", title: "Mobile GPS Tracking", description: "Link your GPS Gate account", icon: Satellite, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "tracking" },
  { id: "routes", title: "Saved Routes", description: "View and manage your recorded driving routes", icon: Route, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "tracking" },
  { id: "dashcam-portal", title: "Dashcam Portal", description: "View footage on Kinesis Fleet Pro", icon: Camera, tintBg: "#F4F4F5", tintColor: "#52525B", category: "tracking", externalUrl: "https://www.kinesisfleetpro.com/#/login;next=%2Fstatus" },
  { id: "demo-mode", title: "Demo Mode", description: "Preview the app with sample data", icon: Eye, tintBg: "#FEF3C7", tintColor: "#92400E", category: "preferences" },
  { id: "daily-briefing", title: "Daily Briefing", description: "Show the morning AI briefing on home", icon: Sparkles, tintBg: "#FEF3C7", tintColor: "#92400E", category: "preferences" },
  { id: "appearance", title: "Appearance", description: "Layout, hero image & wallpaper", icon: Paintbrush, tintBg: "#FFE4E6", tintColor: "#BE123C", category: "preferences" },
  { id: "dashboard-layout", title: "Dashboard Layout", description: "Customize your home screen tiles", icon: LayoutGrid, tintBg: "#E8ECF1", tintColor: "#2A394F", category: "preferences" },
  { id: "notifications", title: "Push Notifications", description: "Manage notification preferences", icon: Bell, tintBg: "#FEF3C7", tintColor: "#92400E", category: "preferences" },
  { id: "gdpr", title: "GDPR Data Retention", description: "Auto-flag stale pupil records", icon: Shield, tintBg: "#DBEAFE", tintColor: "#1E40AF", category: "preferences" },
  { id: "data-backup", title: "Data Export & Backup", description: "Download your data for backup", icon: Database, tintBg: "#F4F4F5", tintColor: "#52525B", category: "preferences" },
  { id: "reset-stats", title: "Reset Statistics", description: "Clear lesson history, payments, or progress", icon: Trash2, tintBg: "#FEF2F2", tintColor: "#DC2626", category: "preferences" },
];

// ─── Demo mode toggle ────────────────────────────────────────────────

function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode, loading } = useDemoMode();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Toggle demo mode to preview the app with realistic sample data.</p>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
        <div>
          <p className="text-sm font-medium">{isDemoMode ? "Demo Mode Active" : "Demo Mode Off"}</p>
          <p className="text-xs text-muted-foreground">{isDemoMode ? "Viewing sample data" : "Viewing your real data"}</p>
        </div>
        <Switch checked={isDemoMode} onCheckedChange={() => toggleDemoMode()} disabled={loading} />
      </div>
    </div>
  );
}

// ─── Daily Briefing toggle ───────────────────────────────────────────

const DAILY_BRIEFING_KEY = "daily-briefing-enabled";

function DailyBriefingToggle() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem(DAILY_BRIEFING_KEY);
    return v === null ? true : v === "true";
  });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem(DAILY_BRIEFING_KEY, String(checked));
    window.dispatchEvent(new CustomEvent("daily-briefing-toggled", { detail: checked }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Your morning AI briefing summarises today's lessons, earnings and priorities at the top of your home screen.
      </p>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
        <div>
          <p className="text-sm font-medium">{enabled ? "Briefing visible" : "Briefing hidden"}</p>
          <p className="text-xs text-muted-foreground">
            {enabled ? "Shown once per day on your home screen" : "Won't appear on your home screen"}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export default function InstructorMenu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instructor, subscription, signOut, refreshInstructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const { isFeatureLocked, getUpgradeMessage, getMinimumPlanName } = useMenuFeatureGates();
  const [showTestResultForm, setShowTestResultForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Settings state
  const [isActive, setIsActive] = useState(true);
  const [heyEdEnabled, setHeyEdEnabled] = useState(() =>
    localStorage.getItem(`hey-ed-always-listen-${instructor?.id}`) === "true"
  );
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const p = searchParams.get("open");
    return p ? [p] : [];
  });

  useEffect(() => {
    if (instructor) setIsActive(instructor.is_active ?? true);
  }, [instructor]);

  useEffect(() => {
    if (instructorId) fetchProfile();
  }, [instructorId]);

  // Auto-scroll to ?open= tile
  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam) {
      setTimeout(() => {
        const el = document.getElementById(`settings-tile-${openParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary/50");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 2000);
        }
      }, 300);
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    if (!instructorId) return;
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, email, phone, bio, profile_image_url, car_image_url, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, commission_split_percent, welcome_video_url, hero_image_url, adi_certificate_url, is_active")
        .eq("id", instructorId)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile || !instructorId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("instructors").update({ name: profile.name, email: profile.email, phone: profile.phone, bio: profile.bio }).eq("id", instructorId);
      if (error) throw error;
      uiToast({ title: "Profile updated", description: "Your changes have been saved" });
    } catch {
      uiToast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!instructorId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instructorId}/profile.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("instructor-images").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("instructor-images").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("instructors").update({ profile_image_url: publicUrl }).eq("id", instructorId);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, profile_image_url: publicUrl } : null);
      uiToast({ title: "Photo updated" });
    } catch {
      uiToast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!instructorId) return;
    setIsActive(isVisible);
    try {
      const { error } = await supabase.from("instructors").update({ is_active: isVisible }).eq("id", instructorId);
      if (error) throw error;
      await refreshInstructor();
      uiToast({ title: isVisible ? "Now visible" : "Hidden from website" });
    } catch {
      setIsActive(!isVisible);
      uiToast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };
  const isOpen = (id: string) => openSections.includes(id);

  const handleLogout = async () => {
    await signOut();
    navigate("/instructor-app/login");
  };

  // ─── Menu sections (navigation items) ──────────────────────────────

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Quick Actions",
      items: [
        { icon: CheckSquare, label: "To Do", description: "Task list", gateKey: "todos", path: "/instructor/todos", tintBg: "#E8ECF1", tintColor: "#2A394F" },
        { icon: MessageCircle, label: "Messages", description: "Chat with pupils", gateKey: "messages", path: "/instructor/messages", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Briefcase, label: "Job Offers", description: "Pending jobs", gateKey: "jobs", path: "/instructor/jobs", tintBg: "#EDE9FE", tintColor: "#5B21B6" },
        { icon: CalendarPlus, label: "New Bookings", description: "Pending schedule", gateKey: "pending-scheduling", path: "/instructor/pending-scheduling", tintBg: "#FEF3C7", tintColor: "#92400E" },
        { icon: QrCode, label: "Take Payment", description: "QR code payment", gateKey: "pay", path: "/instructor/pay", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Car, label: "Live Tracking", description: "GPS tracking", gateKey: "tracking", path: "/instructor/tracking", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Navigation, label: "Find My Car", description: "Car location", gateKey: "find-my-car", path: "/instructor/find-my-car", tintBg: "#FEF2F2", tintColor: "#DC2626" },
        { icon: Receipt, label: "Expenses", description: "Track costs", gateKey: "expenses", path: "/instructor/expenses", tintBg: "#FEF3C7", tintColor: "#92400E" },
        { icon: Award, label: "Test Swap", description: "Request or swap a test", gateKey: "test-requests", path: "/instructor/test-requests", tintBg: "#FEF3C7", tintColor: "#92400E" },
      ],
    },
    {
      title: "Money & Reports",
      items: [
        { icon: CreditCard, label: "Payments", description: "Full breakdown", gateKey: "payments", path: "/instructor/pay", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: TrendingUp, label: "Income Summary", description: "Earnings overview", gateKey: "income", path: "/instructor/income", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: ArrowUpDown, label: "In vs Out", description: "Income vs expenses", gateKey: "in-out", path: "/instructor/in-out", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Car, label: "Mileage Tracker", description: "HMRC deductions", gateKey: "mileage", path: "/instructor/mileage", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Calculator, label: "Tax Summary", description: "Tax overview", gateKey: "tax", path: "/instructor/tax", tintBg: "#EDE9FE", tintColor: "#5B21B6" },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        { icon: Calendar, label: "Schedule", description: "View calendar", gateKey: "schedule", path: "/instructor/schedule", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Users, label: "Pupils", description: "Manage pupils", gateKey: "pupils", path: "/instructor/pupils", tintBg: "#E8ECF1", tintColor: "#2A394F" },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: Gauge, label: "Telematics", description: "Vehicle intelligence", gateKey: "fleet-dashboard", path: "/instructor/fleet-dashboard", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Camera, label: "Dashcam", description: "Recording & protection", gateKey: "dashcam", path: "/instructor/dashcam", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Star, label: "Reviews", description: "Moderate reviews", gateKey: "reviews", path: "/instructor/reviews", tintBg: "#FEF3C7", tintColor: "#92400E" },
        { icon: Car, label: "Vehicle Health", description: "Fleet compliance", gateKey: "vehicle-health", path: "/instructor/vehicle-health", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Award, label: "Quick Test Result", description: "Record result", gateKey: "test-result-quick", action: () => setShowTestResultForm(true), tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Award, label: "Full Test Report", description: "DL25A recording", gateKey: "test-results", path: "/instructor/test-results", tintBg: "#ECFDF5", tintColor: "#059669" },
        { icon: Route, label: "Saved Routes", description: "Route library", gateKey: "routes", path: "/instructor/routes", tintBg: "#EDE9FE", tintColor: "#5B21B6" },
        { icon: MapPin, label: "Jotter", description: "Draw on map", gateKey: "doodlepad", path: "/instructor/doodlepad", tintBg: "#FEF2F2", tintColor: "#DC2626" },
        { icon: MapPin, label: "Fill Gaps", description: "Schedule gaps", gateKey: "gaps", path: "/instructor/gaps", tintBg: "#FFE4E6", tintColor: "#BE123C" },
        { icon: StickyNote, label: "Notes", description: "Notebook", gateKey: "notes", path: "/instructor/notes", tintBg: "#FEF3C7", tintColor: "#92400E" },
        { icon: Users, label: "Bulk Operations", description: "SMS, reschedule, pricing", gateKey: "bulk-operations", path: "/instructor/bulk-operations", tintBg: "#E8ECF1", tintColor: "#2A394F" },
        { icon: TrendingUp, label: "Reports Hub", description: "PDF reports", gateKey: "reports-hub", path: "/instructor/reports", tintBg: "#EDE9FE", tintColor: "#5B21B6" },
      ],
    },
    {
      title: "Resources",
      items: [
        { icon: FolderOpen, label: "Resources", description: "Documents & files", gateKey: "resources", path: "/instructor/resources", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
        { icon: Megaphone, label: "Platform Updates", description: "News & feature ideas", path: "/instructor/platform-updates", tintBg: "#E8ECF1", tintColor: "#2A394F" },
        { icon: HelpCircle, label: "FAQs & Help", description: "Get support", gateKey: "faqs", path: "/instructor/faqs", tintBg: "#DBEAFE", tintColor: "#1E40AF" },
      ],
    },
    {
      title: "Wellbeing",
      items: [
        { icon: Heart, label: "Health Hub", description: "Wellness tips", gateKey: "health", path: "/instructor/health", tintBg: "#FEF2F2", tintColor: "#DC2626" },
      ],
    },
  ];

  // ─── Search filtering ──────────────────────────────────────────────

  const lowerQuery = searchQuery.toLowerCase().trim();

  const filteredTiles = useMemo(() => {
    if (!lowerQuery) return allTiles;
    return allTiles.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      settingsCategories.find(c => c.id === t.category)?.title.toLowerCase().includes(lowerQuery)
    );
  }, [lowerQuery]);

  // Auto-expand matching tiles when searching
  useEffect(() => {
    if (lowerQuery) {
      setOpenSections(filteredTiles.map(t => t.id));
    } else {
      const p = searchParams.get("open");
      setOpenSections(p ? [p] : []);
    }
  }, [lowerQuery, filteredTiles.length]);

  const filteredSettingsCategories = useMemo(() => {
    return settingsCategories.filter(cat => filteredTiles.some(t => t.category === cat.id));
  }, [filteredTiles]);

  // ─── Settings tile content renderer ────────────────────────────────

  const renderTileContent = (tileId: string) => {
    if (!instructorId) return null;
    switch (tileId) {
      case "profile":
        return profileLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.profile_image_url || undefined} />
                <AvatarFallback className="text-xl">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}Change Photo</span>
                  </Button>
                </Label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-sm">Name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-sm">Email</Label><Input type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-sm">Phone</Label><Input type="tel" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-sm">Bio</Label><Textarea value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Tell pupils about yourself..." /></div>
            <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Profile</Button>
          </div>
        ) : null;
      case "details":
        return <InstructorDetailsEditor instructorId={instructorId} />;
      case "images":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><ImagePlus className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Banner Image</Label></div>
              <CMSImageUpload value={profile?.hero_image_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ hero_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, hero_image_url: url } : null); uiToast({ title: "Banner image updated" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Car className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Car Photo</Label></div>
              <CMSImageUpload value={profile?.car_image_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ car_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, car_image_url: url } : null); uiToast({ title: "Car photo updated" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Welcome Video URL</Label></div>
              <Input placeholder="https://youtube.com/watch?v=..." value={profile?.welcome_video_url || ""} onChange={(e) => setProfile(prev => prev ? { ...prev, welcome_video_url: e.target.value } : null)} />
              <Button size="sm" variant="outline" onClick={async () => { try { const { error } = await supabase.from("instructors").update({ welcome_video_url: profile?.welcome_video_url }).eq("id", instructorId); if (error) throw error; uiToast({ title: "Video URL saved" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }}>Save Video URL</Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">ADI Certificate</Label></div>
              <CMSImageUpload value={profile?.adi_certificate_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ adi_certificate_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, adi_certificate_url: url } : null); uiToast({ title: "Certificate uploaded" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
            </div>
          </div>
        );
      case "compliance":
        return <ComplianceTracker instructorId={instructorId} />;
      case "test-centres":
        return <TestCentresAndExaminersManager instructorId={instructorId} />;
      case "terms":
        return <TermsConditionsEditor instructorId={instructorId} />;
      case "courses-mgr":
        return <InstructorCoursesManager instructorId={instructorId} />;
      case "booking-mode":
        return <BookingModeSelector instructorId={instructorId} currentMode={instructor?.booking_mode || 'pupil_choice'} />;
      case "deposits":
        return <DepositSettingsEditor instructorId={instructorId} />;
      case "commission":
        return (
          <div className="space-y-6">
            <CommissionPayerSettings instructorId={instructorId} initialPayer={profile?.commission_payer} initialSplitPercent={profile?.commission_split_percent} />
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Payment QR Codes</Label></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer !== 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                  <Label className="text-xs font-medium">Pupil Pays Commission QR</Label>
                  <CMSImageUpload value={profile?.payment_qr_url_pupil_pays || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ payment_qr_url_pupil_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_pupil_pays: url } : null); uiToast({ title: "QR updated" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
                <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer === 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                  <Label className="text-xs font-medium">Instructor Pays Commission QR</Label>
                  <CMSImageUpload value={profile?.payment_qr_url_instructor_pays || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ payment_qr_url_instructor_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_instructor_pays: url } : null); uiToast({ title: "QR updated" }); } catch { uiToast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
              </div>
            </div>
          </div>
        );
      case "square-connect":
        return <SquareConnectSettings instructorId={instructorId} squareMerchantId={(instructor as any)?.square_merchant_id} squareConnectedAt={(instructor as any)?.square_connected_at} onUpdate={refreshInstructor} />;
      case "referrals":
        return <ReferralSettingsCard instructorId={instructorId} />;
      case "bnpl":
        return <PaymentOptionsSettings instructorId={instructorId} compact />;
      case "discount-codes":
        return <InstructorDiscountCodesManager instructorId={instructorId} />;
      case "lesson-packages":
        return <LessonPackageManager instructorId={instructorId} />;
      case "intake-questions":
        return <IntakeQuestionsSettings instructorId={instructorId} />;
      case "pricing-rules":
        return <PricingRulesSettings instructorId={instructorId} />;
      case "mini-website":
        return <MiniWebsiteShare instructorId={instructorId} />;
      case "website-pages":
        return instructor?.app_slug ? (
          <MiniWebsiteCMS instructorId={instructorId} instructorSlug={instructor.app_slug} />
        ) : (
          <p className="text-sm text-muted-foreground">Your website URL is being set up.</p>
        );
      case "website-theme":
        return <MiniWebsiteThemeEditor instructorId={instructorId} currentSettings={{ website_theme: instructor?.website_theme, website_font: instructor?.website_font, website_header_style: instructor?.website_header_style, brand_colour: instructor?.brand_colour, secondary_colour: instructor?.secondary_colour, website_button_color: instructor?.website_button_color, website_footer_bg: instructor?.website_footer_bg, logo_url: instructor?.logo_url, phone: instructor?.phone, email: instructor?.email }} onUpdate={refreshInstructor} />;
      case "branding":
        return <PupilAppBrandingEditor instructorId={instructorId} />;
      case "pupil-self-service":
        return <PupilBookingSettingsEditor instructorId={instructorId} />;
      case "working-hours":
        return <WorkingHoursEditor instructorId={instructorId} />;
      case "calendar":
        return <GoogleServiceAccountSetup instructorId={instructorId} />;
      case "cancellation":
        return <CancellationPolicyEditor instructorId={instructorId} />;
      case "no-show-policy":
        return <NoShowPolicySettings instructorId={instructorId} />;
      case "reminders":
        return <ReminderSettings instructorId={instructorId} />;
      case "gps-mobile":
        return <InstructorDetailsEditor instructorId={instructorId} defaultTab="gps" />;
      case "routes":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Access your saved lesson routes, test routes, and driving test recordings.</p>
            <Button onClick={() => navigate('/instructor/routes')} className="w-full justify-between">
              <span className="flex items-center gap-2"><Route className="h-4 w-4" />Manage Routes</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        );
      case "demo-mode":
        return <DemoModeToggle />;
      case "daily-briefing":
        return <DailyBriefingToggle />;
      case "appearance":
        return <AppearanceSettings instructorId={instructorId} />;
      case "dashboard-layout":
        return <DashboardLayoutManager instructorId={instructorId} />;
      case "notifications":
        return <PushNotificationSettings instructorId={instructorId} />;
      case "gdpr":
        return <GDPRRetentionWidget instructorId={instructorId} />;
      case "data-backup":
        return <DataExportManager instructorId={instructorId} instructorName={profile?.name} />;
      case "reset-stats":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Reset your statistics if you need to start fresh. This action is permanent.</p>
            <ResetStatsDialog instructorId={instructorId} instructorName={profile?.name} />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (tileId: string) => {
    if (tileId === "square-connect" && (instructor as any)?.square_merchant_id) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Connected</Badge>;
    }
    return undefined;
  };

  // ─── Tile styling ───────────────────────────────────────────────────
  const cardClass = "bg-white rounded-[12px] overflow-hidden border-[0.5px] border-[#E5E5EA] mb-[10px]";

  // ─── System palette remap ──────────────────────────────────────────
  // Maps legacy saturated tint colours to the unified premium palette so
  // every icon block in Settings reads as a category recognition aid
  // rather than decoration.
  const remapTint = (tintBg: string, tintColor: string): { bg: string; color: string } => {
    switch (tintColor) {
      case "#1E40AF": return { bg: "#E6F1FB", color: "#2B7BC8" }; // schedule blue
      case "#5B21B6": return { bg: "#F1ECFA", color: "#8A5BC9" }; // insights purple
      case "#059669": return { bg: "#E8F3E8", color: "#3B8B3B" }; // people green
      case "#DC2626": return { bg: "#FBEAEC", color: "#C8434F" }; // location red
      case "#BE123C": return { bg: "#FBEAEC", color: "#C8434F" }; // rose
      case "#92400E": return { bg: "#FBF1DE", color: "#B8801F" }; // money amber
      case "#2A394F": return { bg: "#F2F2F4", color: "#6E6E73" }; // settings slate→neutral
      case "#52525B": return { bg: "#F2F2F4", color: "#6E6E73" }; // neutral
      default: return { bg: tintBg, color: tintColor };
    }
  };

  // Icon tile helper — pale tinted square (settings-row spec, 32×32)
  const renderIconTile = (icon: React.ElementType, tintBg: string, tintColor: string, iconSrc?: string) => {
    const Icon = icon;
    const { bg, color } = remapTint(tintBg, tintColor);
    return (
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {iconSrc ? (
          <img src={iconSrc} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <Icon size={18} strokeWidth={2} color={color} />
        )}
      </div>
    );
  };

  // ─── Settings tile component ───────────────────────────────────────

  const SettingsTile = ({ tile, statusBadge, children }: { tile: TileDef; statusBadge?: React.ReactNode; children: React.ReactNode }) => {
    const titleStyle: React.CSSProperties = {
      fontSize: 15,
      fontWeight: 500,
      color: "#000000",
      letterSpacing: -0.2,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
    };

    if (tile.externalUrl) {
      return (
        <div id={`settings-tile-${tile.id}`} className={cardClass}>
          <button
            className="w-full flex items-center gap-3 px-4 py-[14px]"
            onClick={() => window.open(tile.externalUrl, "_blank", "noopener,noreferrer")}
          >
            {renderIconTile(tile.icon, tile.tintBg, tile.tintColor, tile.iconSrc)}
            <div className="flex-1 text-left min-w-0">
              <span style={titleStyle}>{tile.title}</span>
            </div>
            <ExternalLink size={14} strokeWidth={1.6} color="#6E6E73" className="shrink-0" />
          </button>
        </div>
      );
    }

    return (
      <div id={`settings-tile-${tile.id}`} className={cardClass}>
        <Collapsible open={isOpen(tile.id)} onOpenChange={() => toggleSection(tile.id)}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-[14px]">
              {renderIconTile(tile.icon, tile.tintBg, tile.tintColor, tile.iconSrc)}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span style={titleStyle}>{tile.title}</span>
                  {statusBadge}
                </div>
              </div>
              <ChevronRight size={12} strokeWidth={1.6} color="#6E6E73" className={cn("transition-transform duration-200 shrink-0", isOpen(tile.id) && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[#E5E5EA] pt-4">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────

  let globalIndex = 0;

  // Map the legacy tintColor to the WarmTile category so menu rows match
  // the home page WarmTile look (icon + title + subtitle, 2-col grid).
  const tintToCategory = (tintColor: string): WarmTileCategory => {
    switch (tintColor) {
      case "#1E40AF": return "schedule";    // blue
      case "#5B21B6": return "planning";    // purple
      case "#059669": return "money";       // green
      case "#DC2626":
      case "#BE123C": return "urgent";      // red / rose
      case "#92400E": return "messages";    // amber
      case "#2A394F": return "people";      // slate
      default: return "neutral";
    }
  };

  const renderMenuSection = (section: { title: string; items: MenuItem[] }) => {
    const q = lowerQuery;
    const filteredItems = q
      ? section.items.filter(item =>
          item.label.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q)
        )
      : section.items;
    if (filteredItems.length === 0) return null;

    return (
      <div key={section.title}>
        <SectionLabel>{section.title}</SectionLabel>
        <WarmTileGrid>
          {filteredItems.map((item) => {
            const locked = item.gateKey ? isFeatureLocked(item.gateKey, subscription?.features) : false;
            const category = tintToCategory(item.tintColor);

            const handleClick = () => {
              if (locked) {
                toast.info(getUpgradeMessage(item.gateKey || ""), {
                  description: "Contact us to upgrade your plan.",
                });
                return;
              }
              if (item.action) {
                item.action();
              } else if (item.path) {
                navigate(item.path);
              }
            };

            const lockedBadge = locked ? (
              <Badge variant="outline" className="text-[10px] border-[#E4E4E7] text-[#71717A] shrink-0 px-1.5 py-0">
                {item.gateKey ? getMinimumPlanName(item.gateKey) : "PRO"}
              </Badge>
            ) : undefined;

            const iconSlot = item.iconSrc ? (
              <img src={item.iconSrc} alt={item.label} className="h-4 w-4 object-contain" />
            ) : locked ? (
              <Lock size={15} strokeWidth={2} color="#A1A1AA" />
            ) : undefined;

            return (
              <div key={item.label} style={{ opacity: locked ? 0.6 : 1 }}>
                <WarmTile
                  icon={item.icon as LucideIcon}
                  title={item.label}
                  subtitle={item.description}
                  category={category}
                  onClick={handleClick}
                  rightSlot={lockedBadge}
                  iconSlot={iconSlot}
                />
              </div>
            );
          })}
        </WarmTileGrid>
      </div>
    );
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search menu & settings"
          ariaLabel="Search menu and settings"
        />


        {/* Menu Sections (navigation items) */}
        {menuSections.map((section) => renderMenuSection(section))}

        {/* Quick Toggles (hidden during search) */}
        {!lowerQuery && instructorId && (
          <div>
            <div className="px-1 pb-[10px]">
              <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">Quick Toggles</span>
            </div>
            <div>
              {/* Listed on Website */}
              <div className={cardClass}>
                <div className="flex items-center justify-between px-4 py-[14px] gap-[14px]">
                  <div className="flex items-center gap-[14px]">
                    {renderIconTile(Eye, "#EDE9FE", "#5B21B6")}
                    <p className="text-[15px] font-medium text-[#18181B]" style={{ fontFamily: "Inter, sans-serif" }}>Listed on Website</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={handleVisibilityToggle} />
                </div>
              </div>
              {/* Hey ED */}
              <div className={cardClass}>
                <div className="flex items-center justify-between px-4 py-[14px] gap-[14px]">
                  <div className="flex items-center gap-[14px]">
                    {renderIconTile(Mic, "#E8ECF1", "#2A394F")}
                    <p className="text-[15px] font-medium text-[#18181B]" style={{ fontFamily: "Inter, sans-serif" }}>"Hey ED" Always Listening</p>
                  </div>
                  <Switch
                    checked={heyEdEnabled}
                    onCheckedChange={(checked) => {
                      setHeyEdEnabled(checked);
                      localStorage.setItem(`hey-ed-always-listen-${instructorId}`, String(checked));
                      uiToast({ title: checked ? '"Hey ED" enabled' : '"Hey ED" disabled' });
                    }}
                  />
                </div>
              </div>
              {/* Feature Toggles */}
              <div className={cardClass}>
                <div className="px-4 py-3">
                  <FeatureTogglesSettings instructorId={instructorId} />
                </div>
              </div>
            </div>
            {!isActive && (
              <div className="mt-2 rounded-[14px] bg-[#FEF3C7] border border-[#FDE68A] p-3">
                <p className="text-sm text-[#92400E]">You're currently hidden from the website.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings tiles grouped by category */}
        {filteredSettingsCategories.map((cat) => {
          const tilesInCat = filteredTiles.filter(t => t.category === cat.id);
          if (tilesInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="px-1 pb-[10px]">
                <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">{cat.title}</span>
              </div>
              <div>
                {tilesInCat.map((tile) => (
                  <SettingsTile key={tile.id} tile={tile} statusBadge={getStatusBadge(tile.id)}>
                    {renderTileContent(tile.id)}
                  </SettingsTile>
                ))}
              </div>
            </div>
          );
        })}

        {/* Account */}
        {!lowerQuery && (
          <div>
            <div className="px-1 pb-[10px]">
              <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">Account</span>
            </div>
            <div className={cardClass}>
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleLogout}
                className="w-full px-4 py-[14px] text-left flex items-center gap-[14px]"
              >
                {renderIconTile(LogOut, "#FEF2F2", "#DC2626")}
                <p className="flex-1 font-medium text-[15px] text-[#18181B]" style={{ fontFamily: "Inter, sans-serif" }}>Sign Out</p>
                <ChevronRight size={18} strokeWidth={2} color="#A1A1AA" className="shrink-0" />
              </motion.button>
            </div>
          </div>
        )}

        {lowerQuery && filteredTiles.length === 0 && menuSections.every(s => {
          const q = lowerQuery;
          return s.items.every(item =>
            !item.label.toLowerCase().includes(q) &&
            !(item.description || "").toLowerCase().includes(q) &&
            !s.title.toLowerCase().includes(q)
          );
        }) && (
          <div className="text-center py-8">
            <p className="text-sm text-[#8e8e93]">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Quick Test Result Form */}
      {instructor?.id && (
        <QuickTestResultForm
          open={showTestResultForm}
          onOpenChange={setShowTestResultForm}
          instructorId={instructor.id}
        />
      )}
    </InstructorPortalLayout>
  );
}
