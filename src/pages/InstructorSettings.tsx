import { useState, useEffect } from "react";
import { User, Clock, Bell, FileText, Camera, Loader2, Settings, Palette, Eye, Calendar, PoundSterling, ChevronRight } from "lucide-react";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { GoogleCalendarConnect } from "@/components/instructor/GoogleCalendarConnect";
import { PaymentSummaryWidget } from "@/components/instructor/PaymentSummaryWidget";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";
import { cn } from "@/lib/utils";

const MOCK_INSTRUCTOR_ID = "123e4567-e89b-12d3-a456-426614174000";

interface InstructorProfile {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_active: boolean;
}

export default function InstructorSettings() {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();
  const { profile: headerProfile } = useInstructorProfile(MOCK_INSTRUCTOR_ID);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, email, phone, bio, profile_image_url, is_active")
        .eq("id", MOCK_INSTRUCTOR_ID)
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
    if (!profile) return;
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
        .eq("id", MOCK_INSTRUCTOR_ID);

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
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${MOCK_INSTRUCTOR_ID}/profile.${fileExt}`;

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
        .eq("id", MOCK_INSTRUCTOR_ID);

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
    if (!profile) return;
    
    // Optimistic update
    setProfile({ ...profile, is_active: isVisible });
    
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", MOCK_INSTRUCTOR_ID);

      if (error) throw error;
      
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

  const [openSections, setOpenSections] = useState<string[]>([]);

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

  const content = (
    <div className={`min-h-screen bg-background ${isMobile ? "pb-20" : ""}`}>
      {/* Page Title */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="p-4 space-y-3">
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
            instructorId={MOCK_INSTRUCTOR_ID} 
            instructorName={profile?.name}
            compact={false}
          />
        </SettingsTile>

        {/* Google Calendar Sync Section */}
        <SettingsTile 
          id="calendar" 
          icon={Calendar} 
          title="Google Calendar Sync" 
          description="Sync lessons to your calendar"
        >
          <GoogleCalendarConnect instructorId={MOCK_INSTRUCTOR_ID} />
        </SettingsTile>

        {/* Push Notifications Section */}
        <SettingsTile 
          id="notifications" 
          icon={Bell} 
          title="Push Notifications" 
          description="Manage notification preferences"
        >
          <PushNotificationSettings instructorId={MOCK_INSTRUCTOR_ID} />
        </SettingsTile>

        {/* Cancellation Policy Section */}
        <SettingsTile 
          id="cancellation" 
          icon={FileText} 
          title="Cancellation Policy" 
          description="Set notice period & charges"
        >
          <CancellationPolicyEditor instructorId={MOCK_INSTRUCTOR_ID} />
        </SettingsTile>

        {/* Working Hours Section */}
        <SettingsTile 
          id="working-hours" 
          icon={Clock} 
          title="Working Hours" 
          description="Set your availability"
        >
          <WorkingHoursEditor instructorId={MOCK_INSTRUCTOR_ID} />
        </SettingsTile>

        {/* Pupil App Branding Section */}
        <SettingsTile 
          id="branding" 
          icon={Palette} 
          title="Pupil App Branding" 
          description="Customise your pupil portal"
        >
          <PupilAppBrandingEditor instructorId={MOCK_INSTRUCTOR_ID} />
        </SettingsTile>
      </div>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <InstructorMobileHeader 
          instructorName={headerProfile?.name} 
          profileImageUrl={headerProfile?.profile_image_url}
        />
        {content}
        <InstructorBottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <MainLayout>
      {content}
    </MainLayout>
  );
}
