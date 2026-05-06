import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, Camera, Car as CarIcon, Video, Award, ImagePlus, User, Shield, Wallet, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast as uiToast } from "@/hooks/use-toast";
import { CMSImageUpload } from "@/components/admin/CMSImageUpload";
import { ComplianceTracker } from "@/components/instructor/ComplianceTracker";
import { InstructorDetailsEditor } from "@/components/instructor/InstructorDetailsEditor";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

interface InstructorProfileRow {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  hero_image_url: string | null;
  car_image_url: string | null;
  welcome_video_url: string | null;
  adi_certificate_url: string | null;
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "vehicle", label: "Vehicle & ADI", icon: CarIcon },
  { id: "media", label: "Media", icon: ImagePlus },
  { id: "compliance", label: "Compliance", icon: Shield },
  { id: "billing", label: "Plan & Billing", icon: Wallet },
];

export default function AccountHub() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "profile");

  const [profile, setProfile] = useState<InstructorProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, email, phone, bio, profile_image_url, hero_image_url, car_image_url, welcome_video_url, adi_certificate_url")
        .eq("id", instructorId)
        .single();
      if (!error) setProfile(data as InstructorProfileRow);
      setLoading(false);
    })();
  }, [instructorId]);

  const onTabChange = (next: string) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  const handleProfileSave = async () => {
    if (!profile || !instructorId) return;
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({ name: profile.name, email: profile.email, phone: profile.phone, bio: profile.bio })
      .eq("id", instructorId);
    setSaving(false);
    uiToast({ title: error ? "Error" : "Profile updated", variant: error ? "destructive" : undefined });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!instructorId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${instructorId}/profile.${ext}`;
      const { error: upErr } = await supabase.storage.from("instructor-images").upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("instructor-images").getPublicUrl(fileName);
      const { error: updErr } = await supabase.from("instructors").update({ profile_image_url: publicUrl }).eq("id", instructorId);
      if (updErr) throw updErr;
      setProfile(p => p ? { ...p, profile_image_url: publicUrl } : null);
      uiToast({ title: "Photo updated" });
    } catch {
      uiToast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateField = async (field: keyof InstructorProfileRow, value: string | null) => {
    if (!instructorId) return;
    const { error } = await supabase.from("instructors").update({ [field]: value }).eq("id", instructorId);
    if (!error) setProfile(p => p ? ({ ...p, [field]: value } as InstructorProfileRow) : null);
    uiToast({ title: error ? "Error" : "Saved", variant: error ? "destructive" : undefined });
  };

  if (!instructorId) return null;

  return (
    <InstructorPortalLayout>
    <div className="instructor-portal min-h-screen" style={{ background: "var(--d2-bg, #F4F7F6)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-muted-foreground">Your profile, vehicle, media, compliance & billing — all in one place.</p>
        </div>

        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full mb-6 h-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2 py-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-card rounded-2xl border p-6 space-y-4">
              {loading || !profile ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.profile_image_url || undefined} />
                      <AvatarFallback className="text-2xl">{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Label htmlFor="hub-photo" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                          <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}Change Photo</span>
                        </Button>
                      </Label>
                      <input id="hub-photo" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      <p className="text-xs text-muted-foreground mt-1">JPG or PNG, square works best.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label>Name</Label><Input value={profile.name || ""} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={profile.email || ""} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" value={profile.phone || ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Bio</Label><Textarea rows={4} value={profile.bio || ""} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell pupils about yourself..." /></div>
                  <Button onClick={handleProfileSave} disabled={saving} className="w-full">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save changes
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vehicle">
            <div className="bg-card rounded-2xl border p-6">
              <InstructorDetailsEditor instructorId={instructorId} />
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="bg-card rounded-2xl border p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><ImagePlus className="h-4 w-4 text-muted-foreground" /><Label className="font-medium">Banner Image</Label></div>
                <CMSImageUpload value={profile?.hero_image_url || null} onChange={(url) => updateField("hero_image_url", url)} bucket="instructor-images" folder={instructorId} label="" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><CarIcon className="h-4 w-4 text-muted-foreground" /><Label className="font-medium">Car Photo</Label></div>
                <CMSImageUpload value={profile?.car_image_url || null} onChange={(url) => updateField("car_image_url", url)} bucket="instructor-images" folder={instructorId} label="" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" /><Label className="font-medium">Welcome Video URL</Label></div>
                <Input placeholder="https://youtube.com/watch?v=..." value={profile?.welcome_video_url || ""} onChange={e => setProfile(p => p ? { ...p, welcome_video_url: e.target.value } : null)} />
                <Button size="sm" variant="outline" onClick={() => updateField("welcome_video_url", profile?.welcome_video_url ?? null)}>Save Video URL</Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-muted-foreground" /><Label className="font-medium">ADI Certificate</Label></div>
                <CMSImageUpload value={profile?.adi_certificate_url || null} onChange={(url) => updateField("adi_certificate_url", url)} bucket="instructor-images" folder={instructorId} label="" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="bg-card rounded-2xl border p-6">
              <ComplianceTracker instructorId={instructorId} />
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div className="bg-card rounded-2xl border p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Plan & Billing</p>
                  <p className="text-sm text-muted-foreground">Manage your subscription, payment method and invoices.</p>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/instructor/billing">Open Plan & Billing</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </InstructorPortalLayout>
  );
}
