import { useState, useEffect, useRef } from "react";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight, ChevronDown, Globe, Layout, Sparkles, Car, QrCode, ImageIcon, Video, ImagePlus, Award, Database, FileSignature, Banknote, Shield, CalendarClock, BookOpen, MapPin, Trash2, Navigation, ExternalLink, Route, GraduationCap, LayoutGrid, Satellite, AlertTriangle, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CMSImageUpload } from "@/components/admin/CMSImageUpload";
import { BulkSMSDialog } from "@/components/instructor/BulkSMSDialog";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { NoShowPolicySettings } from "@/components/instructor/NoShowPolicySettings";
import { ReferralSettingsCard } from "@/components/instructor/ReferralSettingsCard";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { CalendarConnect } from "@/components/instructor/CalendarConnect";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { DataExportManager } from "@/components/instructor/DataExportManager";
import { MiniWebsiteShare } from "@/components/instructor/MiniWebsiteShare";
import { MiniWebsiteCMS } from "@/components/instructor/MiniWebsiteCMS";
import { MiniWebsiteThemeEditor } from "@/components/instructor/MiniWebsiteThemeEditor";
import { TermsConditionsEditor } from "@/components/instructor/TermsConditionsEditor";
import { DepositSettingsEditor } from "@/components/instructor/DepositSettingsEditor";
import { BookingModeSelector } from "@/components/instructor/BookingModeSelector";
import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";
import { InstructorCoursesManager } from "@/components/instructor/InstructorCoursesManager";
import { TestCentresAndExaminersManager } from "@/components/instructor/TestCentresAndExaminersManager";
import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";
import { ResetStatsDialog } from "@/components/instructor/ResetStatsDialog";
import { DashboardLayoutManager } from "@/components/instructor/DashboardLayoutManager";
import { SyllabusBuilder } from "@/components/instructor/SyllabusBuilder";
import { TrainingResources } from "@/components/instructor/TrainingResources";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  { id: "profile", title: "Profile", icon: User, iconColor: "text-blue-600", iconBg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "courses", title: "Courses", icon: BookOpen, iconColor: "text-emerald-600", iconBg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "website", title: "Website", icon: Globe, iconColor: "text-cyan-600", iconBg: "bg-cyan-100 dark:bg-cyan-900/30" },
  { id: "scheduling", title: "Schedule", icon: Clock, iconColor: "text-sky-600", iconBg: "bg-sky-100 dark:bg-sky-900/30" },
  { id: "tracking", title: "Tracking", icon: Navigation, iconColor: "text-amber-600", iconBg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "preferences", title: "Preferences", icon: Settings, iconColor: "text-gray-600", iconBg: "bg-gray-100 dark:bg-gray-900/30" },
];

export default function InstructorSettings() {
  const navigate = useNavigate();
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(["profile"]);
  const [openCategories, setOpenCategories] = useState<string[]>(["profile"]);
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
        .select("name, email, phone, bio, profile_image_url, car_image_url, payment_qr_url, payment_qr_url_pupil_pays, payment_qr_url_instructor_pays, commission_payer, welcome_video_url, hero_image_url, adi_certificate_url, is_active")
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

  // Settings tile component for uniform appearance with colored icons
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
    <Card className="overflow-hidden">
      <Collapsible open={isOpen(id)} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-0">
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div className="text-left">
                  <div className="font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground">{description}</div>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isOpen(id) && "rotate-90"
              )} />
            </button>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-4 relative z-10">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  // Category header component
  const CategoryHeader = ({ category }: { category: SettingsCategory }) => (
    <button
      onClick={() => toggleCategory(category.id)}
      className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
      style={{ backgroundColor: '#D1E4FC' }}
    >
      <div className="flex items-center gap-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", category.iconBg)}>
          <category.icon className={cn("h-4 w-4", category.iconColor)} />
        </div>
        <span className="font-semibold text-sm">{category.title}</span>
      </div>
      <ChevronDown className={cn(
        "h-4 w-4 text-muted-foreground transition-transform duration-200",
        isCategoryOpen(category.id) && "rotate-180"
      )} />
    </button>
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
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        {/* Quick Jump Navigation */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {settingsCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  selectedCategory === category.id
                    ? "bg-blue-100 text-blue-700 border-blue-300 font-semibold dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                    : "bg-transparent text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <category.icon className="h-3.5 w-3.5" />
                {category.title}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Profile & Identity Category */}
        <div ref={el => categoryRefs.current["profile"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[0]} />
          <Collapsible open={isCategoryOpen("profile")}>
            <CollapsibleContent className="space-y-3 pt-1">
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

              {/* Compliance Tracking Section */}
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Courses & Pricing Category */}
        <div ref={el => categoryRefs.current["courses"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[1]} />
          <Collapsible open={isCategoryOpen("courses")}>
            <CollapsibleContent className="space-y-3 pt-1">
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

              {/* Visibility Section */}
              <SettingsTile 
                id="visibility" 
                icon={Eye} 
                title="Visibility" 
                description="Control website listing"
                iconColor="text-violet-600"
                iconBg="bg-violet-100 dark:bg-violet-900/30"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="visibility-toggle" className="text-sm font-medium">
                        Listed on website
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Your courses will appear in search results
                      </p>
                    </div>
                    <Switch
                      id="visibility-toggle"
                      checked={profile?.is_active ?? true}
                      onCheckedChange={handleVisibilityToggle}
                    />
                  </div>
                  {profile && !profile.is_active && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        You're currently hidden from the website.
                      </p>
                    </div>
                  )}
                </div>
              </SettingsTile>

              {/* Payment Summary Section */}
              <SettingsTile 
                id="payments" 
                icon={PoundSterling} 
                title="Payment Summary" 
                description="Monthly earnings & outstanding"
                iconColor="text-green-600"
                iconBg="bg-green-100 dark:bg-green-900/30"
              >
                <PaymentSummaryWidget 
                  instructorId={instructorId} 
                  instructorName={profile?.name}
                  compact={false}
                />
              </SettingsTile>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Mini-Website Category */}
        <div ref={el => categoryRefs.current["website"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[2]} />
          <Collapsible open={isCategoryOpen("website")}>
            <CollapsibleContent className="space-y-3 pt-1">
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Scheduling & Availability Category */}
        <div ref={el => categoryRefs.current["scheduling"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[3]} />
          <Collapsible open={isCategoryOpen("scheduling")}>
            <CollapsibleContent className="space-y-3 pt-1">
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
                <CalendarConnect instructorId={instructorId} />
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Tracking & Routes Category */}
        <div ref={el => categoryRefs.current["tracking"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[4]} />
          <Collapsible open={isCategoryOpen("tracking")}>
            <CollapsibleContent className="space-y-3 pt-1">
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

              {/* Hardware GPS Tracking Section */}
              <SettingsTile 
                id="traccar" 
                icon={Navigation} 
                title="Vehicle GPS Device" 
                description="OBD-II hardware tracker setup"
                iconColor="text-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use the ST-902L OBD-II tracker for reliable GPS tracking during lessons. 
                    Plugs directly into your vehicle's diagnostic port.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => navigate('/instructor/settings/traccar')}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Device Setup
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/instructor/traccar')}
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Start Tracking Session
                      </span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

              {/* Test Centres & Examiners Section */}
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Preferences & Data Category */}
        <div ref={el => categoryRefs.current["preferences"] = el} className="space-y-3">
          <CategoryHeader category={settingsCategories[5]} />
          <Collapsible open={isCategoryOpen("preferences")}>
            <CollapsibleContent className="space-y-3 pt-1">
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

              {/* Terms & Conditions Section */}
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

              {/* Bulk SMS Section */}
              <SettingsTile 
                id="bulk-sms" 
                icon={Bell} 
                title="Bulk Messaging" 
                description="Send SMS to all pupils"
                iconColor="text-orange-500"
                iconBg="bg-orange-50 dark:bg-orange-900/20"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Send announcements, holiday notices, or reminders to multiple pupils at once.
                  </p>
                  <BulkSMSDialog instructorId={instructorId} />
                </div>
              </SettingsTile>

              {/* Referral Programme */}
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

              {/* Pupil App Branding Section */}
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

              {/* Images Section */}
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

                  {/* Commission Payer Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Payment QR Codes</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Choose who pays the £1 card payment commission, then upload the matching QR code
                    </p>
                    
                    {/* Commission payer selector */}
                    <div className="flex gap-2">
                      <Button
                        variant={profile?.commission_payer !== 'instructor' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          if (!instructorId) return;
                          try {
                            const { error } = await supabase
                              .from("instructors")
                              .update({ commission_payer: 'pupil' })
                              .eq("id", instructorId);
                            if (error) throw error;
                            setProfile(prev => prev ? { ...prev, commission_payer: 'pupil' } : null);
                            toast({ title: "Commission payer updated to Pupil" });
                          } catch {
                            toast({ title: "Error", variant: "destructive" });
                          }
                        }}
                      >
                        Pupil Pays
                      </Button>
                      <Button
                        variant={profile?.commission_payer === 'instructor' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          if (!instructorId) return;
                          try {
                            const { error } = await supabase
                              .from("instructors")
                              .update({ commission_payer: 'instructor' })
                              .eq("id", instructorId);
                            if (error) throw error;
                            setProfile(prev => prev ? { ...prev, commission_payer: 'instructor' } : null);
                            toast({ title: "Commission payer updated to Instructor" });
                          } catch {
                            toast({ title: "Error", variant: "destructive" });
                          }
                        }}
                      >
                        Instructor Pays
                      </Button>
                    </div>

                    {/* Dual QR uploads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                              const { error } = await supabase
                                .from("instructors")
                                .update({ payment_qr_url_pupil_pays: url })
                                .eq("id", instructorId);
                              if (error) throw error;
                              setProfile(prev => prev ? { ...prev, payment_qr_url_pupil_pays: url } : null);
                              toast({ title: "Pupil pays QR updated" });
                            } catch {
                              toast({ title: "Error", variant: "destructive" });
                            }
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
                              const { error } = await supabase
                                .from("instructors")
                                .update({ payment_qr_url_instructor_pays: url })
                                .eq("id", instructorId);
                              if (error) throw error;
                              setProfile(prev => prev ? { ...prev, payment_qr_url_instructor_pays: url } : null);
                              toast({ title: "Instructor pays QR updated" });
                            } catch {
                              toast({ title: "Error", variant: "destructive" });
                            }
                          }}
                          bucket="instructor-images"
                          folder={instructorId}
                          label=""
                        />
                      </div>
                    </div>
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
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </InstructorPortalLayout>
  );
}
