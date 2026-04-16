import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Loader2, ChevronRight, Lock, LogOut, Eye, Mic, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
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

// Custom PNG icons
import messagesIcon from "@/assets/messages-icon.png";
import paymentsIcon from "@/assets/payments-icon-new.png";
import takePaymentIcon from "@/assets/take-payment-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import pupilsIcon from "@/assets/pupils-icon.png";
import trackIcon from "@/assets/track-icon.png";
import findMyCarIcon from "@/assets/find_car2.png";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import healthHubIcon from "@/assets/health-hub-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";
import expensesIcon from "@/assets/expenses-icon.png";
import todoIcon from "@/assets/todo-icon.png";
import squareLogo from "@/assets/square-logo.png";

import { motion } from "framer-motion";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useMenuFeatureGates } from "@/hooks/useMenuFeatureGates";
import { QuickTestResultForm } from "@/components/instructor/QuickTestResultForm";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
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
  iconColor?: string;
  iconBg?: string;
  gateKey?: string;
  customIcon?: string;
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
  iconColor: string;
  iconBg: string;
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
  { id: "profile", title: "Profile", description: "Your public instructor profile", icon: User, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", category: "profile" },
  { id: "details", title: "Vehicle & Qualifications", description: "Car details, skills & social links", icon: Car, iconColor: "text-orange-600", iconBg: "bg-orange-100 dark:bg-orange-900/30", category: "profile" },
  { id: "images", title: "Images & Media", description: "Car photo, QR code & video", icon: ImageIcon, iconColor: "text-purple-600", iconBg: "bg-purple-100 dark:bg-purple-900/30", category: "profile" },
  { id: "compliance", title: "Compliance & CPD", description: "Track ADI badge, insurance, MOT & CPD hours", icon: Shield, iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-900/20", category: "teaching" },
  { id: "test-centres", title: "Test Centres & Examiners", description: "Manage test centres and examiners", icon: MapPin, iconColor: "text-red-600", iconBg: "bg-red-100 dark:bg-red-900/30", category: "teaching" },
  { id: "terms", title: "Terms & Conditions", description: "Create terms for pupils to sign", icon: FileSignature, iconColor: "text-stone-600", iconBg: "bg-stone-100 dark:bg-stone-900/30", category: "teaching" },
  { id: "courses-mgr", title: "My Courses", description: "Manage your course offerings & pricing", icon: BookOpen, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", category: "courses" },
  { id: "booking-mode", title: "Booking Mode", description: "How pupils book lessons", icon: CalendarClock, iconColor: "text-teal-600", iconBg: "bg-teal-100 dark:bg-teal-900/30", category: "courses" },
  { id: "deposits", title: "Deposit Payments", description: "Accept deposits on bookings", icon: Banknote, iconColor: "text-lime-600", iconBg: "bg-lime-100 dark:bg-lime-900/30", category: "courses" },
  { id: "commission", title: "Card Commission & QR Codes", description: "Who pays the fee + upload QR codes", icon: CreditCard, iconColor: "text-violet-600", iconBg: "bg-violet-100 dark:bg-violet-900/30", category: "courses" },
  { id: "square-connect", title: "Square Account", description: "Connect for automatic payouts", icon: CreditCard, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", iconSrc: squareLogo, category: "courses" },
  { id: "referrals", title: "Referral Programme", description: "Configure pupil referral rewards", icon: Gift, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", category: "courses" },
  { id: "bnpl", title: "Buy Now, Pay Later", description: "Klarna & Clearpay on your mini-website", icon: CreditCard, iconColor: "text-pink-600", iconBg: "bg-pink-100 dark:bg-pink-900/30", category: "courses" },
  { id: "discount-codes", title: "Discount Codes", description: "Create promo codes for pupils", icon: Tag, iconColor: "text-orange-600", iconBg: "bg-orange-100 dark:bg-orange-900/30", category: "courses" },
  { id: "lesson-packages", title: "Lesson Packages", description: "Pre-paid block booking packages", icon: BookOpen, iconColor: "text-violet-600", iconBg: "bg-violet-100 dark:bg-violet-900/30", category: "courses" },
  { id: "intake-questions", title: "Intake Questions", description: "Custom questions on booking forms", icon: ClipboardList, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", category: "courses" },
  { id: "pricing-rules", title: "Price Adjustment Rules", description: "Dynamic pricing by time, day & zone", icon: PoundSterling, iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30", category: "courses" },
  { id: "mini-website", title: "Share Link", description: "Share your instructor profile", icon: Globe, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", category: "website" },
  { id: "website-pages", title: "Website Pages", description: "Edit your 5-page mini-website", icon: Layout, iconColor: "text-indigo-600", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", category: "website" },
  { id: "website-theme", title: "Website Theme", description: "Colors, fonts & style presets", icon: Sparkles, iconColor: "text-pink-600", iconBg: "bg-pink-100 dark:bg-pink-900/30", category: "website" },
  { id: "branding", title: "Pupil App Branding", description: "Customise your pupil portal", icon: Palette, iconColor: "text-rose-600", iconBg: "bg-rose-100 dark:bg-rose-900/30", category: "website" },
  { id: "pupil-self-service", title: "Pupil Self-Service Booking", description: "Let pupils book, cancel & reschedule", icon: CalendarClock, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", category: "scheduling" },
  { id: "working-hours", title: "Working Hours", description: "Set your availability", icon: Clock, iconColor: "text-blue-500", iconBg: "bg-blue-50 dark:bg-blue-900/20", category: "scheduling" },
  { id: "calendar", title: "Calendar Sync", description: "Sync lessons to your calendar", icon: Calendar, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", category: "scheduling" },
  { id: "cancellation", title: "Cancellation Policy", description: "Set notice period & charges", icon: FileText, iconColor: "text-slate-600", iconBg: "bg-slate-100 dark:bg-slate-900/30", category: "scheduling" },
  { id: "no-show-policy", title: "No-Show Policy", description: "Set fees for no-shows & late cancellations", icon: AlertTriangle, iconColor: "text-red-600", iconBg: "bg-red-100 dark:bg-red-900/30", category: "scheduling" },
  { id: "reminders", title: "Lesson Reminders", description: "Automatic pupil reminders before lessons", icon: Bell, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", category: "scheduling" },
  { id: "gps-mobile", title: "Mobile GPS Tracking", description: "Link your GPS Gate account", icon: Satellite, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", category: "tracking" },
  { id: "routes", title: "Saved Routes", description: "View and manage your recorded driving routes", icon: Route, iconColor: "text-fuchsia-600", iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", category: "tracking" },
  { id: "dashcam-portal", title: "Dashcam Portal", description: "View footage on Kinesis Fleet Pro", icon: Camera, iconColor: "text-slate-600", iconBg: "bg-slate-100 dark:bg-slate-900/30", category: "tracking", externalUrl: "https://www.kinesisfleetpro.com/#/login;next=%2Fstatus" },
  { id: "demo-mode", title: "Demo Mode", description: "Preview the app with sample data", icon: Eye, iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30", category: "preferences" },
  { id: "appearance", title: "Appearance", description: "Layout, hero image & wallpaper", icon: Paintbrush, iconColor: "text-pink-600", iconBg: "bg-pink-100 dark:bg-pink-900/30", category: "preferences" },
  { id: "dashboard-layout", title: "Dashboard Layout", description: "Customize your home screen tiles", icon: LayoutGrid, iconColor: "text-indigo-600", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", category: "preferences" },
  { id: "notifications", title: "Push Notifications", description: "Manage notification preferences", icon: Bell, iconColor: "text-yellow-600", iconBg: "bg-yellow-100 dark:bg-yellow-900/30", category: "preferences" },
  { id: "gdpr", title: "GDPR Data Retention", description: "Auto-flag stale pupil records", icon: Shield, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", category: "preferences" },
  { id: "data-backup", title: "Data Export & Backup", description: "Download your data for backup", icon: Database, iconColor: "text-zinc-600", iconBg: "bg-zinc-100 dark:bg-zinc-900/30", category: "preferences" },
  { id: "reset-stats", title: "Reset Statistics", description: "Clear lesson history, payments, or progress", icon: Trash2, iconColor: "text-red-500", iconBg: "bg-red-50 dark:bg-red-900/20", category: "preferences" },
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
        { icon: CheckSquare, label: "To Do", description: "Task list", iconColor: "text-white", iconBg: "bg-violet-500", gateKey: "todos", path: "/instructor/todos", customIcon: todoIcon },
        { icon: MessageCircle, label: "Messages", description: "Chat with pupils", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "messages", path: "/instructor/messages", customIcon: messagesIcon },
        { icon: Briefcase, label: "Job Offers", description: "Pending jobs", iconColor: "text-white", iconBg: "bg-purple-500", gateKey: "jobs", path: "/instructor/jobs", customIcon: jobOffersIcon },
        { icon: CalendarPlus, label: "New Bookings", description: "Pending schedule", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "pending-scheduling", path: "/instructor/pending-scheduling" },
        { icon: QrCode, label: "Take Payment", description: "QR code payment", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "pay", path: "/instructor/pay", customIcon: takePaymentIcon },
        { icon: Car, label: "Live Tracking", description: "GPS tracking", iconColor: "text-white", iconBg: "bg-cyan-500", gateKey: "tracking", path: "/instructor/tracking", customIcon: trackIcon },
        { icon: Navigation, label: "Find My Car", description: "Car location", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "find-my-car", path: "/instructor/find-my-car", customIcon: findMyCarIcon },
        { icon: Receipt, label: "Expenses", description: "Track costs", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "expenses", path: "/instructor/expenses", customIcon: expensesIcon },
        { icon: Award, label: "Test Swap", description: "Request or swap a test", iconColor: "text-white", iconBg: "bg-amber-600", gateKey: "test-requests", path: "/instructor/test-requests" },
      ],
    },
    {
      title: "Money & Reports",
      items: [
        { icon: CreditCard, label: "Payments", description: "Full breakdown", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "payments", path: "/instructor/pay", customIcon: paymentsIcon },
        { icon: TrendingUp, label: "Income Summary", description: "Earnings overview", iconColor: "text-white", iconBg: "bg-green-500", gateKey: "income", path: "/instructor/income" },
        { icon: ArrowUpDown, label: "In vs Out", description: "Income vs expenses", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "in-out", path: "/instructor/in-out" },
        { icon: Car, label: "Mileage Tracker", description: "HMRC deductions", iconColor: "text-white", iconBg: "bg-green-600", gateKey: "mileage", path: "/instructor/mileage" },
        { icon: Calculator, label: "Tax Summary", description: "Tax overview", iconColor: "text-white", iconBg: "bg-purple-500", gateKey: "tax", path: "/instructor/tax" },
      ],
    },
    {
      title: "Schedule & Pupils",
      items: [
        { icon: Calendar, label: "Schedule", description: "View calendar", iconColor: "text-white", iconBg: "bg-primary", gateKey: "schedule", path: "/instructor/schedule", customIcon: scheduleIcon },
        { icon: Users, label: "Pupils", description: "Manage pupils", iconColor: "text-white", iconBg: "bg-indigo-500", gateKey: "pupils", path: "/instructor/pupils", customIcon: pupilsIcon },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: Gauge, label: "Telematics", description: "Vehicle intelligence", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "fleet-dashboard", path: "/instructor/fleet-dashboard" },
        { icon: Camera, label: "Dashcam", description: "Recording & protection", iconColor: "text-white", iconBg: "bg-sky-500", gateKey: "dashcam", path: "/instructor/dashcam" },
        { icon: Star, label: "Reviews", description: "Moderate reviews", iconColor: "text-white", iconBg: "bg-amber-500", gateKey: "reviews", path: "/instructor/reviews" },
        { icon: Car, label: "Vehicle Health", description: "Fleet compliance", iconColor: "text-white", iconBg: "bg-cyan-500", gateKey: "vehicle-health", path: "/instructor/vehicle-health", customIcon: vehicleHealthIcon },
        { icon: Award, label: "Quick Test Result", description: "Record result", iconColor: "text-white", iconBg: "bg-emerald-500", gateKey: "test-result-quick", action: () => setShowTestResultForm(true) },
        { icon: Award, label: "Full Test Report", description: "DL25A recording", iconColor: "text-white", iconBg: "bg-teal-500", gateKey: "test-results", path: "/instructor/test-results" },
        { icon: Route, label: "Saved Routes", description: "Route library", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "routes", path: "/instructor/routes" },
        { icon: MapPin, label: "Jotter", description: "Draw on map", iconColor: "text-white", iconBg: "bg-orange-500", gateKey: "doodlepad", path: "/instructor/doodlepad" },
        { icon: MapPin, label: "Fill Gaps", description: "Schedule gaps", iconColor: "text-white", iconBg: "bg-pink-500", gateKey: "gaps", path: "/instructor/gaps" },
        { icon: StickyNote, label: "Notes", description: "Notebook", iconColor: "text-white", iconBg: "bg-yellow-500", gateKey: "notes", path: "/instructor/notes" },
        { icon: Users, label: "Bulk Operations", description: "SMS, reschedule, pricing", iconColor: "text-white", iconBg: "bg-indigo-500", gateKey: "bulk-operations", path: "/instructor/bulk-operations" },
        { icon: TrendingUp, label: "Reports Hub", description: "PDF reports", iconColor: "text-white", iconBg: "bg-violet-500", gateKey: "reports-hub", path: "/instructor/reports" },
      ],
    },
    {
      title: "Resources",
      items: [
        { icon: FolderOpen, label: "Resources", description: "Documents & files", iconColor: "text-white", iconBg: "bg-primary", gateKey: "resources", path: "/instructor/resources" },
        { icon: Megaphone, label: "Platform Updates", description: "News & feature ideas", iconColor: "text-white", iconBg: "bg-indigo-500", path: "/instructor/platform-updates" },
        { icon: HelpCircle, label: "FAQs & Help", description: "Get support", iconColor: "text-white", iconBg: "bg-primary", gateKey: "faqs", path: "/instructor/faqs" },
      ],
    },
    {
      title: "Wellbeing",
      items: [
        { icon: Heart, label: "Health Hub", description: "Wellness tips", iconColor: "text-white", iconBg: "bg-rose-500", gateKey: "health", path: "/instructor/health", customIcon: healthHubIcon },
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

  // ─── Premium card + gradient helpers ────────────────────────────────
  const cardClass = "bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] border-[0.5px] border-black/[0.06] mb-[10px]";
  const GradientLine = () => <div className="h-[2px] w-full bg-gradient-to-r from-[#0d4fa0] to-[#56a8f5]" />;

  // Gradient palette for menu items
  const menuGradients: Record<string, { bg: string; shadow: string }> = {
    "To Do": { bg: "linear-gradient(135deg, #1a6fd4, #56a8f5)", shadow: "0 3px 8px rgba(26,111,212,0.3)" },
    "Messages": { bg: "linear-gradient(135deg, #34c759, #30d158)", shadow: "0 3px 8px rgba(52,199,89,0.3)" },
    "Job Offers": { bg: "linear-gradient(135deg, #7c3aed, #a855f7)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "New Bookings": { bg: "linear-gradient(135deg, #f5a623, #f97316)", shadow: "0 3px 8px rgba(245,166,35,0.3)" },
    "Take Payment": { bg: "linear-gradient(135deg, #0f9e75, #1dcaa5)", shadow: "0 3px 8px rgba(15,158,117,0.3)" },
    "Live Tracking": { bg: "linear-gradient(135deg, #06b6d4, #22d3ee)", shadow: "0 3px 8px rgba(6,182,212,0.3)" },
    "Find My Car": { bg: "linear-gradient(135deg, #e11d48, #f43f5e)", shadow: "0 3px 8px rgba(225,29,72,0.3)" },
    "Expenses": { bg: "linear-gradient(135deg, #f59e0b, #fbbf24)", shadow: "0 3px 8px rgba(245,158,11,0.3)" },
    "Test Swap": { bg: "linear-gradient(135deg, #d97706, #f59e0b)", shadow: "0 3px 8px rgba(217,119,6,0.3)" },
    "Payments": { bg: "linear-gradient(135deg, #059669, #10b981)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "Income Summary": { bg: "linear-gradient(135deg, #16a34a, #22c55e)", shadow: "0 3px 8px rgba(22,163,74,0.3)" },
    "In vs Out": { bg: "linear-gradient(135deg, #0284c7, #38bdf8)", shadow: "0 3px 8px rgba(2,132,199,0.3)" },
    "Mileage Tracker": { bg: "linear-gradient(135deg, #15803d, #4ade80)", shadow: "0 3px 8px rgba(21,128,61,0.3)" },
    "Tax Summary": { bg: "linear-gradient(135deg, #7c3aed, #a78bfa)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "Schedule": { bg: "linear-gradient(135deg, #0d4fa0, #56a8f5)", shadow: "0 3px 8px rgba(13,79,160,0.3)" },
    "Pupils": { bg: "linear-gradient(135deg, #4f46e5, #818cf8)", shadow: "0 3px 8px rgba(79,70,229,0.3)" },
    "Telematics": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "Dashcam": { bg: "linear-gradient(135deg, #0284c7, #38bdf8)", shadow: "0 3px 8px rgba(2,132,199,0.3)" },
    "Reviews": { bg: "linear-gradient(135deg, #f59e0b, #fbbf24)", shadow: "0 3px 8px rgba(245,158,11,0.3)" },
    "Vehicle Health": { bg: "linear-gradient(135deg, #06b6d4, #67e8f9)", shadow: "0 3px 8px rgba(6,182,212,0.3)" },
    "Quick Test Result": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "Full Test Report": { bg: "linear-gradient(135deg, #0d9488, #2dd4bf)", shadow: "0 3px 8px rgba(13,148,136,0.3)" },
    "Saved Routes": { bg: "linear-gradient(135deg, #e11d48, #fb7185)", shadow: "0 3px 8px rgba(225,29,72,0.3)" },
    "Jotter": { bg: "linear-gradient(135deg, #ea580c, #fb923c)", shadow: "0 3px 8px rgba(234,88,12,0.3)" },
    "Fill Gaps": { bg: "linear-gradient(135deg, #db2777, #f472b6)", shadow: "0 3px 8px rgba(219,39,119,0.3)" },
    "Notes": { bg: "linear-gradient(135deg, #ca8a04, #facc15)", shadow: "0 3px 8px rgba(202,138,4,0.3)" },
    "Bulk Operations": { bg: "linear-gradient(135deg, #4f46e5, #818cf8)", shadow: "0 3px 8px rgba(79,70,229,0.3)" },
    "Reports Hub": { bg: "linear-gradient(135deg, #7c3aed, #a78bfa)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "Resources": { bg: "linear-gradient(135deg, #0d4fa0, #56a8f5)", shadow: "0 3px 8px rgba(13,79,160,0.3)" },
    "Platform Updates": { bg: "linear-gradient(135deg, #4f46e5, #818cf8)", shadow: "0 3px 8px rgba(79,70,229,0.3)" },
    "FAQs & Help": { bg: "linear-gradient(135deg, #0d4fa0, #56a8f5)", shadow: "0 3px 8px rgba(13,79,160,0.3)" },
    "Health Hub": { bg: "linear-gradient(135deg, #e11d48, #f43f5e)", shadow: "0 3px 8px rgba(225,29,72,0.3)" },
    "Sign Out": { bg: "linear-gradient(135deg, #dc2626, #ef4444)", shadow: "0 3px 8px rgba(220,38,38,0.3)" },
  };
  const defaultGradient = { bg: "linear-gradient(135deg, #0d4fa0, #56a8f5)", shadow: "0 3px 8px rgba(13,79,160,0.3)" };

  // Settings tile gradients
  const settingsGradients: Record<string, { bg: string; shadow: string }> = {
    "profile": { bg: "linear-gradient(135deg, #1a6fd4, #56a8f5)", shadow: "0 3px 8px rgba(26,111,212,0.3)" },
    "details": { bg: "linear-gradient(135deg, #ea580c, #fb923c)", shadow: "0 3px 8px rgba(234,88,12,0.3)" },
    "images": { bg: "linear-gradient(135deg, #7c3aed, #a855f7)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "compliance": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "test-centres": { bg: "linear-gradient(135deg, #dc2626, #f87171)", shadow: "0 3px 8px rgba(220,38,38,0.3)" },
    "terms": { bg: "linear-gradient(135deg, #78716c, #a8a29e)", shadow: "0 3px 8px rgba(120,113,108,0.3)" },
    "courses-mgr": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "booking-mode": { bg: "linear-gradient(135deg, #0d9488, #2dd4bf)", shadow: "0 3px 8px rgba(13,148,136,0.3)" },
    "deposits": { bg: "linear-gradient(135deg, #65a30d, #a3e635)", shadow: "0 3px 8px rgba(101,163,13,0.3)" },
    "commission": { bg: "linear-gradient(135deg, #7c3aed, #a78bfa)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "square-connect": { bg: "linear-gradient(135deg, #1a6fd4, #56a8f5)", shadow: "0 3px 8px rgba(26,111,212,0.3)" },
    "referrals": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "bnpl": { bg: "linear-gradient(135deg, #db2777, #f472b6)", shadow: "0 3px 8px rgba(219,39,119,0.3)" },
    "discount-codes": { bg: "linear-gradient(135deg, #ea580c, #fb923c)", shadow: "0 3px 8px rgba(234,88,12,0.3)" },
    "lesson-packages": { bg: "linear-gradient(135deg, #7c3aed, #a78bfa)", shadow: "0 3px 8px rgba(124,58,237,0.3)" },
    "intake-questions": { bg: "linear-gradient(135deg, #0891b2, #22d3ee)", shadow: "0 3px 8px rgba(8,145,178,0.3)" },
    "pricing-rules": { bg: "linear-gradient(135deg, #d97706, #fbbf24)", shadow: "0 3px 8px rgba(217,119,6,0.3)" },
    "mini-website": { bg: "linear-gradient(135deg, #0891b2, #22d3ee)", shadow: "0 3px 8px rgba(8,145,178,0.3)" },
    "website-pages": { bg: "linear-gradient(135deg, #4f46e5, #818cf8)", shadow: "0 3px 8px rgba(79,70,229,0.3)" },
    "website-theme": { bg: "linear-gradient(135deg, #db2777, #f472b6)", shadow: "0 3px 8px rgba(219,39,119,0.3)" },
    "branding": { bg: "linear-gradient(135deg, #e11d48, #fb7185)", shadow: "0 3px 8px rgba(225,29,72,0.3)" },
    "pupil-self-service": { bg: "linear-gradient(135deg, #059669, #34d399)", shadow: "0 3px 8px rgba(5,150,105,0.3)" },
    "working-hours": { bg: "linear-gradient(135deg, #2563eb, #60a5fa)", shadow: "0 3px 8px rgba(37,99,235,0.3)" },
    "calendar": { bg: "linear-gradient(135deg, #0284c7, #38bdf8)", shadow: "0 3px 8px rgba(2,132,199,0.3)" },
    "cancellation": { bg: "linear-gradient(135deg, #475569, #94a3b8)", shadow: "0 3px 8px rgba(71,85,105,0.3)" },
    "no-show-policy": { bg: "linear-gradient(135deg, #dc2626, #f87171)", shadow: "0 3px 8px rgba(220,38,38,0.3)" },
    "reminders": { bg: "linear-gradient(135deg, #0284c7, #38bdf8)", shadow: "0 3px 8px rgba(2,132,199,0.3)" },
    "gps-mobile": { bg: "linear-gradient(135deg, #0891b2, #22d3ee)", shadow: "0 3px 8px rgba(8,145,178,0.3)" },
    "routes": { bg: "linear-gradient(135deg, #c026d3, #e879f9)", shadow: "0 3px 8px rgba(192,38,211,0.3)" },
    "dashcam-portal": { bg: "linear-gradient(135deg, #475569, #94a3b8)", shadow: "0 3px 8px rgba(71,85,105,0.3)" },
    "demo-mode": { bg: "linear-gradient(135deg, #d97706, #fbbf24)", shadow: "0 3px 8px rgba(217,119,6,0.3)" },
    "appearance": { bg: "linear-gradient(135deg, #db2777, #f472b6)", shadow: "0 3px 8px rgba(219,39,119,0.3)" },
    "dashboard-layout": { bg: "linear-gradient(135deg, #4f46e5, #818cf8)", shadow: "0 3px 8px rgba(79,70,229,0.3)" },
    "notifications": { bg: "linear-gradient(135deg, #ca8a04, #facc15)", shadow: "0 3px 8px rgba(202,138,4,0.3)" },
    "gdpr": { bg: "linear-gradient(135deg, #1a6fd4, #56a8f5)", shadow: "0 3px 8px rgba(26,111,212,0.3)" },
    "data-backup": { bg: "linear-gradient(135deg, #52525b, #a1a1aa)", shadow: "0 3px 8px rgba(82,82,91,0.3)" },
    "reset-stats": { bg: "linear-gradient(135deg, #dc2626, #ef4444)", shadow: "0 3px 8px rgba(220,38,38,0.3)" },
  };

  // ─── Settings tile component ───────────────────────────────────────

  const SettingsTile = ({ tile, statusBadge, children }: { tile: TileDef; statusBadge?: React.ReactNode; children: React.ReactNode }) => {
    const Icon = tile.icon;
    const grad = settingsGradients[tile.id] || defaultGradient;

    if (tile.externalUrl) {
      return (
        <div id={`settings-tile-${tile.id}`} className={cardClass}>
          <button
            className="w-full flex items-center gap-[14px] px-4 py-[13px]"
            onClick={() => window.open(tile.externalUrl, "_blank", "noopener,noreferrer")}
          >
            <div
              className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: grad.bg, boxShadow: grad.shadow }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-[15px] font-semibold text-[#1c1c1e]">{tile.title}</span>
            </div>
            <ExternalLink className="h-4 w-4 text-[#c7c7cc] shrink-0" />
          </button>
          <GradientLine />
        </div>
      );
    }

    return (
      <div id={`settings-tile-${tile.id}`} className={cardClass}>
        <Collapsible open={isOpen(tile.id)} onOpenChange={() => toggleSection(tile.id)}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-[14px] px-4 py-[13px]">
              <div
                className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: grad.bg, boxShadow: grad.shadow }}
              >
                {tile.iconSrc ? (
                  <img src={tile.iconSrc} alt={tile.title} className="h-5 w-5 object-contain" />
                ) : (
                  <Icon className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#1c1c1e]">{tile.title}</span>
                  {statusBadge}
                </div>
              </div>
              <ChevronRight className={cn("h-4 w-4 text-[#c7c7cc] transition-transform duration-200 shrink-0", isOpen(tile.id) && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-black/[0.06] pt-4">{children}</div>
          </CollapsibleContent>
        </Collapsible>
        <GradientLine />
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────

  let globalIndex = 0;

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
        <div className="px-1 pb-[10px]">
          <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">{section.title}</span>
        </div>
        <div>
          {filteredItems.map((item, itemIndex) => {
            const locked = item.gateKey ? isFeatureLocked(item.gateKey, subscription?.features) : false;
            const idx = globalIndex++;
            const grad = menuGradients[item.label] || defaultGradient;

            return (
              <div key={idx} className={cardClass}>
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 + idx * 0.015 }}
                  onClick={() => {
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
                  }}
                  className={cn(
                    "w-full px-4 py-[13px] text-left flex items-center gap-[14px]",
                    locked && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div
                    className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                    style={locked ? { background: '#e5e7eb' } : { background: grad.bg, boxShadow: grad.shadow }}
                  >
                    {locked ? (
                      <Lock className="h-5 w-5 text-[#8e8e93]" />
                    ) : item.customIcon ? (
                      <img src={item.customIcon} alt={item.label} className="h-full w-full object-cover" />
                    ) : (
                      <item.icon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <p className="flex-1 min-w-0 font-semibold text-[15px] text-[#1c1c1e] truncate">
                    {item.label}
                  </p>
                  {locked ? (
                    <Badge variant="outline" className="text-[10px] border-[#c7c7cc]/30 text-[#8e8e93] shrink-0">
                      {item.gateKey ? getMinimumPlanName(item.gateKey) : 'PRO'}
                    </Badge>
                  ) : (
                    <span className="text-[16px] text-[#c7c7cc] shrink-0">›</span>
                  )}
                </motion.button>
                <GradientLine />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-5 pb-24">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu & settings..."
            className="pl-9 pr-8 rounded-2xl bg-card dark:bg-[#1C1C1E] shadow-sm border-0 h-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Menu Sections (navigation items) */}
        {menuSections.map((section) => renderMenuSection(section))}

        {/* Quick Toggles (hidden during search) */}
        {!lowerQuery && instructorId && (
          <div>
            <div className="px-4 pb-1.5">
              <span className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide">Quick Toggles</span>
            </div>
            <div className="bg-card dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm divide-y divide-border/40">
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
                    uiToast({ title: checked ? '"Hey ED" enabled' : '"Hey ED" disabled' });
                  }}
                />
              </div>
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
        )}

        {/* Settings tiles grouped by category */}
        {filteredSettingsCategories.map((cat) => {
          const tilesInCat = filteredTiles.filter(t => t.category === cat.id);
          if (tilesInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="px-4 pb-1.5">
                <span className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide">{cat.title}</span>
              </div>
              <div className="bg-card dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm divide-y divide-border/40">
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
            <div className="px-4 pb-1.5">
              <span className="text-[13px] font-normal text-muted-foreground uppercase">Account</span>
            </div>
            <div className="bg-card dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleLogout}
                className="w-full px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-destructive">
                    <LogOut className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-medium text-sm text-foreground">Sign Out</p>
                </div>
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
            <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
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
