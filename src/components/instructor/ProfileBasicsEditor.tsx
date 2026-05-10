import { useEffect, useState } from "react";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast as uiToast } from "@/hooks/use-toast";
import { AvatarRepositionDialog } from "./AvatarRepositionDialog";

interface Props {
  instructorId: string;
}

interface Row {
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
}

export function ProfileBasicsEditor({ instructorId }: Props) {
  const [profile, setProfile] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("name, email, phone, bio, profile_image_url")
        .eq("id", instructorId)
        .single();
      if (!error && data) setProfile(data as Row);
      setLoading(false);
    })();
  }, [instructorId]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
      })
      .eq("id", instructorId);
    setSaving(false);
    uiToast({
      title: error ? "Error" : "Profile updated",
      variant: error ? "destructive" : undefined,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setUploading(true);
    try {
      const fileName = `${instructorId}/profile.jpg`;
      const { error: upErr } = await supabase.storage
        .from("instructor-images")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("instructor-images").getPublicUrl(fileName);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("instructors")
        .update({ profile_image_url: cacheBusted })
        .eq("id", instructorId);
      if (updErr) throw updErr;
      setProfile((p) => (p ? { ...p, profile_image_url: cacheBusted } : null));
      setPendingFile(null);
      uiToast({ title: "Photo updated" });
    } catch {
      uiToast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.profile_image_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="profile-photo" className="cursor-pointer">
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
            id="profile-photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <p className="text-xs text-muted-foreground mt-1">
            JPG or PNG, square works best.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          value={profile.email || ""}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input
          type="tel"
          value={profile.phone || ""}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea
          rows={4}
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell pupils about yourself..."
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save changes
      </Button>
    </div>
  );
}
