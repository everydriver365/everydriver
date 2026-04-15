import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight, Globe, Layout, Sparkles, Car, QrCode, ImageIcon, Video, ImagePlus, Award, Database, FileSignature, Banknote, Shield, CalendarClock, BookOpen, MapPin, Trash2, Navigation, ExternalLink, Route, GraduationCap, LayoutGrid, Satellite, AlertTriangle, Gift, CreditCard, Paintbrush, Tag, ClipboardList, Mic } from "lucide-react";
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
import squareLogo from "@/assets/square-logo.png";
import { PaymentOptionsSettings } from "@/components/instructor/PaymentOptionsSettings";
import { LessonPackageManager } from "@/components/instructor/LessonPackageManager";
import { IntakeQuestionsSettings } from "@/components/instructor/IntakeQuestionsSettings";
import { PricingRulesSettings } from "@/components/instructor/PricingRulesSettings";
import { GDPRRetentionWidget } from "@/components/instructor/GDPRRetentionWidget";
import { ReminderSettings } from "@/components/instructor/ReminderSettings";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

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
}

// ─── Tile definitions per category ───────────────────────────────────

const categories = [
  { id: "profile", title: "Profile & Identity" },
  { id: "teaching", title: "Compliance & Teaching" },
  { id: "courses", title: "Courses & Payments" },
  { id: "website", title: "Website & Branding" },
  { id: "scheduling", title: "Scheduling" },
  { id: "tracking", title: "Tracking & Routes" },
  { id: "preferences", title: "Preferences & Data" },
];

const allTiles: TileDef[] = [
  // Profile
  { id: "profile", title: "Profile", description: "Your public instructor profile", icon: User, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30", category: "profile" },
  { id: "details", title: "Vehicle & Qualifications", description: "Car details, skills & social links", icon: Car, iconColor: "text-orange-600", iconBg: "bg-orange-100 dark:bg-orange-900/30", category: "profile" },
  { id: "images", title: "Images & Media", description: "Car photo, QR code & video", icon: ImageIcon, iconColor: "text-purple-600", iconBg: "bg-purple-100 dark:bg-purple-900/30", category: "profile" },
  // Teaching
  { id: "compliance", title: "Compliance & CPD", description: "Track ADI badge, insurance, MOT & CPD hours", icon: Shield, iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-900/20", category: "teaching" },
  { id: "test-centres", title: "Test Centres & Examiners", description: "Manage test centres and examiners", icon: MapPin, iconColor: "text-red-600", iconBg: "bg-red-100 dark:bg-red-900/30", category: "teaching" },
  { id: "terms", title: "Terms & Conditions", description: "Create terms for pupils to sign", icon: FileSignature, iconColor: "text-stone-600", iconBg: "bg-stone-100 dark:bg-stone-900/30", category: "teaching" },
  // Courses
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
  // Website
  { id: "mini-website", title: "Share Link", description: "Share your instructor profile", icon: Globe, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", category: "website" },
  { id: "website-pages", title: "Website Pages", description: "Edit your 5-page mini-website", icon: Layout, iconColor: "text-indigo-600", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", category: "website" },
  { id: "website-theme", title: "Website Theme", description: "Colors, fonts & style presets", icon: Sparkles, iconColor: "text-pink-600", iconBg: "bg-pink-100 dark:bg-pink-900/30", category: "website" },
  { id: "branding", title: "Pupil App Branding", description: "Customise your pupil portal", icon: Palette, iconColor: "text-rose-600", iconBg: "bg-rose-100 dark:bg-rose-900/30", category: "website" },
  // Scheduling
  { id: "pupil-self-service", title: "Pupil Self-Service Booking", description: "Let pupils book, cancel & reschedule", icon: CalendarClock, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", category: "scheduling" },
  { id: "working-hours", title: "Working Hours", description: "Set your availability", icon: Clock, iconColor: "text-blue-500", iconBg: "bg-blue-50 dark:bg-blue-900/20", category: "scheduling" },
  { id: "calendar", title: "Calendar Sync", description: "Sync lessons to your calendar", icon: Calendar, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", category: "scheduling" },
  { id: "cancellation", title: "Cancellation Policy", description: "Set notice period & charges", icon: FileText, iconColor: "text-slate-600", iconBg: "bg-slate-100 dark:bg-slate-900/30", category: "scheduling" },
  { id: "no-show-policy", title: "No-Show Policy", description: "Set fees for no-shows & late cancellations", icon: AlertTriangle, iconColor: "text-red-600", iconBg: "bg-red-100 dark:bg-red-900/30", category: "scheduling" },
  { id: "reminders", title: "Lesson Reminders", description: "Automatic pupil reminders before lessons", icon: Bell, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30", category: "scheduling" },
  // Tracking
  { id: "gps-mobile", title: "Mobile GPS Tracking", description: "Link your GPS Gate account", icon: Satellite, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", category: "tracking" },
  { id: "routes", title: "Saved Routes", description: "View and manage your recorded driving routes", icon: Route, iconColor: "text-fuchsia-600", iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", category: "tracking" },
  // Preferences
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

export default function InstructorSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;

  // Quick toggles
  const [isActive, setIsActive] = useState(true);
  const [heyEdEnabled, setHeyEdEnabled] = useState(() =>
    localStorage.getItem(`hey-ed-always-listen-${authInstructor?.id}`) === "true"
  );

  // Profile data (needed by some tiles)
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Open sections
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const p = searchParams.get("open");
    return p ? [p] : [];
  });

  useEffect(() => {
    if (authInstructor) setIsActive(authInstructor.is_active ?? true);
  }, [authInstructor]);

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
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile || !instructorId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("instructors").update({ name: profile.name, email: profile.email, phone: profile.phone, bio: profile.bio }).eq("id", instructorId);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your changes have been saved" });
    } catch {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
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
      toast({ title: "Photo updated" });
    } catch {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
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
      toast({ title: isVisible ? "Now visible" : "Hidden from website" });
    } catch {
      setIsActive(!isVisible);
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };
  const isOpen = (id: string) => openSections.includes(id);

  // Search filtering
  const lowerQuery = query.toLowerCase().trim();
  const filteredTiles = useMemo(() => {
    if (!lowerQuery) return allTiles;
    return allTiles.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      categories.find(c => c.id === t.category)?.title.toLowerCase().includes(lowerQuery)
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

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => filteredTiles.some(t => t.category === cat.id));
  }, [filteredTiles]);

  // ─── SettingsTile ────────────────────────────────────────────────────

  const SettingsTile = ({ tile, statusBadge, children }: { tile: TileDef; statusBadge?: React.ReactNode; children: React.ReactNode }) => {
    const Icon = tile.icon;
    return (
      <div id={`settings-tile-${tile.id}`} className="overflow-hidden transition-all duration-300">
        <Collapsible open={isOpen(tile.id)} onOpenChange={() => toggleSection(tile.id)}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("h-[29px] w-[29px] rounded-[7px] flex items-center justify-center shrink-0", tile.iconBg)}>
                  {tile.iconSrc ? (
                    <img src={tile.iconSrc} alt={tile.title} className="h-4 w-4 object-contain" />
                  ) : (
                    <Icon className={cn("h-4 w-4", tile.iconColor)} />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-normal text-foreground">{tile.title}</span>
                    {statusBadge}
                  </div>
                  <div className="text-[13px] text-muted-foreground">{tile.description}</div>
                </div>
              </div>
              <ChevronRight className={cn("h-4 w-4 text-muted-foreground/40 transition-transform duration-200", isOpen(tile.id) && "rotate-90")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-border/30 pt-4">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // ─── Tile content renderer ─────────────────────────────────────────

  const renderTileContent = (tileId: string) => {
    if (!instructorId) return null;
    switch (tileId) {
      case "profile":
        return loading ? (
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
              <CMSImageUpload value={profile?.hero_image_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ hero_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, hero_image_url: url } : null); toast({ title: "Banner image updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Car className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Car Photo</Label></div>
              <CMSImageUpload value={profile?.car_image_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ car_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, car_image_url: url } : null); toast({ title: "Car photo updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Welcome Video URL</Label></div>
              <Input placeholder="https://youtube.com/watch?v=..." value={profile?.welcome_video_url || ""} onChange={(e) => setProfile(prev => prev ? { ...prev, welcome_video_url: e.target.value } : null)} />
              <Button size="sm" variant="outline" onClick={async () => { try { const { error } = await supabase.from("instructors").update({ welcome_video_url: profile?.welcome_video_url }).eq("id", instructorId); if (error) throw error; toast({ title: "Video URL saved" }); } catch { toast({ title: "Error", variant: "destructive" }); } }}>Save Video URL</Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">ADI Certificate</Label></div>
              <CMSImageUpload value={profile?.adi_certificate_url || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ adi_certificate_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, adi_certificate_url: url } : null); toast({ title: "Certificate uploaded" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
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
        return <BookingModeSelector instructorId={instructorId} currentMode={authInstructor?.booking_mode || 'pupil_choice'} />;
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
                  <CMSImageUpload value={profile?.payment_qr_url_pupil_pays || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ payment_qr_url_pupil_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_pupil_pays: url } : null); toast({ title: "QR updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
                <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer === 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                  <Label className="text-xs font-medium">Instructor Pays Commission QR</Label>
                  <CMSImageUpload value={profile?.payment_qr_url_instructor_pays || null} onChange={async (url) => { try { const { error } = await supabase.from("instructors").update({ payment_qr_url_instructor_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_instructor_pays: url } : null); toast({ title: "QR updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
              </div>
            </div>
          </div>
        );
      case "square-connect":
        return <SquareConnectSettings instructorId={instructorId} squareMerchantId={(authInstructor as any)?.square_merchant_id} squareConnectedAt={(authInstructor as any)?.square_connected_at} onUpdate={refreshInstructor} />;
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
        return authInstructor?.app_slug ? (
          <MiniWebsiteCMS instructorId={instructorId} instructorSlug={authInstructor.app_slug} />
        ) : (
          <p className="text-sm text-muted-foreground">Your website URL is being set up.</p>
        );
      case "website-theme":
        return <MiniWebsiteThemeEditor instructorId={instructorId} currentSettings={{ website_theme: authInstructor?.website_theme, website_font: authInstructor?.website_font, website_header_style: authInstructor?.website_header_style, brand_colour: authInstructor?.brand_colour, secondary_colour: authInstructor?.secondary_colour, website_button_color: authInstructor?.website_button_color, website_footer_bg: authInstructor?.website_footer_bg, logo_url: authInstructor?.logo_url, phone: authInstructor?.phone, email: authInstructor?.email }} onUpdate={refreshInstructor} />;
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
    if (tileId === "square-connect" && (authInstructor as any)?.square_merchant_id) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Connected</Badge>;
    }
    return undefined;
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
        {/* Title */}
        <div className="px-1 pt-1 pb-2">
          <h1 className="text-[34px] font-bold text-foreground leading-tight tracking-tight">Settings</h1>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full h-10 pl-9 pr-8 rounded-[10px] text-[15px] bg-muted/80 text-foreground placeholder:text-muted-foreground/60 outline-none border-0 transition-colors focus:bg-muted"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted-foreground/30 flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5 text-background" />
            </button>
          )}
        </div>

        {/* Quick Toggles (hidden during search) */}
        {!lowerQuery && (
          <div>
            <div className="px-4 pb-1.5">
              <span className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide">Quick Toggles</span>
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-sm overflow-hidden divide-y divide-border/40">
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
                    toast({ title: checked ? '"Hey ED" enabled' : '"Hey ED" disabled' });
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

        {/* All tiles grouped by category */}
        {filteredCategories.map((cat) => {
          const tilesInCat = filteredTiles.filter(t => t.category === cat.id);
          if (tilesInCat.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="px-4 pb-1.5">
                <span className="text-[13px] font-normal text-muted-foreground uppercase tracking-wide">{cat.title}</span>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-sm overflow-hidden divide-y divide-border/40">
                {tilesInCat.map((tile) => (
                  <SettingsTile key={tile.id} tile={tile} statusBadge={getStatusBadge(tile.id)}>
                    {renderTileContent(tile.id)}
                  </SettingsTile>
                ))}
              </div>
            </div>
          );
        })}

        {lowerQuery && filteredTiles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No settings found for "{query}"</p>
          </div>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
