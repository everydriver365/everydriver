import { useState, useEffect } from "react";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight, Globe, Layout, Sparkles, Car, QrCode, ImageIcon, Video, ImagePlus, Award, Database } from "lucide-react";
import { CMSImageUpload } from "@/components/admin/CMSImageUpload";
import { BulkSMSDialog } from "@/components/instructor/BulkSMSDialog";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { CalendarConnect } from "@/components/instructor/CalendarConnect";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { DataExportManager } from "@/components/instructor/DataExportManager";
import { MiniWebsiteShare } from "@/components/instructor/MiniWebsiteShare";
import { MiniWebsiteCMS } from "@/components/instructor/MiniWebsiteCMS";
import { MiniWebsiteThemeEditor } from "@/components/instructor/MiniWebsiteThemeEditor";
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
  welcome_video_url: string | null;
  hero_image_url: string | null;
  adi_certificate_url: string | null;
  is_active: boolean;
}

export default function InstructorSettings() {
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

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
        .select("name, email, phone, bio, profile_image_url, car_image_url, payment_qr_url, welcome_video_url, hero_image_url, adi_certificate_url, is_active")
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
    
    // Optimistic update
    setProfile({ ...profile, is_active: isVisible });
    
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", instructorId);

      if (error) throw error;
      
      // Refresh the auth context so all components get the updated visibility
      await refreshInstructor();
      
      toast({ 
        title: isVisible ? "Now visible" : "Hidden from website", 
        description: isVisible 
          ? "Your profile is now listed on the main website" 
          : "You won't appear in course searches but can still use all features"
      });
    } catch (error) {
      // Revert on error
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

  const isOpen = (section: string) => openSections.includes(section);

  // Settings tile component for uniform appearance
  const SettingsTile = ({ 
    id, 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    children: React.ReactNode;
  }) => (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen(id)} onOpenChange={() => toggleSection(id)}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-0">
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
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
          <div className="px-4 pb-4 border-t pt-4">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
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
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        {/* Profile Section */}
        <SettingsTile 
          id="profile" 
          icon={User} 
          title="Profile" 
          description="Your public instructor profile"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Profile Photo */}
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

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              {/* Bio */}
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

        {/* Mini-Website Share Section */}
        <SettingsTile 
          id="mini-website" 
          icon={Globe} 
          title="Mini-Website" 
          description="Share your instructor profile"
        >
          <MiniWebsiteShare instructorId={instructorId} />
        </SettingsTile>

        {/* Mini-Website CMS Section */}
        <SettingsTile 
          id="website-pages" 
          icon={Layout} 
          title="Website Pages" 
          description="Edit your 5-page mini-website"
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

        {/* Visibility Section */}
        <SettingsTile 
          id="visibility" 
          icon={Eye} 
          title="Visibility" 
          description="Control website listing"
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
        >
          <PaymentSummaryWidget 
            instructorId={instructorId} 
            instructorName={profile?.name}
            compact={false}
          />
        </SettingsTile>

        {/* Calendar Sync Section */}
        <SettingsTile 
          id="calendar" 
          icon={Calendar} 
          title="Calendar Sync" 
          description="Sync lessons to your calendar"
        >
          <CalendarConnect instructorId={instructorId} />
        </SettingsTile>

        {/* Push Notifications Section */}
        <SettingsTile 
          id="notifications" 
          icon={Bell} 
          title="Push Notifications" 
          description="Manage notification preferences"
        >
          <PushNotificationSettings instructorId={instructorId} />
        </SettingsTile>

        {/* Cancellation Policy Section */}
        <SettingsTile 
          id="cancellation" 
          icon={FileText} 
          title="Cancellation Policy" 
          description="Set notice period & charges"
        >
          <CancellationPolicyEditor instructorId={instructorId} />
        </SettingsTile>

        {/* Working Hours Section */}
        <SettingsTile 
          id="working-hours" 
          icon={Clock} 
          title="Working Hours" 
          description="Set your availability"
        >
          <WorkingHoursEditor instructorId={instructorId} />
        </SettingsTile>

        {/* Pupil App Branding Section */}
        <SettingsTile 
          id="branding" 
          icon={Palette} 
          title="Pupil App Branding" 
          description="Customise your pupil portal"
        >
          <PupilAppBrandingEditor instructorId={instructorId} />
        </SettingsTile>

        {/* Images Section */}
        <SettingsTile 
          id="images" 
          icon={ImageIcon} 
          title="Images & Media" 
          description="Car photo, QR code & video"
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

            {/* Payment QR Code */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Payment QR Code</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Pupils can scan to make quick payments
              </p>
              <CMSImageUpload
                value={profile?.payment_qr_url || null}
                onChange={async (url) => {
                  if (!instructorId) return;
                  try {
                    const { error } = await supabase
                      .from("instructors")
                      .update({ payment_qr_url: url })
                      .eq("id", instructorId);
                    if (error) throw error;
                    setProfile(prev => prev ? { ...prev, payment_qr_url: url } : null);
                    toast({ title: "Payment QR updated" });
                  } catch (error) {
                    console.error("Error updating QR code:", error);
                    toast({ title: "Error", description: "Failed to update QR code", variant: "destructive" });
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

        {/* Bulk SMS Section */}
        <SettingsTile 
          id="bulk-sms" 
          icon={Bell} 
          title="Bulk Messaging" 
          description="Send SMS to all pupils"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send announcements, holiday notices, or reminders to multiple pupils at once.
            </p>
            <BulkSMSDialog instructorId={instructorId} />
          </div>
        </SettingsTile>

        {/* Data Export & Backup Section */}
        <SettingsTile 
          id="data-backup" 
          icon={Database} 
          title="Data Export & Backup" 
          description="Download your data for backup"
        >
          <DataExportManager 
            instructorId={instructorId} 
            instructorName={profile?.name}
          />
        </SettingsTile>
      </div>
    </InstructorPortalLayout>
  );
}
