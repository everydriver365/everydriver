import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Clock, Bell, FileText, Camera, Upload, Loader2, Settings } from "lucide-react";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { InstructorMobileHeader } from "@/components/instructor/InstructorMobileHeader";
import { WorkingHoursEditor } from "@/components/admin/WorkingHoursEditor";
import { CancellationPolicyEditor } from "@/components/instructor/CancellationPolicyEditor";
import { PushNotificationSettings } from "@/components/instructor/PushNotificationSettings";
import { PupilAppBrandingEditor } from "@/components/instructor/PupilAppBrandingEditor";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstructorProfile } from "@/hooks/useInstructorProfile";

const MOCK_INSTRUCTOR_ID = "123e4567-e89b-12d3-a456-426614174000";

interface InstructorProfile {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
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
        .select("name, email, phone, bio, profile_image_url")
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

  const content = (
    <div className="min-h-screen bg-background pb-20">
      {/* Page Title */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile
              </CardTitle>
              <CardDescription>Your public instructor profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : profile ? (
                <>
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.profile_image_url || undefined} />
                      <AvatarFallback className="text-2xl">
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
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
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
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">Profile not found</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Working Hours Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Working Hours
              </CardTitle>
              <CardDescription>Set your availability for lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkingHoursEditor instructorId={MOCK_INSTRUCTOR_ID} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PushNotificationSettings instructorId={MOCK_INSTRUCTOR_ID} />
        </motion.div>

        {/* Cancellation Policy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CancellationPolicyEditor instructorId={MOCK_INSTRUCTOR_ID} />
        </motion.div>

        {/* Pupil App Branding Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PupilAppBrandingEditor instructorId={MOCK_INSTRUCTOR_ID} />
        </motion.div>
      </div>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <InstructorMobileHeader 
          instructorName={profile?.name} 
          profileImageUrl={profile?.profile_image_url}
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
      <InstructorBottomNav />
    </MainLayout>
  );
}
