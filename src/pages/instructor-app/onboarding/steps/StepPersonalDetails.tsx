import { useState } from "react";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { StepNavigation } from "../components/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepPersonalDetailsProps {
  data: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    profile_image_url: string | null;
  };
  instructorId: string;
  onUpdate: (data: Partial<StepPersonalDetailsProps["data"]>) => void;
  onNext: () => void;
}

export function StepPersonalDetails({
  data,
  instructorId,
  onUpdate,
  onNext,
}: StepPersonalDetailsProps) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const { data: urlData } = supabase.storage
        .from("instructor-images")
        .getPublicUrl(fileName);

      onUpdate({ profile_image_url: urlData.publicUrl });
      toast.success("Photo uploaded!");
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const canProceed = data.name.trim().length >= 2 && data.phone.trim().length >= 10;

  return (
    <OnboardingLayout
      step={1}
      totalSteps={8}
      title="Tell Us About Yourself"
      description="Let's start with your basic information"
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={data.profile_image_url || undefined} />
              <AvatarFallback className="bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full"
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Add a photo to help pupils recognise you
          </p>
        </div>

        {/* Name (pre-filled from signup) */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="John Smith"
          />
        </div>

        {/* Email (read-only, from signup) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            This is your login email and cannot be changed here
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="07700 900000"
          />
          <p className="text-xs text-muted-foreground">
            Pupils will use this to contact you
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">About You (Optional)</Label>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            placeholder="Tell pupils a bit about yourself, your experience, and teaching style..."
            rows={4}
          />
        </div>
      </div>

      <StepNavigation
        onNext={onNext}
        showBack={false}
        canProceed={canProceed}
        nextLabel="Continue"
      />
    </OnboardingLayout>
  );
}
