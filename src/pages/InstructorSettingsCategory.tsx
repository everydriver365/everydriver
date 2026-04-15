import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight, Globe, Layout, Sparkles, Car, QrCode, ImageIcon, Video, ImagePlus, Award, Database, FileSignature, Banknote, Shield, CalendarClock, BookOpen, MapPin, Trash2, Navigation, ExternalLink, Route, GraduationCap, LayoutGrid, Satellite, AlertTriangle, Gift, CreditCard, Paintbrush, Tag, ClipboardList, ToggleLeft } from "lucide-react";
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
import { ChevronLeft } from "lucide-react";

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

const categoryTitles: Record<string, string> = {
  profile: "Profile & Identity",
  teaching: "Compliance & Teaching",
  courses: "Courses & Payments",
  website: "Website & Branding",
  scheduling: "Scheduling",
  tracking: "Tracking & Routes",
  preferences: "Preferences & Data",
};

function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode, loading } = useDemoMode();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Toggle demo mode to preview the app with realistic sample data. Your real account data is never affected.
      </p>
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

export default function InstructorSettingsCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;

  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const openParam = searchParams.get("open");
    return openParam ? [openParam] : [];
  });

  const title = categoryTitles[categoryId || ""] || "Settings";

  useEffect(() => {
    if (instructorId) fetchProfile();
  }, [instructorId]);

  // Auto-scroll to opened tile
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
      const { error } = await supabase
        .from("instructors")
        .update({ name: profile.name, email: profile.email, phone: profile.phone, bio: profile.bio })
        .eq("id", instructorId);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your changes have been saved" });
    } catch (error) {
      console.error("Error updating profile:", error);
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
      toast({ title: "Photo updated", description: "Your profile photo has been changed" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const isOpen = (section: string) => openSections.includes(section);

  const SettingsTile = ({ id, icon: Icon, title, description, iconColor = "text-primary", iconBg = "bg-primary/10", statusBadge, iconSrc, children }: {
    id: string; icon: React.ElementType; title: string; description: string;
    iconColor?: string; iconBg?: string; statusBadge?: React.ReactNode; iconSrc?: string; children: React.ReactNode;
  }) => (
    <div id={`settings-tile-${id}`} className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      <Collapsible open={isOpen(id)} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              {iconSrc ? (
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                  <img src={iconSrc} alt={title} className="h-5 w-5 object-contain" />
                </div>
              ) : (
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{title}</span>
                  {statusBadge}
                </div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </div>
            <ChevronRight className={cn("h-4 w-4 text-muted-foreground/40 transition-transform duration-200", isOpen(id) && "rotate-90")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border/30 pt-4">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const basePath = window.location.pathname.includes("/every-instructor") ? "/every-instructor/settings" : "/instructor/settings";

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </InstructorPortalLayout>
    );
  }

  const renderCategoryContent = () => {
    switch (categoryId) {
      case "profile":
        return (
          <div className="space-y-3">
            <SettingsTile id="profile" icon={User} title="Profile" description="Your public instructor profile" iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30">
              {loading ? (
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
                  <div className="space-y-1.5"><Label htmlFor="name" className="text-sm">Name</Label><Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="email" className="text-sm">Email</Label><Input id="email" type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="phone" className="text-sm">Phone</Label><Input id="phone" type="tel" value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label htmlFor="bio" className="text-sm">Bio</Label><Textarea id="bio" value={profile.bio || ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Tell pupils about yourself..." /></div>
                  <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Profile</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Profile not found</p>
              )}
            </SettingsTile>
            <SettingsTile id="details" icon={Car} title="Vehicle & Qualifications" description="Car details, skills & social links" iconColor="text-orange-600" iconBg="bg-orange-100 dark:bg-orange-900/30">
              <InstructorDetailsEditor instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="images" icon={ImageIcon} title="Images & Media" description="Car photo, QR code & video" iconColor="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-900/30">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2"><ImagePlus className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Banner Image</Label></div>
                  <p className="text-xs text-muted-foreground mb-2">Hero image for your mini-website header</p>
                  <CMSImageUpload value={profile?.hero_image_url || null} onChange={async (url) => { if (!instructorId) return; try { const { error } = await supabase.from("instructors").update({ hero_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, hero_image_url: url } : null); toast({ title: "Banner image updated" }); } catch { toast({ title: "Error", description: "Failed to update banner image", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2"><Car className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Car Photo</Label></div>
                  <p className="text-xs text-muted-foreground mb-2">Show pupils what car they'll be learning in</p>
                  <CMSImageUpload value={profile?.car_image_url || null} onChange={async (url) => { if (!instructorId) return; try { const { error } = await supabase.from("instructors").update({ car_image_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, car_image_url: url } : null); toast({ title: "Car photo updated" }); } catch { toast({ title: "Error", description: "Failed to update car photo", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Welcome Video URL</Label></div>
                  <p className="text-xs text-muted-foreground mb-2">Link to a YouTube or Vimeo introduction video</p>
                  <Input placeholder="https://youtube.com/watch?v=..." value={profile?.welcome_video_url || ""} onChange={(e) => setProfile(prev => prev ? { ...prev, welcome_video_url: e.target.value } : null)} />
                  <Button size="sm" variant="outline" onClick={async () => { if (!instructorId || !profile) return; try { const { error } = await supabase.from("instructors").update({ welcome_video_url: profile.welcome_video_url }).eq("id", instructorId); if (error) throw error; toast({ title: "Video URL saved" }); } catch { toast({ title: "Error", description: "Failed to save video URL", variant: "destructive" }); } }}>Save Video URL</Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">ADI Certificate</Label></div>
                  <p className="text-xs text-muted-foreground mb-2">Upload your ADI certificate for verification</p>
                  <CMSImageUpload value={profile?.adi_certificate_url || null} onChange={async (url) => { if (!instructorId) return; try { const { error } = await supabase.from("instructors").update({ adi_certificate_url: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, adi_certificate_url: url } : null); toast({ title: "Certificate uploaded" }); } catch { toast({ title: "Error", description: "Failed to upload certificate", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                </div>
              </div>
            </SettingsTile>
          </div>
        );

      case "teaching":
        return (
          <div className="space-y-3">
            <SettingsTile id="compliance" icon={Shield} title="Compliance & CPD" description="Track ADI badge, insurance, MOT & CPD hours" iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-900/20">
              <ComplianceTracker instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="test-centres" icon={MapPin} title="Test Centres & Examiners" description="Manage test centres and examiners for routes & triggers" iconColor="text-red-600" iconBg="bg-red-100 dark:bg-red-900/30">
              <TestCentresAndExaminersManager instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="terms" icon={FileSignature} title="Terms & Conditions" description="Create terms for pupils to sign" iconColor="text-stone-600" iconBg="bg-stone-100 dark:bg-stone-900/30">
              <TermsConditionsEditor instructorId={instructorId} />
            </SettingsTile>
          </div>
        );

      case "courses":
        return (
          <div className="space-y-3">
            <SettingsTile id="courses" icon={BookOpen} title="My Courses" description="Manage your course offerings & pricing" iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30">
              <InstructorCoursesManager instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="booking-mode" icon={CalendarClock} title="Booking Mode" description="How pupils book lessons" iconColor="text-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/30">
              <BookingModeSelector instructorId={instructorId} currentMode={authInstructor?.booking_mode || 'pupil_choice'} />
            </SettingsTile>
            <SettingsTile id="deposits" icon={Banknote} title="Deposit Payments" description="Accept deposits on bookings" iconColor="text-lime-600" iconBg="bg-lime-100 dark:bg-lime-900/30">
              <DepositSettingsEditor instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="commission" icon={CreditCard} title="Card Commission & QR Codes" description="Who pays the fee + upload QR codes" iconColor="text-violet-600" iconBg="bg-violet-100 dark:bg-violet-900/30">
              <div className="space-y-6">
                <CommissionPayerSettings instructorId={instructorId} initialPayer={profile?.commission_payer} initialSplitPercent={(profile as any)?.commission_split_percent} />
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-muted-foreground" /><Label className="text-sm font-medium">Payment QR Codes</Label></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer !== 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                      <Label className="text-xs font-medium">Pupil Pays Commission QR</Label>
                      {profile?.commission_payer !== 'instructor' && <span className="text-[10px] text-primary font-semibold ml-1">ACTIVE</span>}
                      <CMSImageUpload value={profile?.payment_qr_url_pupil_pays || null} onChange={async (url) => { if (!instructorId) return; try { const { error } = await supabase.from("instructors").update({ payment_qr_url_pupil_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_pupil_pays: url } : null); toast({ title: "Pupil pays QR updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                    </div>
                    <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer === 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                      <Label className="text-xs font-medium">Instructor Pays Commission QR</Label>
                      {profile?.commission_payer === 'instructor' && <span className="text-[10px] text-primary font-semibold ml-1">ACTIVE</span>}
                      <CMSImageUpload value={profile?.payment_qr_url_instructor_pays || null} onChange={async (url) => { if (!instructorId) return; try { const { error } = await supabase.from("instructors").update({ payment_qr_url_instructor_pays: url }).eq("id", instructorId); if (error) throw error; setProfile(prev => prev ? { ...prev, payment_qr_url_instructor_pays: url } : null); toast({ title: "Instructor pays QR updated" }); } catch { toast({ title: "Error", variant: "destructive" }); } }} bucket="instructor-images" folder={instructorId} label="" />
                    </div>
                  </div>
                </div>
              </div>
            </SettingsTile>
            <SettingsTile id="square-connect" icon={CreditCard} title="Square Account" description="Connect for automatic payouts" iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" iconSrc={squareLogo} statusBadge={(profile as any)?.square_merchant_id ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Connected</Badge> : null}>
              <SquareConnectSettings instructorId={instructorId} squareMerchantId={(profile as any)?.square_merchant_id} squareConnectedAt={(profile as any)?.square_connected_at} onUpdate={() => refreshInstructor()} />
            </SettingsTile>
            <SettingsTile id="referrals" icon={Gift} title="Referral Programme" description="Configure pupil referral rewards" iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30">
              <ReferralSettingsCard instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="bnpl" icon={CreditCard} title="Buy Now, Pay Later" description="Klarna & Clearpay on your mini-website" iconColor="text-pink-600" iconBg="bg-pink-100 dark:bg-pink-900/30">
              <PaymentOptionsSettings instructorId={instructorId} compact />
            </SettingsTile>
            <SettingsTile id="discount-codes" icon={Tag} title="Discount Codes" description="Create promo codes for pupils" iconColor="text-orange-600" iconBg="bg-orange-100 dark:bg-orange-900/30">
              <InstructorDiscountCodesManager instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="lesson-packages" icon={BookOpen} title="Lesson Packages" description="Pre-paid block booking packages" iconColor="text-violet-600" iconBg="bg-violet-100 dark:bg-violet-900/30">
              <LessonPackageManager instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="intake-questions" icon={ClipboardList} title="Intake Questions" description="Custom questions on booking forms" iconColor="text-cyan-600" iconBg="bg-cyan-100 dark:bg-cyan-900/30">
              <IntakeQuestionsSettings instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="pricing-rules" icon={PoundSterling} title="Price Adjustment Rules" description="Dynamic pricing by time, day & zone" iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30">
              <PricingRulesSettings instructorId={instructorId} />
            </SettingsTile>
          </div>
        );

      case "website":
        return (
          <div className="space-y-3">
            <SettingsTile id="mini-website" icon={Globe} title="Share Link" description="Share your instructor profile" iconColor="text-cyan-600" iconBg="bg-cyan-100 dark:bg-cyan-900/30">
              <MiniWebsiteShare instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="website-pages" icon={Layout} title="Website Pages" description="Edit your 5-page mini-website" iconColor="text-indigo-600" iconBg="bg-indigo-100 dark:bg-indigo-900/30">
              {authInstructor?.app_slug ? (
                <MiniWebsiteCMS instructorId={instructorId} instructorSlug={authInstructor.app_slug} />
              ) : (
                <p className="text-sm text-muted-foreground">Your website URL is being set up. Please refresh in a moment.</p>
              )}
            </SettingsTile>
            <SettingsTile id="website-theme" icon={Sparkles} title="Website Theme" description="Colors, fonts & style presets" iconColor="text-pink-600" iconBg="bg-pink-100 dark:bg-pink-900/30">
              <MiniWebsiteThemeEditor instructorId={instructorId} currentSettings={{ website_theme: authInstructor?.website_theme, website_font: authInstructor?.website_font, website_header_style: authInstructor?.website_header_style, brand_colour: authInstructor?.brand_colour, secondary_colour: authInstructor?.secondary_colour, website_button_color: authInstructor?.website_button_color, website_footer_bg: authInstructor?.website_footer_bg, logo_url: authInstructor?.logo_url, phone: authInstructor?.phone, email: authInstructor?.email }} onUpdate={refreshInstructor} />
            </SettingsTile>
            <SettingsTile id="branding" icon={Palette} title="Pupil App Branding" description="Customise your pupil portal look" iconColor="text-rose-600" iconBg="bg-rose-100 dark:bg-rose-900/30">
              <PupilAppBrandingEditor instructorId={instructorId} />
            </SettingsTile>
          </div>
        );

      case "scheduling":
        return (
          <div className="space-y-3">
            <SettingsTile id="pupil-self-service" icon={CalendarClock} title="Pupil Self-Service Booking" description="Let pupils book, cancel & reschedule" iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30">
              <PupilBookingSettingsEditor instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="working-hours" icon={Clock} title="Working Hours" description="Set your availability" iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-900/20">
              <WorkingHoursEditor instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="calendar" icon={Calendar} title="Calendar Sync" description="Sync lessons to your calendar" iconColor="text-sky-600" iconBg="bg-sky-100 dark:bg-sky-900/30">
              <GoogleServiceAccountSetup instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="cancellation" icon={FileText} title="Cancellation Policy" description="Set notice period & charges" iconColor="text-slate-600" iconBg="bg-slate-100 dark:bg-slate-900/30">
              <CancellationPolicyEditor instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="no-show-policy" icon={AlertTriangle} title="No-Show Policy" description="Set fees for no-shows & late cancellations" iconColor="text-red-600" iconBg="bg-red-100 dark:bg-red-900/30">
              <NoShowPolicySettings instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="reminders" icon={Bell} title="Lesson Reminders" description="Automatic pupil reminders before lessons" iconColor="text-sky-600" iconBg="bg-sky-100 dark:bg-sky-900/30">
              <ReminderSettings instructorId={instructorId} />
            </SettingsTile>
          </div>
        );

      case "tracking":
        return (
          <div className="space-y-3">
            <SettingsTile id="gps-mobile" icon={Satellite} title="Mobile GPS Tracking" description="Link your Every Driver GPS Gate account" iconColor="text-cyan-600" iconBg="bg-cyan-100 dark:bg-cyan-900/30">
              <InstructorDetailsEditor instructorId={instructorId} defaultTab="gps" />
            </SettingsTile>
            <SettingsTile id="routes" icon={Route} title="Saved Routes" description="View and manage your recorded driving routes" iconColor="text-fuchsia-600" iconBg="bg-fuchsia-100 dark:bg-fuchsia-900/30">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Access your saved lesson routes, test routes, and driving test recordings. View route analytics and manage your route library.</p>
                <Button onClick={() => navigate('/instructor/routes')} className="w-full justify-between">
                  <span className="flex items-center gap-2"><Route className="h-4 w-4" />Manage Routes</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </SettingsTile>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-3">
            <SettingsTile id="demo-mode" icon={Eye} title="Demo Mode" description="Preview the app with sample data" iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30">
              <DemoModeToggle />
            </SettingsTile>
            <SettingsTile id="appearance" icon={Paintbrush} title="Appearance" description="Layout, hero image & wallpaper" iconColor="text-pink-600" iconBg="bg-pink-100 dark:bg-pink-900/30">
              <AppearanceSettings instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="dashboard-layout" icon={LayoutGrid} title="Dashboard Layout" description="Customize your home screen tiles" iconColor="text-indigo-600" iconBg="bg-indigo-100 dark:bg-indigo-900/30">
              <DashboardLayoutManager instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="notifications" icon={Bell} title="Push Notifications" description="Manage notification preferences" iconColor="text-yellow-600" iconBg="bg-yellow-100 dark:bg-yellow-900/30">
              <PushNotificationSettings instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="gdpr" icon={Shield} title="GDPR Data Retention" description="Auto-flag stale pupil records" iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30">
              <GDPRRetentionWidget instructorId={instructorId} />
            </SettingsTile>
            <SettingsTile id="data-backup" icon={Database} title="Data Export & Backup" description="Download your data for backup" iconColor="text-zinc-600" iconBg="bg-zinc-100 dark:bg-zinc-900/30">
              <DataExportManager instructorId={instructorId} instructorName={profile?.name} />
            </SettingsTile>
            <SettingsTile id="reset-stats" icon={Trash2} title="Reset Statistics" description="Clear lesson history, payments, or progress" iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-900/20">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Reset your statistics if you need to start fresh. This action is permanent and cannot be undone.</p>
                <ResetStatsDialog instructorId={instructorId} instructorName={profile?.name} />
              </div>
            </SettingsTile>
          </div>
        );

      default:
        return <p className="text-muted-foreground text-center py-8">Category not found</p>;
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* iOS-style back header */}
        <div className="flex items-center gap-2 px-1">
          <button onClick={() => navigate(basePath.replace(/\/[^/]+$/, ""))} className="flex items-center gap-0.5 text-primary text-[15px] font-normal">
            <ChevronLeft className="h-5 w-5" />
            Settings
          </button>
        </div>
        <div className="px-1">
          <h1 className="text-[34px] font-bold text-foreground leading-tight tracking-tight">{title}</h1>
        </div>
        {renderCategoryContent()}
      </div>
    </InstructorPortalLayout>
  );
}
