import { useState, useEffect, useRef } from "react";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight, ChevronDown, Globe, Layout, Sparkles, Car, QrCode, ImageIcon, Video, ImagePlus, Award, Database, FileSignature, Banknote, Shield, CalendarClock, BookOpen, MapPin, Trash2, Navigation, ExternalLink, Route, GraduationCap, LayoutGrid, Satellite, AlertTriangle, Gift, CreditCard, Paintbrush, Tag, ClipboardList, ToggleLeft, Mic, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { PaymentOptionsSettings } from "@/components/instructor/PaymentOptionsSettings";
import { LessonPackageManager } from "@/components/instructor/LessonPackageManager";
import { IntakeQuestionsSettings } from "@/components/instructor/IntakeQuestionsSettings";
import { PricingRulesSettings } from "@/components/instructor/PricingRulesSettings";
import { FeatureTogglesSettings } from "@/components/instructor/FeatureTogglesSettings";
import { GDPRRetentionWidget } from "@/components/instructor/GDPRRetentionWidget";



import { ReminderSettings } from "@/components/instructor/ReminderSettings";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
// Card import removed — using inline InstructorCard-style tiles
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";

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

interface SettingsCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const settingsCategories: SettingsCategory[] = [
  { id: "profile", title: "Profile & Identity", icon: User, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "teaching", title: "Compliance & Teaching", icon: GraduationCap, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "courses", title: "Courses & Payments", icon: BookOpen, iconColor: "text-green-600", iconBg: "bg-green-100 dark:bg-green-900/30" },
  { id: "website", title: "Website & Branding", icon: Globe, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30" },
  { id: "scheduling", title: "Scheduling", icon: Clock, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30" },
  { id: "tracking", title: "Tracking & Routes", icon: Navigation, iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "preferences", title: "Preferences & Data", icon: Settings, iconColor: "text-gray-600", iconBg: "bg-gray-100 dark:bg-gray-900/30" },
];

export default function InstructorSettings() {
  const navigate = useNavigate();
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>(["profile"]);
  const [heyEdEnabled, setHeyEdEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`hey-ed-always-listen-${instructorId}`) === "true";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("profile");
  
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (instructorId) {
      fetchProfile();
    }
  }, [instructorId]);

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
        .update({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
        })
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

      const { error: uploadError } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("instructors")
        .update({ profile_image_url: publicUrl })
        .eq("id", instructorId);

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

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!profile || !instructorId) return;
    
    setProfile({ ...profile, is_active: isVisible });
    
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
          : "You won't appear in course searches but can still use all features"
      });
    } catch (error) {
      setProfile({ ...profile, is_active: !isVisible });
      console.error("Error updating visibility:", error);
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Open the category if it's closed
    if (!openCategories.includes(categoryId)) {
      setOpenCategories(prev => [...prev, categoryId]);
    }
    // Scroll to the category
    setTimeout(() => {
      categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const isOpen = (section: string) => openSections.includes(section);
  const isCategoryOpen = (categoryId: string) => openCategories.includes(categoryId);

  // Settings tile component — iOS grouped-list style with white cards
  const SettingsTile = ({ 
    id, 
    icon: Icon, 
    title, 
    description, 
    iconColor = "text-primary",
    iconBg = "bg-primary/10",
    children 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    iconColor?: string;
    iconBg?: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm overflow-hidden">
      <Collapsible open={isOpen(id)} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <div className="p-0">
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground/40 transition-transform duration-200",
                isOpen(id) && "rotate-90"
              )} />
            </button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border/30 pt-4">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  // Category header component — iOS uppercase grey label
  const CategoryHeader = ({ category }: { category: SettingsCategory }) => (
    <div className="px-4 pb-0.5">
      <span className="text-[13px] font-normal text-muted-foreground uppercase">{category.title}</span>
    </div>
  );

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
        <InstructorPageHeader
          lucideIcon={Settings}
          title="Settings"
          subtitle="Manage your profile and preferences"
        />

        {/* Quick Jump Navigation — iOS card style */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => scrollToCategory(e.target.value)}
            className="w-full appearance-none rounded-2xl bg-white dark:bg-[#1C1C1E] px-4 py-2.5 pr-10 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {settingsCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Visibility & Toggles Section — iOS grouped card */}
        <div>
          <div className="px-4 pb-1.5">
            <span className="text-[13px] font-normal text-muted-foreground uppercase">Visibility & Toggles</span>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm overflow-hidden">
            {/* Visibility toggle row */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Listed on Website</p>
                  <p className="text-xs text-muted-foreground">Appear in course searches</p>
                </div>
              </div>
              <Switch
                checked={profile?.is_active ?? true}
                onCheckedChange={handleVisibilityToggle}
              />
            </div>
            <div className="ml-[56px] border-b border-border/40" />
            {/* Hey ED always-listening toggle */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Mic className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">"Hey ED" Always Listening</p>
                  <p className="text-xs text-muted-foreground">Activate ED hands-free by saying "Hey ED"</p>
                </div>
              </div>
              <Switch
                checked={heyEdEnabled}
                onCheckedChange={(checked) => {
                  setHeyEdEnabled(checked);
                  localStorage.setItem(`hey-ed-always-listen-${instructorId}`, String(checked));
                  toast({
                    title: checked ? '"Hey ED" enabled' : '"Hey ED" disabled',
                    description: checked
                      ? "ED will listen for your voice in the background"
                      : "Tap the Ask ED button to activate",
                  });
                }}
              />
            </div>
            {/* Feature toggles */}
            <div className="px-3">
              <FeatureTogglesSettings instructorId={instructorId} />
            </div>
          </div>
          {profile && !profile.is_active && (
            <div className="mt-2 mx-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You're currently hidden from the website.
              </p>
            </div>
          )}
        </div>

        {/* Profile & Identity Category */}
        <div ref={el => categoryRefs.current["profile"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[0]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Profile Section */}
              <SettingsTile 
                id="profile" 
                icon={User} 
                title="Profile" 
                description="Your public instructor profile"
                iconColor="text-blue-600"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
              >
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.profile_image_url || undefined} />
                        <AvatarFallback className="text-xl">
                          {profile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild disabled={uploading}>
                            <span>
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Camera className="h-4 w-4 mr-2" />
                              )}
                              Change Photo
                            </span>
                          </Button>
                        </Label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm">Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email || ""}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bio" className="text-sm">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ""}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                        placeholder="Tell pupils about yourself..."
                      />
                    </div>

                    <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Profile
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Profile not found</p>
                )}
              </SettingsTile>

              {/* Vehicle & Details Section */}
              <SettingsTile 
                id="details" 
                icon={Car} 
                title="Vehicle & Qualifications" 
                description="Car details, skills & social links"
                iconColor="text-orange-600"
                iconBg="bg-orange-100 dark:bg-orange-900/30"
              >
                <InstructorDetailsEditor instructorId={instructorId} />
              </SettingsTile>

              {/* Images & Media Section (moved from Preferences) */}
              <SettingsTile 
                id="images" 
                icon={ImageIcon} 
                title="Images & Media" 
                description="Car photo, QR code & video"
                iconColor="text-purple-600"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
              >
                <div className="space-y-6">
                  {/* Hero/Banner Image */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Banner Image</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Hero image for your mini-website header
                    </p>
                    <CMSImageUpload
                      value={profile?.hero_image_url || null}
                      onChange={async (url) => {
                        if (!instructorId) return;
                        try {
                          const { error } = await supabase
                            .from("instructors")
                            .update({ hero_image_url: url })
                            .eq("id", instructorId);
                          if (error) throw error;
                          setProfile(prev => prev ? { ...prev, hero_image_url: url } : null);
                          toast({ title: "Banner image updated" });
                        } catch (error) {
                          console.error("Error updating banner image:", error);
                          toast({ title: "Error", description: "Failed to update banner image", variant: "destructive" });
                        }
                      }}
                      bucket="instructor-images"
                      folder={instructorId}
                      label=""
                    />
                  </div>

                  {/* Car Image */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Car Photo</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Show pupils what car they'll be learning in
                    </p>
                    <CMSImageUpload
                      value={profile?.car_image_url || null}
                      onChange={async (url) => {
                        if (!instructorId) return;
                        try {
                          const { error } = await supabase
                            .from("instructors")
                            .update({ car_image_url: url })
                            .eq("id", instructorId);
                          if (error) throw error;
                          setProfile(prev => prev ? { ...prev, car_image_url: url } : null);
                          toast({ title: "Car photo updated" });
                        } catch (error) {
                          console.error("Error updating car image:", error);
                          toast({ title: "Error", description: "Failed to update car photo", variant: "destructive" });
                        }
                      }}
                      bucket="instructor-images"
                      folder={instructorId}
                      label=""
                    />
                  </div>

                  {/* Welcome Video URL */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Welcome Video URL</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Link to a YouTube or Vimeo introduction video
                    </p>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={profile?.welcome_video_url || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, welcome_video_url: e.target.value } : null)}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        if (!instructorId || !profile) return;
                        try {
                          const { error } = await supabase
                            .from("instructors")
                            .update({ welcome_video_url: profile.welcome_video_url })
                            .eq("id", instructorId);
                          if (error) throw error;
                          toast({ title: "Video URL saved" });
                        } catch (error) {
                          console.error("Error updating video URL:", error);
                          toast({ title: "Error", description: "Failed to save video URL", variant: "destructive" });
                        }
                      }}
                    >
                      Save Video URL
                    </Button>
                  </div>

                  {/* ADI Certificate */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">ADI Certificate</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload your ADI certificate for verification
                    </p>
                    <CMSImageUpload
                      value={profile?.adi_certificate_url || null}
                      onChange={async (url) => {
                        if (!instructorId) return;
                        try {
                          const { error } = await supabase
                            .from("instructors")
                            .update({ adi_certificate_url: url })
                            .eq("id", instructorId);
                          if (error) throw error;
                          setProfile(prev => prev ? { ...prev, adi_certificate_url: url } : null);
                          toast({ title: "Certificate uploaded" });
                        } catch (error) {
                          console.error("Error updating certificate:", error);
                          toast({ title: "Error", description: "Failed to upload certificate", variant: "destructive" });
                        }
                      }}
                      bucket="instructor-images"
                      folder={instructorId}
                      label=""
                    />
                  </div>
                </div>
              </SettingsTile>

          </div>
        </div>

        {/* Compliance & Teaching Category */}
        <div ref={el => categoryRefs.current["teaching"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[1]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Compliance Tracking Section (moved from Profile) */}
              <SettingsTile 
                id="compliance" 
                icon={Shield} 
                title="Compliance & CPD" 
                description="Track ADI badge, insurance, MOT & CPD hours"
                iconColor="text-emerald-500"
                iconBg="bg-emerald-50 dark:bg-emerald-900/20"
              >
                <ComplianceTracker instructorId={instructorId} />
              </SettingsTile>

              {/* Test Centres & Examiners (moved from Tracking) */}
              <SettingsTile 
                id="test-centres" 
                icon={MapPin} 
                title="Test Centres & Examiners" 
                description="Manage test centres and examiners for routes & triggers"
                iconColor="text-red-600"
                iconBg="bg-red-100 dark:bg-red-900/30"
              >
                <TestCentresAndExaminersManager instructorId={instructorId} />
              </SettingsTile>

              {/* Terms & Conditions (moved from Preferences) */}
              <SettingsTile 
                id="terms" 
                icon={FileSignature} 
                title="Terms & Conditions" 
                description="Create terms for pupils to sign"
                iconColor="text-stone-600"
                iconBg="bg-stone-100 dark:bg-stone-900/30"
              >
                <TermsConditionsEditor instructorId={instructorId} />
              </SettingsTile>
          </div>
        </div>

        {/* Courses & Payments Category */}
        <div ref={el => categoryRefs.current["courses"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[2]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Courses Section */}
              <SettingsTile 
                id="courses" 
                icon={BookOpen} 
                title="My Courses" 
                description="Manage your course offerings & pricing"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              >
                <InstructorCoursesManager instructorId={instructorId} />
              </SettingsTile>

              {/* Booking Mode Section */}
              <SettingsTile 
                id="booking-mode" 
                icon={CalendarClock} 
                title="Booking Mode" 
                description="How pupils book lessons"
                iconColor="text-teal-600"
                iconBg="bg-teal-100 dark:bg-teal-900/30"
              >
                <BookingModeSelector 
                  instructorId={instructorId} 
                  currentMode={authInstructor?.booking_mode || 'pupil_choice'}
                />
              </SettingsTile>

              {/* Deposit Settings Section */}
              <SettingsTile 
                id="deposits" 
                icon={Banknote} 
                title="Deposit Payments" 
                description="Accept deposits on bookings"
                iconColor="text-lime-600"
                iconBg="bg-lime-100 dark:bg-lime-900/30"
              >
                <DepositSettingsEditor instructorId={instructorId} />
              </SettingsTile>

              {/* Card Commission & QR Codes */}
              <SettingsTile 
                id="commission" 
                icon={CreditCard} 
                title="Card Commission & QR Codes" 
                description="Who pays the fee + upload QR codes"
                iconColor="text-violet-600"
                iconBg="bg-violet-100 dark:bg-violet-900/30"
              >
                <div className="space-y-6">
                  <CommissionPayerSettings 
                    instructorId={instructorId} 
                    initialPayer={profile?.commission_payer}
                    initialSplitPercent={(profile as any)?.commission_split_percent}
                  />
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Payment QR Codes</Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer !== 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                        <Label className="text-xs font-medium">Pupil Pays Commission QR</Label>
                        {profile?.commission_payer !== 'instructor' && (
                          <span className="text-[10px] text-primary font-semibold ml-1">ACTIVE</span>
                        )}
                        <CMSImageUpload
                          value={profile?.payment_qr_url_pupil_pays || null}
                          onChange={async (url) => {
                            if (!instructorId) return;
                            try {
                              const { error } = await supabase.from("instructors").update({ payment_qr_url_pupil_pays: url }).eq("id", instructorId);
                              if (error) throw error;
                              setProfile(prev => prev ? { ...prev, payment_qr_url_pupil_pays: url } : null);
                              toast({ title: "Pupil pays QR updated" });
                            } catch { toast({ title: "Error", variant: "destructive" }); }
                          }}
                          bucket="instructor-images"
                          folder={instructorId}
                          label=""
                        />
                      </div>
                      <div className={`space-y-2 rounded-lg border p-3 ${profile?.commission_payer === 'instructor' ? 'ring-2 ring-primary' : ''}`}>
                        <Label className="text-xs font-medium">Instructor Pays Commission QR</Label>
                        {profile?.commission_payer === 'instructor' && (
                          <span className="text-[10px] text-primary font-semibold ml-1">ACTIVE</span>
                        )}
                        <CMSImageUpload
                          value={profile?.payment_qr_url_instructor_pays || null}
                          onChange={async (url) => {
                            if (!instructorId) return;
                            try {
                              const { error } = await supabase.from("instructors").update({ payment_qr_url_instructor_pays: url }).eq("id", instructorId);
                              if (error) throw error;
                              setProfile(prev => prev ? { ...prev, payment_qr_url_instructor_pays: url } : null);
                              toast({ title: "Instructor pays QR updated" });
                            } catch { toast({ title: "Error", variant: "destructive" }); }
                          }}
                          bucket="instructor-images"
                          folder={instructorId}
                          label=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsTile>

              {/* Referral Programme (moved from Preferences) */}
              <SettingsTile 
                id="referrals" 
                icon={Gift} 
                title="Referral Programme" 
                description="Configure pupil referral rewards"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              >
                <ReferralSettingsCard instructorId={instructorId} />
              </SettingsTile>

              {/* BNPL Payment Options */}
              <SettingsTile 
                id="bnpl" 
                icon={CreditCard} 
                title="Buy Now, Pay Later" 
                description="Klarna & Clearpay on your mini-website"
                iconColor="text-pink-600"
                iconBg="bg-pink-100 dark:bg-pink-900/30"
              >
                <PaymentOptionsSettings instructorId={instructorId} compact />
              </SettingsTile>

              {/* Discount Codes */}
              <SettingsTile 
                id="discount-codes" 
                icon={Tag} 
                title="Discount Codes" 
                description="Create promo codes for pupils"
                iconColor="text-orange-600"
                iconBg="bg-orange-100 dark:bg-orange-900/30"
              >
                <InstructorDiscountCodesManager instructorId={instructorId} />
              </SettingsTile>

              {/* Lesson Packages */}
              <SettingsTile 
                id="lesson-packages" 
                icon={BookOpen} 
                title="Lesson Packages" 
                description="Pre-paid block booking packages"
                iconColor="text-violet-600"
                iconBg="bg-violet-100 dark:bg-violet-900/30"
              >
                <LessonPackageManager instructorId={instructorId} />
              </SettingsTile>

              {/* Intake Questions */}
              <SettingsTile 
                id="intake-questions" 
                icon={ClipboardList} 
                title="Intake Questions" 
                description="Custom questions on booking forms"
                iconColor="text-cyan-600"
                iconBg="bg-cyan-100 dark:bg-cyan-900/30"
              >
                <IntakeQuestionsSettings instructorId={instructorId} />
              </SettingsTile>

              {/* Pricing Rules */}
              <SettingsTile 
                id="pricing-rules" 
                icon={PoundSterling} 
                title="Price Adjustment Rules" 
                description="Dynamic pricing by time, day & zone"
                iconColor="text-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
              >
                <PricingRulesSettings instructorId={instructorId} />
              </SettingsTile>
          </div>
        </div>

        {/* Website & Branding Category */}
        <div ref={el => categoryRefs.current["website"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[3]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Mini-Website Share Section */}
              <SettingsTile 
                id="mini-website" 
                icon={Globe} 
                title="Share Link" 
                description="Share your instructor profile"
                iconColor="text-cyan-600"
                iconBg="bg-cyan-100 dark:bg-cyan-900/30"
              >
                <MiniWebsiteShare instructorId={instructorId} />
              </SettingsTile>

              {/* Mini-Website CMS Section */}
              <SettingsTile 
                id="website-pages" 
                icon={Layout} 
                title="Website Pages" 
                description="Edit your 5-page mini-website"
                iconColor="text-indigo-600"
                iconBg="bg-indigo-100 dark:bg-indigo-900/30"
              >
                {authInstructor?.app_slug ? (
                  <MiniWebsiteCMS 
                    instructorId={instructorId} 
                    instructorSlug={authInstructor.app_slug} 
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your website URL is being set up. Please refresh in a moment.
                  </p>
                )}
              </SettingsTile>

              {/* Website Theme Section */}
              <SettingsTile 
                id="website-theme" 
                icon={Sparkles} 
                title="Website Theme" 
                description="Colors, fonts & style presets"
                iconColor="text-pink-600"
                iconBg="bg-pink-100 dark:bg-pink-900/30"
              >
                <MiniWebsiteThemeEditor
                  instructorId={instructorId}
                  currentSettings={{
                    website_theme: authInstructor?.website_theme,
                    website_font: authInstructor?.website_font,
                    website_header_style: authInstructor?.website_header_style,
                    brand_colour: authInstructor?.brand_colour,
                    secondary_colour: authInstructor?.secondary_colour,
                    website_button_color: authInstructor?.website_button_color,
                    website_footer_bg: authInstructor?.website_footer_bg,
                    logo_url: authInstructor?.logo_url,
                    phone: authInstructor?.phone,
                    email: authInstructor?.email,
                  }}
                  onUpdate={refreshInstructor}
                />
              </SettingsTile>

              {/* Pupil App Branding (moved from Preferences) */}
              <SettingsTile 
                id="branding" 
                icon={Palette} 
                title="Pupil App Branding" 
                description="Customise your pupil portal"
                iconColor="text-rose-600"
                iconBg="bg-rose-100 dark:bg-rose-900/30"
              >
                <PupilAppBrandingEditor instructorId={instructorId} />
              </SettingsTile>

          </div>
        </div>

        {/* Scheduling Category */}
        <div ref={el => categoryRefs.current["scheduling"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[4]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pupil Self-Service Booking (moved from Website) */}
              <SettingsTile
                id="pupil-self-service"
                icon={CalendarClock} 
                title="Pupil Self-Service Booking" 
                description="Let pupils book, cancel & reschedule"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              >
                <PupilBookingSettingsEditor instructorId={instructorId} />
              </SettingsTile>
              {/* Working Hours Section */}
              <SettingsTile 
                id="working-hours" 
                icon={Clock} 
                title="Working Hours" 
                description="Set your availability"
                iconColor="text-blue-500"
                iconBg="bg-blue-50 dark:bg-blue-900/20"
              >
                <WorkingHoursEditor instructorId={instructorId} />
              </SettingsTile>

              {/* Calendar Sync Section */}
              <SettingsTile 
                id="calendar" 
                icon={Calendar} 
                title="Calendar Sync" 
                description="Sync lessons to your calendar"
                iconColor="text-sky-600"
                iconBg="bg-sky-100 dark:bg-sky-900/30"
              >
                <GoogleServiceAccountSetup instructorId={instructorId} />
              </SettingsTile>

              {/* Cancellation Policy Section */}
              <SettingsTile 
                id="cancellation" 
                icon={FileText} 
                title="Cancellation Policy" 
                description="Set notice period & charges"
                iconColor="text-slate-600"
                iconBg="bg-slate-100 dark:bg-slate-900/30"
              >
                <CancellationPolicyEditor instructorId={instructorId} />
              </SettingsTile>

              {/* No-Show Policy Section */}
              <SettingsTile 
                id="no-show-policy" 
                icon={AlertTriangle} 
                title="No-Show Policy" 
                description="Set fees for no-shows & late cancellations"
                iconColor="text-red-600"
                iconBg="bg-red-100 dark:bg-red-900/30"
              >
                <NoShowPolicySettings instructorId={instructorId} />
              </SettingsTile>

              {/* Lesson Reminders */}
              <SettingsTile 
                id="reminders" 
                icon={Bell} 
                title="Lesson Reminders" 
                description="Automatic pupil reminders before lessons"
                iconColor="text-sky-600"
                iconBg="bg-sky-100 dark:bg-sky-900/30"
              >
              <ReminderSettings instructorId={instructorId} />
              </SettingsTile>

          </div>
        </div>

        {/* Tracking & Routes Category */}
        <div ref={el => categoryRefs.current["tracking"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[5]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Mobile GPS Tracking Section */}
              <SettingsTile 
                id="gps-mobile" 
                icon={Satellite} 
                title="Mobile GPS Tracking" 
                description="Link your Every Driver GPS Gate account"
                iconColor="text-cyan-600"
                iconBg="bg-cyan-100 dark:bg-cyan-900/30"
              >
                <InstructorDetailsEditor instructorId={instructorId} defaultTab="gps" />
              </SettingsTile>


              {/* Saved Routes Section */}
              <SettingsTile 
                id="routes" 
                icon={Route} 
                title="Saved Routes" 
                description="View and manage your recorded driving routes"
                iconColor="text-fuchsia-600"
                iconBg="bg-fuchsia-100 dark:bg-fuchsia-900/30"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Access your saved lesson routes, test routes, and driving test recordings. 
                    View route analytics and manage your route library.
                  </p>
                  <Button 
                    onClick={() => navigate('/instructor/routes')}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Manage Routes
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </SettingsTile>
          </div>
        </div>

        {/* Preferences & Data Category */}
        <div ref={el => categoryRefs.current["preferences"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[6]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Demo Mode Section */}
              <SettingsTile
                id="demo-mode"
                icon={Eye}
                title="Demo Mode"
                description="Preview the app with sample data"
                iconColor="text-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
              >
                <DemoModeToggle />
              </SettingsTile>
              {/* Appearance Section */}
              <SettingsTile 
                id="appearance" 
                icon={Paintbrush} 
                title="Appearance" 
                description="Layout, hero image & wallpaper"
                iconColor="text-pink-600"
                iconBg="bg-pink-100 dark:bg-pink-900/30"
              >
                <AppearanceSettings instructorId={instructorId} />
              </SettingsTile>

              {/* Dashboard Layout Section */}
              <SettingsTile 
                id="dashboard-layout" 
                icon={LayoutGrid} 
                title="Dashboard Layout" 
                description="Customize your home screen tiles"
                iconColor="text-indigo-600"
                iconBg="bg-indigo-100 dark:bg-indigo-900/30"
              >
                <DashboardLayoutManager instructorId={instructorId} />
              </SettingsTile>

              {/* Push Notifications Section */}
              <SettingsTile 
                id="notifications" 
                icon={Bell} 
                title="Push Notifications" 
                description="Manage notification preferences"
                iconColor="text-yellow-600"
                iconBg="bg-yellow-100 dark:bg-yellow-900/30"
              >
                <PushNotificationSettings instructorId={instructorId} />
              </SettingsTile>

              {/* GDPR Data Retention */}
              <SettingsTile 
                id="gdpr" 
                icon={Shield} 
                title="GDPR Data Retention" 
                description="Auto-flag stale pupil records"
                iconColor="text-blue-600"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
              >
                <GDPRRetentionWidget instructorId={instructorId} />
              </SettingsTile>

              {/* Data Export & Backup Section */}
              <SettingsTile 
                id="data-backup" 
                icon={Database} 
                title="Data Export & Backup" 
                description="Download your data for backup"
                iconColor="text-zinc-600"
                iconBg="bg-zinc-100 dark:bg-zinc-900/30"
              >
                <DataExportManager 
                  instructorId={instructorId} 
                  instructorName={profile?.name}
                />
              </SettingsTile>

              {/* Reset Stats Section */}
              <SettingsTile 
                id="reset-stats" 
                icon={Trash2} 
                title="Reset Statistics" 
                description="Clear lesson history, payments, or progress"
                iconColor="text-red-500"
                iconBg="bg-red-50 dark:bg-red-900/20"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Reset your statistics if you need to start fresh. This action is permanent and cannot be undone.
                  </p>
                  <ResetStatsDialog 
                    instructorId={instructorId} 
                    instructorName={profile?.name}
                  />
                </div>
              </SettingsTile>
          </div>
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
